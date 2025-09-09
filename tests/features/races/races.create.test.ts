import type { FastifyInstance } from 'fastify'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { buildApp } from '@/app'
import { passwordService } from '@/features/auth/password.service'
import prismaService from '@/infrastructure/database/prisma.service'
import { generateUUIDv7 } from '@/shared/utils'
import { createAuthHeaders } from '@/tests/helpers/auth.helper'

// Mirrors perks.create.test.ts and skills.create.test.ts patterns

describe('Races API v1 - Create', () => {
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

    describe('POST /api/v1/races', () => {
        it('creates with defaults for modifiers and visibility', async () => {
            const passwordHash = await passwordService.hashPassword('test-password-123')
            const testUser = await prismaService.user.create({
                data: {
                    id: generateUUIDv7(),
                    email: 'race-user@test.local',
                    passwordHash,
                    role: 'USER',
                    name: 'Race User',
                    isEmailVerified: true,
                    isActive: true,
                    isBanned: false,
                },
            })

            const payload = { name: 'Elf', description: 'Graceful forest dwellers' }
            const response = await app.inject({
                method: 'POST',
                url: '/api/v1/races',
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
                healthModifier: 100,
                manaModifier: 100,
                staminaModifier: 100,
                strengthModifier: 10,
                constitutionModifier: 10,
                dexterityModifier: 10,
                intelligenceModifier: 10,
                wisdomModifier: 10,
                charismaModifier: 10,
            })
        })

        it('requires authentication', async () => {
            const response = await app.inject({
                method: 'POST',
                url: '/api/v1/races',
                payload: { name: 'Dwarf' },
                headers: { 'content-type': 'application/json' },
            })
            expect(response.statusCode).toBe(401)
        })
    })
})
