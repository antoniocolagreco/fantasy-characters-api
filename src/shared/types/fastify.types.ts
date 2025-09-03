import type { AuthenticatedUser } from '../../features/auth/auth.schema'
import type { PrismaClient } from '@prisma/client'

declare module 'fastify' {
    interface FastifyRequest {
        user?: AuthenticatedUser
        prisma?: PrismaClient
    }
}
