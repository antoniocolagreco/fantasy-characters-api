import type { FastifyInstance } from 'fastify'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { buildApp } from '@/app'
import { passwordService } from '@/features/auth/password.service'
import prismaService from '@/infrastructure/database/prisma.service'
import { generateUUIDv7 } from '@/shared/utils'
import { createAuthHeaders } from '@/tests/helpers/auth.helper'

describe('Skills API v1 - Create', () => {
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

    describe('POST /api/v1/skills', () => {
        it('creates with default visibility', async () => {
            const passwordHash = await passwordService.hashPassword('test-password-123')
            const testUser = await prismaService.user.create({
                data: {
                    id: generateUUIDv7(),
                    email: 'skill-user@test.local',
                    passwordHash,
                    role: 'USER',
                    name: 'Skill User',
                    isEmailVerified: true,
                    isActive: true,
                    isBanned: false,
                },
            })

            const payload = { name: 'Alchemy', description: 'Brew potions' }
            const response = await app.inject({
                method: 'POST',
                url: '/api/v1/skills',
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
            })
        })

        it('requires authentication', async () => {
            const response = await app.inject({
                method: 'POST',
                url: '/api/v1/skills',
                payload: { name: 'Stealth' },
                headers: { 'content-type': 'application/json' },
            })
            expect(response.statusCode).toBe(401)
        })
    })
})
