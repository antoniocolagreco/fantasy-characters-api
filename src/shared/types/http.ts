import type { Role } from '../schemas'

// Minimal shapes used across features and tests without coupling to Fastify
export type BasicRequestUser = { id: string; role: Role | string; email?: string }

export type BasicRequest = {
    user?: BasicRequestUser
    routeOptions?: { config?: unknown }
    params?: unknown
    body?: unknown
    prisma?: unknown
}

export type BasicReply = {
    code: (statusCode: number) => unknown
    send: (payload: unknown) => unknown
    header: (name: string, value: string) => unknown
}

export type OwnershipRequest = Pick<BasicRequest, 'params' | 'body' | 'prisma'>

export type RbacMiddlewareRequest = BasicRequest
export type RbacMiddlewareReply = BasicReply

// Auth-specific minimal request
export type BasicAuthRequest = BasicRequest & {
    headers?: Record<string, string | undefined>
}
