import type { FastifyInstance } from 'fastify'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { buildApp } from '@/app'
import { passwordService } from '@/features/auth/password.service'
import prismaService from '@/infrastructure/database/prisma.service'
import { generateUUIDv7 } from '@/shared/utils'
import { createAuthHeaders } from '@/tests/helpers/auth.helper'

// Mirrors skills.create.test.ts

describe('Perks API v1 - Create', () => {
    let app: FastifyInstance

    beforeAll(async () => {
        app = await buildApp()
        await app.ready()
    })

    afterAll(async () => {
        await app.close()
    })

    beforeEach(async () => {
        process.env.RBAC_ENABLED = 'true'
    })

    describe('POST /api/v1/perks', () => {
        it('creates with default visibility and requiredLevel', async () => {
            const passwordHash = await passwordService.hashPassword('test-password-123')
            const testUser = await prismaService.user.create({
                data: {
                    id: generateUUIDv7(),
                    email: 'perk-user@test.local',
                    passwordHash,
                    role: 'USER',
                    name: 'Perk User',
                    isEmailVerified: true,
                    isActive: true,
                    isBanned: false,
                },
            })

            const payload = { name: 'Keen Sight', description: 'Improves detection range' }
            const response = await app.inject({
                method: 'POST',
                url: '/api/v1/perks',
                payload,
                headers: {
                    'content-type': 'application/json',
                    ...createAuthHeaders({ id: testUser.id, role: 'USER' }),
                },
            })

            expect(response.statusCode).toBe(201)
            const body = response.json()
            expect(body.data).toMatchObject({
                name: payload.name,
                description: payload.description,
                visibility: 'PUBLIC',
                ownerId: testUser.id,
                requiredLevel: 1,
            })
        })

        it('requires authentication', async () => {
            const response = await app.inject({
                method: 'POST',
                url: '/api/v1/perks',
                payload: { name: 'Silent Step' },
                headers: { 'content-type': 'application/json' },
            })
            expect(response.statusCode).toBe(401)
        })
    })
})
