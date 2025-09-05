import type { PrismaClient } from '@prisma/client'

import type { AuthenticatedUser } from '@/features/auth'

declare module 'fastify' {
    interface FastifyRequest {
        user?: AuthenticatedUser
        prisma?: PrismaClient
    }
}
