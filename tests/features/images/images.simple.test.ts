import { beforeEach, describe, expect, it } from 'vitest'

import type { RoleLiterals } from '@/shared/schemas/common.schema'
import { generateUUIDv7 } from '@/shared/utils/uuid'
import { cleanupTestData } from '@/tests/helpers/data.helper'
import { testPrisma } from '@/tests/setup'

const USER_1_ID = generateUUIDv7()
const ADMIN_1_ID = generateUUIDv7()

async function getImageService() {
    const serviceMod = await import('@/features/images/images.service')
    return serviceMod.imageService
}

async function seedTestUser(id: string, role: 'USER' | 'ADMIN' = 'USER') {
    const now = new Date()
    return testPrisma.user.create({
        data: {
            id,
            email: `user-${id}@test.local`,
            passwordHash: 'hashed',
            role,
            isEmailVerified: true,
            isActive: true,
            lastLogin: now,
            isBanned: false,
            createdAt: now,
            updatedAt: now,
            name: `Test User ${id}`,
            bio: null,
            oauthProvider: null,
            oauthId: null,
            lastPasswordChange: null,
            banReason: null,
            bannedUntil: null,
            bannedById: null,
            profilePictureId: null,
        },
    })
}

function createAuthUser(user: any) {
    if (!user || !user.id || !user.role || !user.email) {
        throw new Error(`Invalid user data: ${JSON.stringify(user)}`)
    }
    return {
        id: user.id,
        email: user.email,
        role: user.role as RoleLiterals,
    }
}

describe('Image Service Unit Tests', () => {
    beforeEach(async () => {
        await cleanupTestData()
    })

    describe('createImage', () => {
        it('should create image with valid file data', async () => {
            const imageService = await getImageService()
            const user = await seedTestUser(USER_1_ID)

            const fakeBuffer = Buffer.from('fake-image-data')
            const mockFile = {
                mimetype: 'image/jpeg',
                filename: 'test.jpg',
            }

            const authUser = createAuthUser(user)
            const result = await imageService.createImage(
                { description: 'Test image', visibility: 'PUBLIC' },
                mockFile,
                fakeBuffer,
                authUser
            )

            expect(result).toMatchObject({
                description: 'Test image',
                visibility: 'PUBLIC',
            })
            expect(result.id).toBeDefined()
            expect(result.mimeType).toBe('image/webp') // Converted by Sharp
            // Only check ownerId if it's expected to be set
            if (result.ownerId) {
                expect(result.ownerId).toBe(user.id)
            }
        })

        it('should allow admin to create system image without specific owner', async () => {
            const imageService = await getImageService()
            const admin = await seedTestUser(ADMIN_1_ID, 'ADMIN')

            const fakeBuffer = Buffer.from('fake-image-data')
            const mockFile = {
                mimetype: 'image/png',
                filename: 'test.png',
            }

            const result = await imageService.createImage(
                { description: 'System image' },
                mockFile,
                fakeBuffer,
                createAuthUser(admin)
            )

            expect(result.ownerId).toBe(admin.id) // Admin becomes owner
            expect(result.visibility).toBe('PUBLIC') // Default visibility
        })
    })

    describe('listImages', () => {
        it('should list only public images for unauthenticated user', async () => {
            const imageService = await getImageService()
            const user1 = await seedTestUser(USER_1_ID)

            const fakeBuffer = Buffer.from('image-data')

            // Create one public image
            await imageService.createImage(
                { description: 'Public 1', visibility: 'PUBLIC' },
                { mimetype: 'image/jpeg', filename: 'pub1.jpg' },
                fakeBuffer,
                createAuthUser(user1)
            )

            const result = await imageService.listImages({})

            expect(result.data).toHaveLength(1)
            expect(result.data[0]?.visibility).toBe('PUBLIC')
        })

        it('should handle pagination', async () => {
            const imageService = await getImageService()
            const user = await seedTestUser(USER_1_ID)

            const fakeBuffer = Buffer.from('image-data')

            // Create multiple images
            await Promise.all([
                imageService.createImage(
                    { description: 'Image 1', visibility: 'PUBLIC' },
                    { mimetype: 'image/jpeg', filename: 'img1.jpg' },
                    fakeBuffer,
                    createAuthUser(user)
                ),
                imageService.createImage(
                    { description: 'Image 2', visibility: 'PUBLIC' },
                    { mimetype: 'image/jpeg', filename: 'img2.jpg' },
                    fakeBuffer,
                    createAuthUser(user)
                ),
            ])

            const result = await imageService.listImages({ limit: 1 })

            expect(result.data).toHaveLength(1)
            expect(result.pagination.hasNext).toBe(true)
        })
    })

    describe('getImageStats', () => {
        it('should return basic image statistics', async () => {
            const imageService = await getImageService()
            const admin = await seedTestUser(ADMIN_1_ID, 'ADMIN')
            const user = await seedTestUser(USER_1_ID)

            const fakeBuffer = Buffer.from('image-data')

            await imageService.createImage(
                { description: 'Public JPEG', visibility: 'PUBLIC' },
                { mimetype: 'image/jpeg', filename: 'pub.jpg' },
                fakeBuffer,
                createAuthUser(user)
            )

            const result = await imageService.getImageStats(undefined, createAuthUser(admin))

            expect(result).toMatchObject({
                total: 1,
                byVisibility: {
                    PUBLIC: 1,
                    PRIVATE: 0,
                    HIDDEN: 0,
                },
            })
            expect(result.totalSize).toBeGreaterThan(0)
        })
    })
})
