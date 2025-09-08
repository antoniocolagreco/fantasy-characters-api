import type { FastifyInstance } from 'fastify'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { buildApp } from '@/app'
import { generateUUIDv7 } from '@/shared/utils'
import { createAuthHeaders } from '@/tests/helpers/auth.helper'
import { createTestUserInDb } from '@/tests/helpers/data.helper'
import { testPrisma } from '@/tests/setup'

describe('Skills API v1 - Read Operations', () => {
    let app: FastifyInstance
    let originalRbacEnabled: string | undefined
    let testUserId: string
    let testSkill: { id: string; name: string }

    beforeAll(async () => {
        app = await buildApp()
        await app.ready()
    })

    afterAll(async () => {
        await app.close()
    })

    afterEach(() => {
        if (originalRbacEnabled !== undefined) process.env.RBAC_ENABLED = originalRbacEnabled
        else delete process.env.RBAC_ENABLED
    })

    beforeEach(async () => {
        originalRbacEnabled = process.env.RBAC_ENABLED
        process.env.RBAC_ENABLED = 'true'

        const testUser = await createTestUserInDb({ email: 'skill-user@example.com', role: 'USER' })
        testUserId = testUser.id

        testSkill = await testPrisma.skill.create({
            data: {
                id: generateUUIDv7(),
                name: 'Test Skill',
                description: 'A test skill',
                requiredLevel: 1,
                visibility: 'PUBLIC',
                ownerId: testUserId,
            },
        })
    })

    describe('GET /api/v1/skills/:id', () => {
        it('gets a skill by ID', async () => {
            const response = await app.inject({
                method: 'GET',
                url: `/api/v1/skills/${testSkill.id}`,
                headers: createAuthHeaders({ id: testUserId, role: 'USER' }),
            })

            expect(response.statusCode).toBe(200)
            const body = response.json()
            expect(body.data).toMatchObject({
                id: testSkill.id,
                name: 'Test Skill',
                description: 'A test skill',
                visibility: 'PUBLIC',
                ownerId: testUserId,
            })
        })

        it('returns 404 for non-existent skill', async () => {
            const response = await app.inject({
                method: 'GET',
                url: `/api/v1/skills/${generateUUIDv7()}`,
                headers: createAuthHeaders({ role: 'USER' }),
            })
            expect(response.statusCode).toBe(404)
        })

        it('returns 404 for private skill if not owner', async () => {
            const otherUser = await createTestUserInDb({ email: 'other@example.com', role: 'USER' })
            const privateSkill = await testPrisma.skill.create({
                data: {
                    id: generateUUIDv7(),
                    name: 'Private Skill',
                    description: 'Secret',
                    requiredLevel: 2,
                    visibility: 'PRIVATE',
                    ownerId: otherUser.id,
                },
            })

            const response = await app.inject({
                method: 'GET',
                url: `/api/v1/skills/${privateSkill.id}`,
                headers: createAuthHeaders({ role: 'USER', id: testUserId }),
            })
            expect(response.statusCode).toBe(404)
        })
    })

    describe('GET /api/v1/skills', () => {
        beforeEach(async () => {
            await testPrisma.skill.create({
                data: {
                    id: generateUUIDv7(),
                    name: 'Public Skill 1',
                    description: 'First public skill',
                    requiredLevel: 1,
                    visibility: 'PUBLIC',
                    ownerId: testUserId,
                },
            })
            await testPrisma.skill.create({
                data: {
                    id: generateUUIDv7(),
                    name: 'Public Skill 2',
                    description: 'Second public skill',
                    requiredLevel: 1,
                    visibility: 'PUBLIC',
                    ownerId: testUserId,
                },
            })
            await testPrisma.skill.create({
                data: {
                    id: generateUUIDv7(),
                    name: 'Private Skill 1',
                    description: 'A private skill',
                    requiredLevel: 1,
                    visibility: 'PRIVATE',
                    ownerId: testUserId,
                },
            })
        })

        it('lists public skills', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/v1/skills',
                headers: createAuthHeaders({ role: 'USER' }),
            })
            expect(response.statusCode).toBe(200)
            const body = response.json()
            expect(Array.isArray(body.data)).toBe(true)
            expect(body.pagination).toHaveProperty('limit')
            expect(body.pagination).toHaveProperty('hasNext')
        })

        it('filters by search', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/v1/skills?search=Public Skill 1',
                headers: createAuthHeaders({ role: 'USER' }),
            })
            expect(response.statusCode).toBe(200)
            const body = response.json()
            expect(body.data).toHaveLength(1)
            expect(body.data[0].name).toBe('Public Skill 1')
        })

        it('filters by visibility', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/v1/skills?visibility=PUBLIC',
                headers: createAuthHeaders({ role: 'USER' }),
            })
            expect(response.statusCode).toBe(200)
            const body = response.json()
            expect(body.data.every((s: any) => s.visibility === 'PUBLIC')).toBe(true)
        })
    })

    describe('GET /api/v1/skills/stats', () => {
        it('returns stats for admin', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/v1/skills/stats',
                headers: createAuthHeaders({ role: 'ADMIN' }),
            })
            expect(response.statusCode).toBe(200)
            const body = response.json()
            expect(body.data).toHaveProperty('totalSkills')
            expect(body.data).toHaveProperty('publicSkills')
            expect(body.data).toHaveProperty('privateSkills')
            expect(body.data).toHaveProperty('hiddenSkills')
            expect(body.data).toHaveProperty('newSkillsLast30Days')
            expect(body.data).toHaveProperty('topSkills')
        })

        it('returns stats for moderator', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/v1/skills/stats',
                headers: createAuthHeaders({ role: 'MODERATOR' }),
            })
            expect(response.statusCode).toBe(200)
        })

        it('denies access to regular users', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/v1/skills/stats',
                headers: createAuthHeaders({ role: 'USER' }),
            })
            expect(response.statusCode).toBe(403)
        })
    })
})
