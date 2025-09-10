import fastifySwagger from '@fastify/swagger'
import fastifySwaggerUi from '@fastify/swagger-ui'
import type { FastifyInstance, FastifySchema } from 'fastify'
import fp from 'fastify-plugin'

import { config } from '@/infrastructure/config'

/**
 * Swagger/OpenAPI documentation plugin
 */
export const swaggerPlugin = fp(
    async function (fastify: FastifyInstance): Promise<void> {
        // Register Swagger schema generator
        await fastify.register(fastifySwagger, {
            openapi: {
                info: {
                    title: 'Fantasy Characters API',
                    description:
                        'A comprehensive API for managing fantasy characters, races, classes, and equipment',
                    version: '1.0.0',
                    contact: {
                        name: 'Antonio Colagreco',
                        email: 'nevenbridge@gmail.com',
                    },
                    license: {
                        name: 'MIT',
                        url: 'https://opensource.org/licenses/MIT',
                    },
                },
                servers: [
                    {
                        url: `http://localhost:${config.PORT}`,
                        description: 'Development server',
                    },
                ],
                components: {
                    securitySchemes: {
                        bearerAuth: {
                            type: 'http',
                            scheme: 'bearer',
                            bearerFormat: 'JWT',
                            description: 'JWT token for authentication',
                        },
                    },
                },
                security: [
                    {
                        bearerAuth: [],
                    },
                ],
                tags: [
                    { name: 'Health', description: 'Health check endpoints' },
                    {
                        name: 'Authentication',
                        description: 'User authentication and authorization',
                    },
                    { name: 'Users', description: 'User management operations' },
                    { name: 'Characters', description: 'Character management operations' },
                    { name: 'Races', description: 'Race management operations' },
                    { name: 'Archetypes', description: 'Archetype management operations' },
                    { name: 'Items', description: 'Item management operations' },
                    { name: 'Skills', description: 'Skill management operations' },
                    { name: 'Perks', description: 'Perk management operations' },
                    { name: 'Tags', description: 'Tag management operations' },
                    { name: 'Images', description: 'Image management operations' },
                    { name: 'Equipment', description: 'Equipment management operations' },
                ],
            },
            hideUntagged: false, // Show all endpoints for debugging
            // Keep $id references so schemas are hoisted into components.schemas
            refResolver: {
                buildLocalReference(json, _baseUri, _fragment, i) {
                    // Prefer TypeBox $id for stable model names; fallback to def-i
                    // json may be unknown; ensure string result
                    const maybeObj = json as { $id?: unknown }
                    const id =
                        typeof maybeObj?.$id === 'string' && maybeObj.$id.length > 0
                            ? (maybeObj.$id as string)
                            : undefined
                    return typeof id === 'string' && id.length > 0 ? id : `def-${i}`
                },
            },
            // Scrub non-OpenAPI keywords from route schemas when generating docs only
            transform: ({ schema, url }) => {
                // Remove JSON-Schema-only or tool-specific keys that OAS 3.x does not allow
                // Keep $ref intact. Strip everything else starting with "$"
                const EXPLICIT_STRIP = new Set([
                    'transform',
                    'examples',
                    'errorMessage',
                    'patternProperties',
                    'unevaluatedProperties',
                ])

                function shouldStripKey(key: string): boolean {
                    if (key === '$ref' || key === '$id') return false
                    if (key.startsWith('$')) return true // strips $schema, etc.
                    return EXPLICIT_STRIP.has(key)
                }

                function scrub(input: unknown): unknown {
                    if (Array.isArray(input)) return input.map(scrub)
                    if (input && typeof input === 'object') {
                        const src = input as Record<string, unknown>
                        const out: Record<string, unknown> = {}
                        // Preserve a stable vendor extension for schema id so it survives OpenAPI conversion
                        const id = typeof src.$id === 'string' ? (src.$id as string) : undefined
                        if (id) out['x-schema-id'] = id
                        for (const [k, v] of Object.entries(src)) {
                            if (shouldStripKey(k)) continue
                            out[k] = scrub(v)
                        }
                        return out
                    }
                    return input
                }

                const cleanedSchema: FastifySchema = {
                    ...schema,
                    // Scrub known validation containers
                    body: scrub(schema.body),
                    params: scrub(schema.params),
                    querystring: scrub(schema.querystring),
                    headers: scrub(schema.headers),
                    response: scrub(schema.response),
                }
                return { schema: cleanedSchema, url }
            },
        })

        // Register Swagger UI
        await fastify.register(fastifySwaggerUi, {
            routePrefix: '/docs',
            uiConfig: {
                docExpansion: 'list',
                deepLinking: true,
                defaultModelsExpandDepth: 2,
                defaultModelExpandDepth: 2,
                supportedSubmitMethods: ['get', 'post', 'put', 'delete', 'patch'],
                showMutatedRequest: false,
                persistAuthorization: true,
            },
            // Disable staticCSP to avoid double CSP with helmet in dev
            staticCSP: false,
            transformSpecificationClone: true,
            // As a final safety net, scrub non-OAS keywords from the built spec
            transformSpecification: (
                swaggerObject: Readonly<Record<string, unknown>>,
                _request,
                _reply
            ): Record<string, unknown> => {
                const EXPLICIT_STRIP = new Set([
                    'transform',
                    'examples',
                    'errorMessage',
                    'patternProperties',
                    'unevaluatedProperties',
                ])
                function shouldStripKey(key: string): boolean {
                    if (key === '$ref' || key === '$id' || key === 'x-schema-id') return false
                    if (key.startsWith('$')) return true
                    return EXPLICIT_STRIP.has(key)
                }
                // Normalize JSON Schema nullability (TypeBox Null) to OpenAPI 3.0 nullable
                function normalizeNullable(obj: Record<string, unknown>): Record<string, unknown> {
                    const keys = ['anyOf', 'oneOf'] as const
                    for (const key of keys) {
                        const alt = obj[key]
                        if (Array.isArray(alt) && alt.length === 2) {
                            const a = alt[0]
                            const b = alt[1]
                            const isNullA =
                                a &&
                                typeof a === 'object' &&
                                (a as Record<string, unknown>).type === 'null'
                            const isNullB =
                                b &&
                                typeof b === 'object' &&
                                (b as Record<string, unknown>).type === 'null'
                            const schema = isNullA ? b : isNullB ? a : null
                            if (schema && typeof schema === 'object') {
                                // Replace anyOf/oneOf with the other schema and nullable: true
                                const { $ref, ...rest } = schema as Record<string, unknown>
                                // Clear the combiner
                                delete obj[key]
                                if ($ref && typeof $ref === 'string') {
                                    obj.$ref = $ref
                                    obj.nullable = true
                                    // Merge remaining properties if any
                                    for (const [rk, rv] of Object.entries(rest)) obj[rk] = rv
                                } else {
                                    // Inline schema: merge into current level
                                    for (const [rk, rv] of Object.entries(schema)) obj[rk] = rv
                                    obj.nullable = true
                                }
                            }
                        }
                    }
                    return obj
                }
                function scrub(input: unknown): unknown {
                    if (Array.isArray(input)) return input.map(scrub)
                    if (input && typeof input === 'object') {
                        let out: Record<string, unknown> = {}
                        for (const [k, v] of Object.entries(input)) {
                            if (shouldStripKey(k)) continue
                            out[k] = scrub(v)
                        }
                        // After recursive scrub, normalize anyOf/oneOf + null → nullable
                        out = normalizeNullable(out)
                        return out
                    }
                    return input
                }
                // Second pass: hoist all objects with $id into components.schemas and replace with $ref
                function isSchemaLike(obj: Record<string, unknown>): boolean {
                    return (
                        'type' in obj ||
                        'properties' in obj ||
                        'allOf' in obj ||
                        'anyOf' in obj ||
                        'oneOf' in obj ||
                        'enum' in obj ||
                        'format' in obj
                    )
                }
                function hoistSchemas(spec: Record<string, unknown>): Record<string, unknown> {
                    const components = (spec.components as Record<string, unknown>) || {}
                    const existingSchemas = (components.schemas as Record<string, unknown>) || {}
                    const collected: Record<string, unknown> = { ...existingSchemas }

                    const seen = new WeakSet<object>()
                    function visit(node: unknown, path: string[]): unknown {
                        if (Array.isArray(node))
                            return node.map((n, i) => visit(n, path.concat(String(i))))
                        if (!node || typeof node !== 'object') return node
                        if (seen.has(node as object)) return node
                        seen.add(node as object)

                        const obj = node as Record<string, unknown>
                        // Do not transform already-component schemas
                        if (path.length >= 3 && path[0] === 'components' && path[1] === 'schemas') {
                            // Still traverse children to normalize nested schemas
                            for (const [k, v] of Object.entries(obj))
                                obj[k] = visit(v, path.concat(k))
                            return obj
                        }

                        // If this node looks like a schema and has $id, hoist it
                        const id =
                            (typeof obj['x-schema-id'] === 'string'
                                ? (obj['x-schema-id'] as string)
                                : undefined) ||
                            (typeof obj.$id === 'string' ? (obj.$id as string) : undefined)
                        if (id && isSchemaLike(obj)) {
                            // Clone without $id and vendor id, then recursively process nested children
                            const rest: Record<string, unknown> = { ...obj }
                            delete rest.$id
                            delete (rest as Record<string, unknown>)['x-schema-id']
                            const processed: Record<string, unknown> = {}
                            for (const [k, v] of Object.entries(rest))
                                processed[k] = visit(v, path.concat(k))
                            if (!collected[id]) collected[id] = processed
                            return { $ref: `#/components/schemas/${id}` }
                        }

                        // Regular object: recurse
                        for (const [k, v] of Object.entries(obj)) obj[k] = visit(v, path.concat(k))
                        return obj
                    }

                    const transformed = visit(spec, []) as Record<string, unknown>
                    return {
                        ...transformed,
                        components: {
                            ...(transformed.components as Record<string, unknown>),
                            schemas: collected,
                        },
                    }
                }

                const scrubbed = scrub(swaggerObject) as Record<string, unknown>
                const hoisted = hoistSchemas(scrubbed)
                return hoisted
            },
        })

        // The /docs/json route is automatically registered by @fastify/swagger
        // As a final guard, scrub the JSON returned by docs endpoints so validators accept it
        fastify.addHook('onSend', async (request, reply, payload) => {
            try {
                if (request.method !== 'GET') return

                let json: unknown
                if (typeof payload === 'string') {
                    json = JSON.parse(payload)
                } else if (Buffer.isBuffer(payload)) {
                    json = JSON.parse(payload.toString('utf8'))
                } else if (payload && typeof payload === 'object') {
                    json = payload as unknown
                } else {
                    return
                }

                // Only scrub OpenAPI specs (avoid changing other JSON responses)
                if (!json || typeof json !== 'object') return
                const obj = json as Record<string, unknown>
                const isOpenApi =
                    (typeof obj.openapi === 'string' || typeof obj.swagger === 'string') &&
                    typeof obj.paths === 'object'
                if (!isOpenApi) return

                const EXPLICIT_STRIP = new Set([
                    'transform',
                    'examples',
                    'errorMessage',
                    'patternProperties',
                    'unevaluatedProperties',
                ])
                const shouldStripKey = (key: string) =>
                    !(key === '$ref' || key === '$id' || key === 'x-schema-id') &&
                    (key.startsWith('$') || EXPLICIT_STRIP.has(key))
                const normalizeNullable = (
                    obj: Record<string, unknown>
                ): Record<string, unknown> => {
                    const keys = ['anyOf', 'oneOf'] as const
                    for (const key of keys) {
                        const alt = obj[key]
                        if (Array.isArray(alt) && alt.length === 2) {
                            const a = alt[0]
                            const b = alt[1]
                            const isNullA =
                                a &&
                                typeof a === 'object' &&
                                (a as Record<string, unknown>).type === 'null'
                            const isNullB =
                                b &&
                                typeof b === 'object' &&
                                (b as Record<string, unknown>).type === 'null'
                            const schema = isNullA ? b : isNullB ? a : null
                            if (schema && typeof schema === 'object') {
                                const { $ref, ...rest } = schema as Record<string, unknown>
                                delete obj[key]
                                if ($ref && typeof $ref === 'string') {
                                    obj.$ref = $ref
                                    obj.nullable = true
                                    for (const [rk, rv] of Object.entries(rest)) obj[rk] = rv
                                } else {
                                    for (const [rk, rv] of Object.entries(schema)) obj[rk] = rv
                                    obj.nullable = true
                                }
                            }
                        }
                    }
                    return obj
                }
                const scrub = (input: unknown): unknown => {
                    if (Array.isArray(input)) return input.map(scrub)
                    if (input && typeof input === 'object') {
                        const src = input as Record<string, unknown>
                        let out: Record<string, unknown> = {}
                        const id = typeof src.$id === 'string' ? (src.$id as string) : undefined
                        if (id) out['x-schema-id'] = id
                        for (const [k, v] of Object.entries(src)) {
                            if (shouldStripKey(k)) continue
                            out[k] = scrub(v)
                        }
                        out = normalizeNullable(out)
                        return out
                    }
                    return input
                }

                const cleaned = scrub(json)
                // Hoist $id schemas to components.schemas and replace with $ref
                const hoistSchemas = (spec: Record<string, unknown>): Record<string, unknown> => {
                    const components = (spec.components as Record<string, unknown>) || {}
                    const existingSchemas = (components.schemas as Record<string, unknown>) || {}
                    const collected: Record<string, unknown> = { ...existingSchemas }
                    const seen = new WeakSet<object>()
                    const isSchemaLike = (obj: Record<string, unknown>) =>
                        'type' in obj ||
                        'properties' in obj ||
                        'allOf' in obj ||
                        'anyOf' in obj ||
                        'oneOf' in obj ||
                        'enum' in obj ||
                        'format' in obj
                    const visit = (node: unknown, path: string[]): unknown => {
                        if (Array.isArray(node))
                            return node.map((n, i) => visit(n, path.concat(String(i))))
                        if (!node || typeof node !== 'object') return node
                        if (seen.has(node as object)) return node
                        seen.add(node as object)
                        const obj = node as Record<string, unknown>
                        if (path.length >= 3 && path[0] === 'components' && path[1] === 'schemas') {
                            for (const [k, v] of Object.entries(obj))
                                obj[k] = visit(v, path.concat(k))
                            return obj
                        }
                        const id = typeof obj.$id === 'string' ? (obj.$id as string) : undefined
                        if (id && isSchemaLike(obj)) {
                            const rest: Record<string, unknown> = { ...obj }
                            delete rest.$id
                            const processed: Record<string, unknown> = {}
                            for (const [k, v] of Object.entries(rest))
                                processed[k] = visit(v, path.concat(k))
                            if (!collected[id]) collected[id] = processed
                            return { $ref: `#/components/schemas/${id}` }
                        }
                        for (const [k, v] of Object.entries(obj)) obj[k] = visit(v, path.concat(k))
                        return obj
                    }
                    const transformed = visit(spec, []) as Record<string, unknown>
                    return {
                        ...transformed,
                        components: {
                            ...(transformed.components as Record<string, unknown>),
                            schemas: collected,
                        },
                    }
                }
                const hoisted = hoistSchemas(cleaned as Record<string, unknown>)
                const serialized = JSON.stringify(hoisted)
                reply.header('content-length', Buffer.byteLength(serialized))
                return serialized
            } catch {
                // In case of any error, fall back to the original payload
                return payload
            }
        })
    },
    { name: 'swaggerPlugin', encapsulate: false }
)
