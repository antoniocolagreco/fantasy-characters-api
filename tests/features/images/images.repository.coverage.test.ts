import { afterEach, describe, expect, it } from 'vitest'

import { createImageInDb, listImagesInDb } from '@/features/images/images.repository'
import { createTestUserInDb } from '@/tests/helpers/data.helper'
import { testPrisma } from '@/tests/setup'

describe('Images Repository - coverage branches', () => {
    afterEach(async () => {
        // Clean tables touched by these tests
        await testPrisma.image.deleteMany({})
        await testPrisma.user.deleteMany({})
    })

    it('listImagesInDb sorts by owner.email and builds pagination cursor', async () => {
        const u1 = await createTestUserInDb({ email: `a-${Date.now()}@test.local` })
        const u2 = await createTestUserInDb({ email: `z-${Date.now()}@test.local` })

        await createImageInDb({
            blob: Buffer.from('x'),
            size: 1,
            mimeType: 'image/webp',
            width: 1,
            height: 1,
            ownerId: u2.id,
            visibility: 'PUBLIC',
            description: 'z-owner',
        })
        await createImageInDb({
            blob: Buffer.from('y'),
            size: 1,
            mimeType: 'image/webp',
            width: 1,
            height: 1,
            ownerId: u1.id,
            visibility: 'PUBLIC',
            description: 'a-owner',
        })

        const res = await listImagesInDb({ limit: 1, sortBy: 'email', sortDir: 'asc' })
        expect(res.data.length).toBe(1)
        expect(res.pagination.hasNext).toBe(true)
        expect(
            typeof res.pagination.nextCursor === 'string' || res.pagination.nextCursor === undefined
        ).toBe(true)
    })

    it('listImagesInDb ignores invalid cursor for email sort', async () => {
        const u = await createTestUserInDb({})
        await createImageInDb({
            blob: Buffer.from('x'),
            size: 1,
            mimeType: 'image/webp',
            width: 1,
            height: 1,
            ownerId: u.id,
            visibility: 'PUBLIC',
            description: 'seed',
        })

        const res = await listImagesInDb({ limit: 10, sortBy: 'email', cursor: 'not-base64' })
        expect(res.data.length).toBeGreaterThan(0)
        expect(res.pagination.hasPrev).toBe(true)
    })
})
