import type { FastifyRequest, FastifyReply } from 'fastify'
import type { PrismaClient } from '@prisma/client'
import { can } from './rbac.policy'
import type { Action, Resource, RbacContext, OwnershipData } from './rbac.schema'
import type { Role, Visibility } from '../../shared/schemas'
import { err } from '../../shared/errors'

interface AuthenticatedRequest extends FastifyRequest {
    user?: {
        id: string
        role: Role
        email: string
    }
}

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
    request: AuthenticatedRequest,
    resource: Resource
): Promise<OwnershipData> {
    // Get Prisma instance from request
    const client = request.prisma
    if (!isPrismaClient(client)) {
        throw err('DATABASE_ERROR', 'Prisma instance not available')
    }

    // Extract ID from params if available
    const id =
        request.params && typeof request.params === 'object' && 'id' in request.params
            ? (request.params as { id: string }).id
            : null

    if (!id) {
        // Fallback for creation routes - get from request body
        if (request.body && typeof request.body === 'object' && request.body !== null) {
            const body = request.body as Record<string, unknown>
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
    return async function rbacMiddleware(request: AuthenticatedRequest, _reply: FastifyReply) {
        // Check if RBAC is disabled (for testing/development)
        const disabled = process.env.RBAC_ENABLED === 'false'
        if (disabled) {
            return
        }

        // Require authentication for non-read actions
        if (!request.user && action !== 'read') {
            throw err('UNAUTHORIZED', 'Login required')
        }

        // Get route-specific RBAC config if available
        const routeConfig =
            request.routeOptions?.config &&
            typeof request.routeOptions.config === 'object' &&
            'rbac' in request.routeOptions.config
                ? (request.routeOptions.config as { rbac?: OwnershipData }).rbac
                : undefined

        // Resolve ownership context
        const resolved =
            routeConfig?.ownerId || routeConfig?.visibility
                ? routeConfig
                : await resolveOwnership(request, resource)

        // Build RBAC context
        const context: RbacContext = {
            user: request.user ? { id: request.user.id, role: request.user.role } : undefined,
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
