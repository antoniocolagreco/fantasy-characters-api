import type { PrismaClient } from '@prisma/client'

import { can } from '@/features/auth/rbac.policy'
import type { Action, OwnershipData, RbacContext, Resource } from '@/features/auth/rbac.schema'
import { err } from '@/shared/errors'
import type { Role, Visibility } from '@/shared/schemas'
import type {
    OwnershipRequest,
    RbacMiddlewareReply,
    RbacMiddlewareRequest,
} from '@/shared/types/http'
import { hasId, isRecord } from '@/shared/utils/type-guards'
// Note: We intentionally avoid depending on Fastify types here to keep
// the middleware easy to unit-test with plain objects.

function isValidRole(role: unknown): role is Role {
    return typeof role === 'string' && ['ADMIN', 'MODERATOR', 'USER'].includes(role)
}

function isValidVisibility(visibility: unknown): visibility is Visibility {
    return typeof visibility === 'string' && ['PUBLIC', 'PRIVATE', 'HIDDEN'].includes(visibility)
}

function isPrismaClient(client: unknown): client is PrismaClient {
    return (
        typeof client === 'object' && client !== null && 'user' in client && 'character' in client
    )
}

/**
 * Resolve ownership and context information for RBAC checks
 */
export async function resolveOwnership(
    request: OwnershipRequest,
    resource: Resource
): Promise<OwnershipData> {
    // Get Prisma instance from request
    const client = request.prisma
    if (!isPrismaClient(client)) {
        throw err('DATABASE_ERROR', 'Prisma instance not available')
    }

    // Extract ID from params if available
    const id = hasId(request.params) ? request.params.id : null

    if (!id) {
        // Fallback for creation routes - get from request body
        if (isRecord(request.body)) {
            const { body } = request
            return {
                ownerId: typeof body.ownerId === 'string' ? body.ownerId : null,
                visibility: isValidVisibility(body.visibility) ? body.visibility : null,
            }
        }
        return {}
    }

    try {
        switch (resource) {
            case 'characters': {
                const row = await client.character.findUnique({
                    where: { id },
                    select: {
                        ownerId: true,
                        visibility: true,
                        owner: { select: { role: true } },
                    },
                })
                return {
                    ownerId: row?.ownerId ?? null,
                    visibility: row && isValidVisibility(row.visibility) ? row.visibility : null,
                    ownerRole: row?.owner && isValidRole(row.owner.role) ? row.owner.role : null,
                }
            }

            case 'users': {
                const row = await client.user.findUnique({
                    where: { id },
                    select: { id: true, role: true },
                })
                return {
                    ownerId: row?.id ?? null,
                    targetUserRole: row && isValidRole(row.role) ? row.role : null,
                }
            }

            case 'images': {
                const row = await client.image.findUnique({
                    where: { id },
                    select: {
                        ownerId: true,
                        visibility: true,
                        owner: { select: { role: true } },
                    },
                })
                return {
                    ownerId: row?.ownerId ?? null,
                    visibility: row && isValidVisibility(row.visibility) ? row.visibility : null,
                    ownerRole: row?.owner && isValidRole(row.owner.role) ? row.owner.role : null,
                }
            }

            case 'tags': {
                const row = await client.tag.findUnique({
                    where: { id },
                    select: { ownerId: true, owner: { select: { role: true } } },
                })
                return {
                    ownerId: row?.ownerId ?? null,
                    ownerRole: row?.owner && isValidRole(row.owner.role) ? row.owner.role : null,
                }
            }

            case 'skills': {
                const row = await client.skill.findUnique({
                    where: { id },
                    select: { ownerId: true, owner: { select: { role: true } } },
                })
                return {
                    ownerId: row?.ownerId ?? null,
                    ownerRole: row?.owner && isValidRole(row.owner.role) ? row.owner.role : null,
                }
            }

            case 'perks': {
                const row = await client.perk.findUnique({
                    where: { id },
                    select: { ownerId: true, owner: { select: { role: true } } },
                })
                return {
                    ownerId: row?.ownerId ?? null,
                    ownerRole: row?.owner && isValidRole(row.owner.role) ? row.owner.role : null,
                }
            }

            case 'races': {
                const row = await client.race.findUnique({
                    where: { id },
                    select: { ownerId: true, owner: { select: { role: true } } },
                })
                return {
                    ownerId: row?.ownerId ?? null,
                    ownerRole: row?.owner && isValidRole(row.owner.role) ? row.owner.role : null,
                }
            }

            case 'archetypes': {
                const row = await client.archetype.findUnique({
                    where: { id },
                    select: { ownerId: true, owner: { select: { role: true } } },
                })
                return {
                    ownerId: row?.ownerId ?? null,
                    ownerRole: row?.owner && isValidRole(row.owner.role) ? row.owner.role : null,
                }
            }

            case 'items': {
                const row = await client.item.findUnique({
                    where: { id },
                    select: { ownerId: true, owner: { select: { role: true } } },
                })
                return {
                    ownerId: row?.ownerId ?? null,
                    ownerRole: row?.owner && isValidRole(row.owner.role) ? row.owner.role : null,
                }
            }

            case 'equipment': {
                // Equipment is 1:1 with character. Ownership is derived from character.ownerId.
                const row = await client.equipment.findUnique({
                    where: { id },
                    select: {
                        character: {
                            select: {
                                ownerId: true,
                                owner: { select: { role: true } },
                                visibility: true,
                            },
                        },
                    },
                })
                const character = row?.character
                return {
                    ownerId: character?.ownerId ?? null,
                    visibility:
                        character && isValidVisibility(character.visibility)
                            ? character.visibility
                            : null,
                    ownerRole:
                        character?.owner && isValidRole(character.owner.role)
                            ? character.owner.role
                            : null,
                }
            }

            default:
                return {}
        }
    } catch {
        // Return empty object if query fails
        return {}
    }
}

