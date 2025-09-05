import type { FastifyReply, FastifyRequest } from 'fastify'

import { userService } from '..'

import type {
    BanUser,
    CreateUserInput,
    UpdateUser,
    User,
    UserListQuery,
    UserParams,
} from '@/features/users/users.type'

function envelope<T>(data: T, requestId?: string) {
    return { data, requestId, timestamp: new Date().toISOString() }
}

export async function getUserById(
    request: FastifyRequest<{ Params: UserParams }>,
    reply: FastifyReply
) {
    const user = await userService.getById(request.params.id)
    return reply.code(200).send(envelope(user, request.id))
}

export async function listUsers(
    request: FastifyRequest<{ Querystring: UserListQuery }>,
    reply: FastifyReply
) {
    const { users, pagination } = await userService.list(request.query)
    return reply.code(200).send({ ...envelope(users, request.id), pagination })
}

export async function getUserStats(_request: FastifyRequest, reply: FastifyReply) {
    const stats = await userService.getStats()
    return reply.code(200).send(envelope(stats))
}

export async function createUser(
    request: FastifyRequest<{ Body: CreateUserInput }>,
    reply: FastifyReply
) {
    const user = await userService.create(request.body)
    return reply.code(201).send(envelope(user, request.id))
}

export async function updateUser(
    request: FastifyRequest<{ Params: UserParams; Body: UpdateUser }>,
    reply: FastifyReply
) {
    const user = await userService.update(request.params.id, request.body)
    return reply.code(200).send(envelope(user, request.id))
}

export async function deleteUser(
    request: FastifyRequest<{ Params: UserParams }>,
    reply: FastifyReply
) {
    await userService.delete(request.params.id)
    return reply.code(204).send()
}

export async function banUser(
    request: FastifyRequest<{ Params: UserParams; Body: BanUser }>,
    reply: FastifyReply
) {
    // Get bannedById from authenticated user
    const bannedById = request.user?.id
    if (!bannedById) {
        return reply.code(401).send({ error: 'Authentication required' })
    }

    // If banReason is not provided or empty, treat as unban
    const isUnban = !request.body.banReason && !request.body.bannedUntil

    let user: User
    if (isUnban) {
        user = await userService.unban(request.params.id)
    } else {
        user = await userService.ban(request.params.id, request.body, bannedById)
    }

    return reply.code(200).send(envelope(user, request.id))
}
