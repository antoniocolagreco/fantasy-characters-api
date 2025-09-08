import { beforeEach, describe, expect, it } from 'vitest'

import {
    createImageInDb,
    deleteImageFromDb,
    findImageBlobByIdInDb,
    findImageByIdInDb,
    findImageMetadataByIdInDb,
    getImageStatsFromDb,
    listImagesInDb,
    updateImageInDb,
} from '@/features/images/images.repository'
import { generateUUIDv7 } from '@/shared/utils'
import { cleanupTestData } from '@/tests/helpers/data.helper'

describe('Images Repository - unit', () => {
    beforeEach(() => cleanupTestData())

    async function seedOne() {
        const img = await createImageInDb({
            blob: Buffer.from('x'),
            size: 1,
            mimeType: 'image/webp',
            width: 10,
            height: 10,
            visibility: 'PUBLIC',
            description: 'seed',
        })
        return img
    }

    it('create/find/findMetadata/findBlob work', async () => {
        const img = await seedOne()
        expect(await findImageByIdInDb(img.id)).toBeTruthy()
        expect(await findImageMetadataByIdInDb(img.id)).toMatchObject({ id: img.id })
        expect(await findImageBlobByIdInDb(img.id)).toMatchObject({ mimeType: 'image/webp' })
    })

    it('updateImageInDb propagates P2025 in in-memory fake (align with prismaFake)', async () => {
        await expect(updateImageInDb(generateUUIDv7(), { description: 'x' })).rejects.toThrow(
            'No record was found'
        )
    })

    it('deleteImageFromDb propagates P2025 in in-memory fake (align with prismaFake)', async () => {
        await expect(deleteImageFromDb(generateUUIDv7())).rejects.toThrow('No record was found')
    })

    it('listImagesInDb ignores invalid cursor', async () => {
        await seedOne()
        const out = await listImagesInDb({ cursor: 'not-base64', limit: 10 })
        expect(out.data.length).toBeGreaterThan(0)
    })

    it('getImageStatsFromDb aggregates correctly', async () => {
        await seedOne()
        const stats = await getImageStatsFromDb()
        expect(stats.total).toBe(1)
        expect(stats.byVisibility.PUBLIC).toBeGreaterThanOrEqual(1)
        expect(stats.totalSize).toBeGreaterThan(0)
    })
})
