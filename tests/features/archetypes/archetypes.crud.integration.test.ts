import type { FastifyInstance } from 'fastify'
import { beforeAll, describe, expect, it } from 'vitest'

import { buildApp } from '@/app'
import { passwordService } from '@/features/auth/password.service'
import prismaService from '@/infrastructure/database/prisma.service'
import { HTTP_STATUS } from '@/shared/constants'
import { generateUUIDv7 } from '@/shared/utils'
import { createAuthHeaders, expectSuccessResponse } from '@/tests/helpers/test.helper'

describe('Archetypes API - CRUD', () => {
    let app: FastifyInstance

    beforeAll(async () => {
        app = await buildApp()
    })

    it('creates, fetches, updates and deletes an archetype', async () => {
        // Create real user for FK ownerId
        const passwordHash = await passwordService.hashPassword('test-password-123')
        const userId = generateUUIDv7()
        await prismaService.user.create({
            data: {
                id: userId,
                email: 'archetype-user@test.local',
                passwordHash,
                role: 'ADMIN',
                name: 'Archetype Admin',
                isEmailVerified: true,
                isActive: true,
                isBanned: false,
            },
        })
        const createRes = await app.inject({
            method: 'POST',
            url: '/api/v1/archetypes',
            headers: {
                'content-type': 'application/json',
                ...createAuthHeaders({ id: userId, role: 'ADMIN' }),
            },
            payload: { name: 'Test Archetype' },
        })
        // Debug log on failure
        if (createRes.statusCode !== HTTP_STATUS.CREATED) {
            // eslint-disable-next-line no-console
            console.error('Create archetype error body:', createRes.statusCode, createRes.body)
        }
        const createdBody = expectSuccessResponse(createRes as any, HTTP_STATUS.CREATED)
        const created = createdBody.data as any
        expect(created.name).toBe('Test Archetype')

        const getRes = await app.inject({
            method: 'GET',
            url: `/api/v1/archetypes/${created.id}`,
            headers: createAuthHeaders({ id: userId, role: 'ADMIN' }),
        })
        expect(getRes.statusCode).toBe(HTTP_STATUS.OK)

        const updateRes = await app.inject({
            method: 'PUT',
            url: `/api/v1/archetypes/${created.id}`,
            headers: {
                'content-type': 'application/json',
                ...createAuthHeaders({ id: userId, role: 'ADMIN' }),
            },
            payload: { description: 'Updated desc' },
        })
        const updatedBody = expectSuccessResponse(updateRes as any)
        expect((updatedBody.data as any).description).toBe('Updated desc')

        const deleteRes = await app.inject({
            method: 'DELETE',
            url: `/api/v1/archetypes/${created.id}`,
            headers: createAuthHeaders({ id: userId, role: 'ADMIN' }),
        })
        expect(deleteRes.statusCode).toBe(HTTP_STATUS.NO_CONTENT)
    })
})
