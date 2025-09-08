import type { FastifyInstance } from 'fastify'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { buildApp } from '@/app'
import prismaService from '@/infrastructure/database/prisma.service'
import { generateUUIDv7 } from '@/shared/utils'
import { createAuthHeaders } from '@/tests/helpers/auth.helper'

describe('Skills API v1 - Update/Delete', () => {
    let app: FastifyInstance
    let originalRbacEnabled: string | undefined
    let testUserId: string
    let otherUserId: string
    let testSkill: { id: string; name: string }
    let otherUserSkill: { id: string; name: string }

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

        testUserId = generateUUIDv7()
        otherUserId = generateUUIDv7()

        await prismaService.user.createMany({
            data: [
                {
                    id: testUserId,
                    email: 'skilluser@example.com',
                    passwordHash: 'hashedpassword',
                    role: 'USER',
                    isEmailVerified: true,
                    isActive: true,
                    lastLogin: new Date(),
                },
                {
                    id: otherUserId,
                    email: 'otherskill@example.com',
                    passwordHash: 'hashedpassword',
                    role: 'USER',
                    isEmailVerified: true,
                    isActive: true,
                    lastLogin: new Date(),
                },
            ],
        })

        testSkill = await prismaService.skill.create({
            data: {
                id: generateUUIDv7(),
                name: 'User Skill',
                description: 'A user skill',
                requiredLevel: 1,
                visibility: 'PUBLIC',
                ownerId: testUserId,
            },
        })

        otherUserSkill = await prismaService.skill.create({
            data: {
                id: generateUUIDv7(),
                name: 'Other User Skill',
                description: 'Another user skill',
                requiredLevel: 1,
                visibility: 'PUBLIC',
                ownerId: otherUserId,
            },
        })
    })

    describe('PUT /api/v1/skills/:id', () => {
        it('updates own skill', async () => {
            const payload = {
                name: 'Updated Skill',
                description: 'Updated desc',
                visibility: 'PRIVATE',
            }
            const response = await app.inject({
                method: 'PUT',
                url: `/api/v1/skills/${testSkill.id}`,
                payload,
                headers: {
                    'content-type': 'application/json',
                    ...createAuthHeaders({ role: 'USER', id: testUserId }),
                },
            })
            expect(response.statusCode).toBe(200)
            expect(response.json().data).toMatchObject({
                id: testSkill.id,
                name: 'Updated Skill',
                visibility: 'PRIVATE',
            })
        })

        it('allows admin to update any skill', async () => {
            const payload = { name: 'Admin Updated Skill' }
            const response = await app.inject({
                method: 'PUT',
                url: `/api/v1/skills/${otherUserSkill.id}`,
                payload,
                headers: {
                    'content-type': 'application/json',
                    ...createAuthHeaders({ role: 'ADMIN' }),
                },
            })
            expect(response.statusCode).toBe(200)
            expect(response.json().data).toMatchObject({
                id: otherUserSkill.id,
                name: 'Admin Updated Skill',
            })
        })

        it('denies updating other user skill', async () => {
            const response = await app.inject({
                method: 'PUT',
                url: `/api/v1/skills/${otherUserSkill.id}`,
                payload: { name: 'Unauthorized' },
                headers: {
                    'content-type': 'application/json',
                    ...createAuthHeaders({ role: 'USER', id: testUserId }),
                },
            })
            expect(response.statusCode).toBe(403)
        })

        it('returns 404 for non-existent skill', async () => {
            const response = await app.inject({
                method: 'PUT',
                url: `/api/v1/skills/${generateUUIDv7()}`,
                payload: { name: 'Non-existent' },
                headers: {
                    'content-type': 'application/json',
                    ...createAuthHeaders({ role: 'USER', id: testUserId }),
                },
            })
            expect(response.statusCode).toBe(404)
        })

        it('prevents duplicate names', async () => {
            const response = await app.inject({
                method: 'PUT',
                url: `/api/v1/skills/${testSkill.id}`,
                payload: { name: otherUserSkill.name },
                headers: {
                    'content-type': 'application/json',
                    ...createAuthHeaders({ role: 'USER', id: testUserId }),
                },
            })
            expect(response.statusCode).toBe(409)
        })

        it('requires authentication', async () => {
            const response = await app.inject({
                method: 'PUT',
                url: `/api/v1/skills/${testSkill.id}`,
                payload: { name: 'Unauthenticated' },
                headers: { 'content-type': 'application/json' },
            })
            expect(response.statusCode).toBe(401)
        })
    })

    describe('DELETE /api/v1/skills/:id', () => {
        it('deletes own skill', async () => {
            const response = await app.inject({
                method: 'DELETE',
                url: `/api/v1/skills/${testSkill.id}`,
                headers: createAuthHeaders({ role: 'USER', id: testUserId }),
            })
            expect(response.statusCode).toBe(204)
            const deleted = await prismaService.skill.findUnique({ where: { id: testSkill.id } })
            expect(deleted).toBeNull()
        })

        it('allows admin to delete any skill', async () => {
            const response = await app.inject({
                method: 'DELETE',
                url: `/api/v1/skills/${otherUserSkill.id}`,
                headers: createAuthHeaders({ role: 'ADMIN' }),
            })
            expect(response.statusCode).toBe(204)
        })

        it('denies deleting other user skill', async () => {
            const response = await app.inject({
                method: 'DELETE',
                url: `/api/v1/skills/${otherUserSkill.id}`,
                headers: createAuthHeaders({ role: 'USER', id: testUserId }),
            })
            expect(response.statusCode).toBe(403)
        })

        it('returns 404 for non-existent skill', async () => {
            const response = await app.inject({
                method: 'DELETE',
                url: `/api/v1/skills/${generateUUIDv7()}`,
                headers: createAuthHeaders({ role: 'USER', id: testUserId }),
            })
            expect(response.statusCode).toBe(404)
        })

        it('requires authentication', async () => {
            const response = await app.inject({
                method: 'DELETE',
                url: `/api/v1/skills/${testSkill.id}`,
            })
            expect(response.statusCode).toBe(401)
        })
    })
})
