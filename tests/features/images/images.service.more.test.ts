import { describe, expect, it } from 'vitest'

import { imageService } from '@/features/images/images.service'
import { generateUUIDv7 } from '@/shared/utils/uuid'
import { testPrisma } from '@/tests/setup'

const USER_ID = generateUUIDv7()
const ADMIN_ID = generateUUIDv7()
const OWNER_ID = generateUUIDv7()
const REPLACE_ID = generateUUIDv7()

async function seedUser(id: string, role: 'USER' | 'ADMIN' = 'USER') {
    const now = new Date()
    return testPrisma.user.create({
        data: {
            id,
            email: `${id}@test.local`,
            passwordHash: 'x',
            role,
            isEmailVerified: true,
            isActive: true,
            lastLogin: now,
            isBanned: false,
            createdAt: now,
            updatedAt: now,
            name: id,
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

function auth(u: any) {
    return { id: u.id, email: u.email, role: u.role }
}

describe('Image Service - additional paths', () => {
    async function create(owner?: any) {
        return imageService.createImage(
            { description: 'd', visibility: 'PUBLIC' },
            { mimetype: 'image/jpeg', filename: 'a.jpg' },
            Buffer.from('x'),
            owner ? auth(owner) : undefined
        )
    }

    it('getImageFile: returns blob and enforces permission', async () => {
        const owner = await seedUser(OWNER_ID)
        const other = await seedUser(USER_ID)
        const img = await create(owner)

        const ok = await imageService.getImageFile(img.id, auth(owner))
        expect(ok).toBeTruthy()

        // make image private to test denial
        await testPrisma.image.update({ where: { id: img.id }, data: { visibility: 'PRIVATE' } })
        await expect(imageService.getImageFile(img.id, auth(other))).rejects.toThrow(
            'Image not found'
        )
    })

    it('updateImage: enforces permission and handles not found', async () => {
        const owner = await seedUser(OWNER_ID)
        const other = await seedUser(USER_ID)
        const img = await create(owner)

        const updated = await imageService.updateImage(img.id, { description: 'z' }, auth(owner))
        expect(updated?.description).toBe('z')

        await expect(
            imageService.updateImage(img.id, { description: 'h' }, auth(other))
        ).rejects.toThrow('Access denied')

        const missing = await imageService.updateImage(
            generateUUIDv7(),
            { description: 'x' },
            auth(owner)
        )
        expect(missing).toBeNull()
    })

    it('deleteImage: enforces permission and returns false on missing', async () => {
        const owner = await seedUser(OWNER_ID)
        const other = await seedUser(USER_ID)
        const img = await create(owner)

        await expect(imageService.deleteImage(img.id, auth(other))).rejects.toThrow('Access denied')
        const ok = await imageService.deleteImage(img.id, auth(owner))
        expect(ok).toBe(true)
        const not = await imageService.deleteImage(generateUUIDv7(), auth(owner))
        expect(not).toBe(false)
    })

    it('replaceImageFile: updates blob and enforces permission', async () => {
        const owner = await seedUser(REPLACE_ID)
        const other = await seedUser(USER_ID)
        const img = await create(owner)

        const rep = await imageService.replaceImageFile(
            img.id,
            { mimetype: 'image/jpeg', filename: 'b.jpg' },
            Buffer.from('y'),
            auth(owner)
        )
        expect(rep?.id).toBe(img.id)

        await expect(
            imageService.replaceImageFile(
                img.id,
                { mimetype: 'image/jpeg', filename: 'b.jpg' },
                Buffer.from('z'),
                auth(other)
            )
        ).rejects.toThrow('Access denied')
    })

    it('listImages: visibility rules for anonymous and non-admin', async () => {
        const user = await seedUser(USER_ID)
        await create(user)
        await imageService.createImage(
            { description: 'private', visibility: 'PRIVATE' },
            { mimetype: 'image/jpeg', filename: 'p.jpg' },
            Buffer.from('x'),
            auth(user)
        )
        const anon = await imageService.listImages({})
        expect(anon.data.every(i => i.visibility === 'PUBLIC')).toBe(true)

        const notOwner = await seedUser(generateUUIDv7())
        const res = await imageService.listImages({}, auth(notOwner))
        expect(res.data.every(i => i.visibility === 'PUBLIC')).toBe(true)
    })

    it('getImageStats: permission for ownerId', async () => {
        const admin = await seedUser(ADMIN_ID, 'ADMIN')
        const user = await seedUser(USER_ID)

        // admin can query any ownerId
        await expect(imageService.getImageStats(user.id, auth(admin))).resolves.toBeTruthy()

        // user can query their own id but not others
        await expect(imageService.getImageStats(user.id, auth(user))).resolves.toBeTruthy()
        const other = await seedUser(generateUUIDv7())
        await expect(imageService.getImageStats(other.id, auth(user))).rejects.toThrow(
            'Access denied'
        )
    })
})
