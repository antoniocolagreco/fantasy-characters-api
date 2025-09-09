import type { FastifyInstance } from 'fastify'
import { beforeAll, describe, expect, it } from 'vitest'

import { buildApp } from '@/app'
import { passwordService } from '@/features/auth/password.service'
import prismaService from '@/infrastructure/database/prisma.service'
import { HTTP_STATUS } from '@/shared/constants'
import { generateUUIDv7 } from '@/shared/utils'
import { createAuthHeaders } from '@/tests/helpers/test.helper'

describe('Archetypes API - stats', () => {
    let app: FastifyInstance

    beforeAll(async () => {
        app = await buildApp()
    })

    it('forbids stats for regular user', async () => {
        const passwordHash = await passwordService.hashPassword('test-password-123')
        const userId = generateUUIDv7()
        await prismaService.user.create({
            data: {
                id: userId,
                email: 'archetype-stats-user@test.local',
                passwordHash,
                role: 'USER',
                name: 'Archetype Stats User',
                isEmailVerified: true,
                isActive: true,
                isBanned: false,
            },
        })
        const res = await app.inject({
            method: 'GET',
            url: '/api/v1/archetypes/stats',
            headers: createAuthHeaders({ id: userId, role: 'USER' }),
        })
        expect(res.statusCode).toBe(HTTP_STATUS.FORBIDDEN)
    })
})