/**
 * Create RBAC preHandler middleware for Fastify routes
 */
export function createRbacMiddleware(resource: Resource, action: Action) {
    return async function rbacMiddleware(
        request: RbacMiddlewareRequest,
        _reply: RbacMiddlewareReply
    ): Promise<void> {
        // Check if RBAC is disabled (for testing/development)
        const disabled = process.env.RBAC_ENABLED === 'false'
        if (disabled) {
            return
        }

        // Require authentication for non-read actions
        if (!request.user && action !== 'read') {
            throw err('UNAUTHORIZED', 'Login required')
        }

        // Concealment policy: allow all read requests to proceed. Service layer will
        // enforce visibility (returning 404 when resource not viewable) and RBAC nuances.
        if (action === 'read') {
            return
        }

        // Get route-specific RBAC config if available
        const routeConfig = (() => {
            const ro = request.routeOptions
            const cfg = isRecord(ro) ? (ro as { config?: unknown }).config : undefined
            if (isRecord(cfg) && 'rbac' in cfg) {
                return (cfg as { rbac?: OwnershipData }).rbac
            }
            return undefined
        })()

        // Resolve ownership context (only needed for non-read actions)
        const resolved =
            routeConfig?.ownerId || routeConfig?.visibility
                ? routeConfig
                : await resolveOwnership(request, resource)

        // Build RBAC context
        const context: RbacContext = {
            user:
                request.user && isValidRole(request.user.role)
                    ? { id: request.user.id, role: request.user.role }
                    : undefined,
            resource,
            action,
            ownerId: resolved.ownerId ?? undefined,
            visibility: resolved.visibility ?? undefined,
            ownerRole: resolved.ownerRole ?? undefined,
            targetUserRole: resolved.targetUserRole ?? undefined,
        }

        // Check permissions
        const allowed = can(context)
        if (!allowed) {
            throw err('FORBIDDEN', 'Not allowed')
        }
    }
}

/**
 * Convenience RBAC helpers for common patterns
 */
export const rbac = {
    read: (resource: Resource) => createRbacMiddleware(resource, 'read'),
    create: (resource: Resource) => createRbacMiddleware(resource, 'create'),
    update: (resource: Resource) => createRbacMiddleware(resource, 'update'),
    delete: (resource: Resource) => createRbacMiddleware(resource, 'delete'),
    manage: (resource: Resource) => createRbacMiddleware(resource, 'manage'),
}

/**
 * Adapter: wrap our RBAC middleware into a Fastify-compatible preHandler
 * without leaking Fastify types into the RBAC domain.
 */
export function toFastifyPreHandler(
    fn: (req: RbacMiddlewareRequest, reply: RbacMiddlewareReply) => Promise<void>
) {
    return async function preHandler(request: unknown, reply: unknown): Promise<void> {
        // Build a minimal BasicRequest safely without type assertions
        const rq: RbacMiddlewareRequest = (() => {
            const result: RbacMiddlewareRequest = {}
            if (isRecord(request)) {
                // user
                const u = request.user
                if (isRecord(u)) {
                    if (typeof u.id === 'string' && typeof u.role === 'string') {
                        result.user = { id: u.id, role: u.role }
                    }
                }

                // routeOptions
                const ro = request.routeOptions
                if (isRecord(ro)) {
                    result.routeOptions = { config: ro.config }
                }

                // passthrough unknowns
                if ('params' in request) result.params = request.params
                if ('body' in request) result.body = request.body
                if ('prisma' in request) result.prisma = request.prisma
            }
            return result
        })()

        // Build a minimal BasicReply using wrapper functions to preserve types
        const rp: RbacMiddlewareReply = {
            code: (statusCode: number) => {
                if (isRecord(reply) && typeof reply.code === 'function') {
                    return reply.code(statusCode)
                }
                return undefined
            },
            send: (payload: unknown) => {
                if (isRecord(reply) && typeof reply.send === 'function') {
                    return reply.send(payload)
                }
                return undefined
            },
            header: (name: string, value: string) => {
                if (isRecord(reply) && typeof reply.header === 'function') {
                    return reply.header(name, value)
                }
                return undefined
            },
        }

        await fn(rq, rp)
    }
}
