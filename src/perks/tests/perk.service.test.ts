import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
  createPerk,
  findPerkById,
  updatePerk,
  deletePerk,
  listPerks,
  getPerkStats,
} from '../perk.service.js'
import { db } from '../../shared/database/index.js'
import type { AuthUser } from '../../shared/rbac.service.js'

// Mock user for testing
let mockUser: AuthUser
let mockAdmin: AuthUser

describe('Perk Service', () => {
  beforeEach(async () => {
    // Clean up database before each test
    await db.perk.deleteMany({})
    await db.character.deleteMany({})
    await db.image.deleteMany({})
    await db.user.deleteMany({})

    // Create a real user in the database for testing
    const createdUser = await db.user.create({
      data: {
        email: 'test@example.com',
        passwordHash: 'hashedpassword123',
        name: 'Test User',
        role: 'USER',
        isActive: true,
        isEmailVerified: true,
      },
    })

    // Create an admin user for testing
    const createdAdmin = await db.user.create({
      data: {
        email: 'admin@example.com',
        passwordHash: 'hashedpassword123',
        name: 'Admin User',
        role: 'ADMIN',
        isActive: true,
        isEmailVerified: true,
      },
    })

    mockUser = {
      id: createdUser.id,
      role: 'USER',
      isActive: true,
      isEmailVerified: true,
    }

    mockAdmin = {
      id: createdAdmin.id,
      role: 'ADMIN',
      isActive: true,
      isEmailVerified: true,
    }
  })

  afterEach(async () => {
    // Clean up database after each test
    await db.perk.deleteMany({})
    await db.character.deleteMany({})
    await db.image.deleteMany({})
    await db.user.deleteMany({})
  })

  describe('createPerk', () => {
    it('should create a new perk successfully', async () => {
      const perkData = {
        name: 'Fireball',
        description: 'A powerful fire spell',
        requiredLevel: 5,
        visibility: 'PUBLIC' as const,
      }

      const perk = await createPerk(perkData, mockUser)

      expect(perk).toMatchObject({
        name: 'Fireball',
        description: 'A powerful fire spell',
        requiredLevel: 5,
        visibility: 'PUBLIC',
        ownerId: mockUser.id,
      })
      expect(perk.id).toBeDefined()
      expect(perk.createdAt).toBeDefined()
      expect(perk.updatedAt).toBeDefined()
    })

    it('should create a perk with default values', async () => {
      const perkData = {
        name: 'Basic Attack',
      }

      const perk = await createPerk(perkData, mockUser)

      expect(perk).toMatchObject({
        name: 'Basic Attack',
        description: null,
        requiredLevel: 0,
        visibility: 'PUBLIC',
        ownerId: mockUser.id,
        imageId: null,
      })
    })

    it('should throw error if perk name already exists', async () => {
      const perkData = {
        name: 'Fireball',
        description: 'A fire spell',
      }

      await createPerk(perkData, mockUser)

      await expect(createPerk(perkData, mockUser)).rejects.toThrow(
        'Perk with name "Fireball" already exists',
      )
    })

    it('should throw error if user is not authenticated', async () => {
      const perkData = {
        name: 'Fireball',
      }

      await expect(createPerk(perkData, null)).rejects.toThrow('Authentication required')
    })

    it('should validate image exists when provided', async () => {
      // Create an image first
      const image = await db.image.create({
        data: {
          blob: Buffer.from('test-image'),
          filename: 'test.webp',
          size: 1024,
          mimeType: 'image/webp',
          width: 100,
          height: 100,
          ownerId: mockUser.id,
        },
      })

      const perkData = {
        name: 'Fireball',
        imageId: image.id,
      }

      const perk = await createPerk(perkData, mockUser)
      expect(perk.imageId).toBe(image.id)
    })

    it('should throw error if image does not exist', async () => {
      const perkData = {
        name: 'Fireball',
        imageId: 'non-existent-id',
      }

      await expect(createPerk(perkData, mockUser)).rejects.toThrow('Image not found')
    })
  })

  describe('findPerkById', () => {
    it('should find perk by ID', async () => {
      const createdPerk = await db.perk.create({
        data: {
          name: 'Test perk',
          description: 'Test description',
          requiredLevel: 10,
          ownerId: mockUser.id,
          visibility: 'PUBLIC',
        },
      })

      const perk = await findPerkById(createdPerk.id, mockUser)

      expect(perk).toMatchObject({
        id: createdPerk.id,
        name: 'Test perk',
        description: 'Test description',
        requiredLevel: 10,
        ownerId: mockUser.id,
        visibility: 'PUBLIC',
      })
    })

    it('should throw error if perk not found', async () => {
      await expect(findPerkById('non-existent-id', mockUser)).rejects.toThrow('Perk not found')
    })

    it('should throw error if user cannot access private perk', async () => {
      // Create a private perk owned by admin
      const createdPerk = await db.perk.create({
        data: {
          name: 'Private perk',
          ownerId: mockAdmin.id,
          visibility: 'PRIVATE',
        },
      })

      await expect(findPerkById(createdPerk.id, mockUser)).rejects.toThrow(
        'Insufficient permissions to access this perk',
      )
    })

    it('should allow admin to access any perk', async () => {
      // Create a private perk owned by user
      const createdPerk = await db.perk.create({
        data: {
          name: 'Private perk',
          ownerId: mockUser.id,
          visibility: 'PRIVATE',
        },
      })

      const perk = await findPerkById(createdPerk.id, mockAdmin)
      expect(perk.name).toBe('Private perk')
    })
  })

  describe('updatePerk', () => {
    it('should update perk successfully', async () => {
      const createdPerk = await db.perk.create({
        data: {
          name: 'Original perk',
          description: 'Original description',
          requiredLevel: 5,
          ownerId: mockUser.id,
          visibility: 'PUBLIC',
        },
      })

      const updateData = {
        name: 'Updated perk',
        description: 'Updated description',
        requiredLevel: 10,
      }

      const updatedPerk = await updatePerk(createdPerk.id, updateData, mockUser)

      expect(updatedPerk).toMatchObject({
        name: 'Updated perk',
        description: 'Updated description',
        requiredLevel: 10,
      })
    })

    it('should throw error if user cannot modify perk', async () => {
      // Create perk owned by admin
      const createdPerk = await db.perk.create({
        data: {
          name: 'Admin perk',
          ownerId: mockAdmin.id,
        },
      })

      await expect(updatePerk(createdPerk.id, { name: 'Modified' }, mockUser)).rejects.toThrow(
        'Insufficient permissions to modify this perk',
      )
    })

    it('should throw error if new name conflicts', async () => {
      // Create two perks
      await db.perk.create({
        data: {
          name: 'perk One',
          ownerId: mockUser.id,
        },
      })

      const perk2 = await db.perk.create({
        data: {
          name: 'perk Two',
          ownerId: mockUser.id,
        },
      })

      await expect(updatePerk(perk2.id, { name: 'perk One' }, mockUser)).rejects.toThrow(
        'Perk with name "perk One" already exists',
      )
    })
  })

  describe('deletePerk', () => {
    it('should delete perk successfully', async () => {
      const createdPerk = await db.perk.create({
        data: {
          name: 'perk to Delete',
          ownerId: mockUser.id,
        },
      })

      await deletePerk(createdPerk.id, mockUser)

      const deletedperk = await db.perk.findUnique({
        where: { id: createdPerk.id },
      })
      expect(deletedperk).toBeNull()
    })

    it('should throw error if user cannot delete perk', async () => {
      const createdPerk = await db.perk.create({
        data: {
          name: 'Protected perk',
          ownerId: mockAdmin.id,
        },
      })

      await expect(deletePerk(createdPerk.id, mockUser)).rejects.toThrow(
        'Insufficient permissions to delete this perk',
      )
    })

    it('should throw error if perk is used by characters', async () => {
      // Create a race and archetype first with unique names
      const timestamp = Date.now()
      const race = await db.race.create({
        data: {
          name: `Test Race perks ${timestamp}`,
          ownerId: mockUser.id,
        },
      })

      const archetype = await db.archetype.create({
        data: {
          name: `Test Archetype perks ${timestamp}`,
          ownerId: mockUser.id,
        },
      })

      const perk = await db.perk.create({
        data: {
          name: 'Used perk',
          ownerId: mockUser.id,
        },
      })

      // Create a character that uses this perk
      await db.character.create({
        data: {
          name: 'Test Character',
          ownerId: mockUser.id,
          raceId: race.id,
          archetypeId: archetype.id,
          perks: {
            connect: { id: perk.id },
          },
        },
      })

      await expect(deletePerk(perk.id, mockUser)).rejects.toThrow(
        'Cannot delete perk "Used perk" as it is being used by 1 character(s)',
      )
    })
  })

  describe('listPerks', () => {
    beforeEach(async () => {
      // Create test perks
      await db.perk.createMany({
        data: [
          {
            name: 'Fireball',
            description: 'Fire spell',
            requiredLevel: 5,
            ownerId: mockUser.id,
            visibility: 'PUBLIC',
          },
          {
            name: 'Ice Blast',
            description: 'Ice spell',
            requiredLevel: 3,
            ownerId: mockUser.id,
            visibility: 'PUBLIC',
          },
          {
            name: 'Healing',
            description: 'Restore health',
            requiredLevel: 1,
            ownerId: mockAdmin.id,
            visibility: 'PUBLIC',
          },
          {
            name: 'Private perk',
            requiredLevel: 10,
            ownerId: mockAdmin.id,
            visibility: 'PRIVATE',
          },
        ],
      })
    })

    it('should list perks with pagination', async () => {
      const result = await listPerks({ page: 1, limit: 2 }, mockUser)

      expect(result.data).toHaveLength(2)
      expect(result.pagination).toMatchObject({
        page: 1,
        limit: 2,
        total: 3, // Should not include private perk
        totalPages: 2,
      })
    })

    it('should filter by level range', async () => {
      const result = await listPerks({ minLevel: 3, maxLevel: 5 }, mockUser)

      expect(result.data).toHaveLength(2)
      expect(result.data.every(perk => perk.requiredLevel >= 3 && perk.requiredLevel <= 5)).toBe(
        true,
      )
    })

    it('should search by name and description', async () => {
      const result = await listPerks({ search: 'fire' }, mockUser)

      expect(result.data).toHaveLength(1)
      expect(result.data[0].name).toBe('Fireball')
    })

    it('should allow admin to see all perks including private', async () => {
      const result = await listPerks({}, mockAdmin)

      expect(result.data).toHaveLength(4) // Including private perk
    })
  })

  describe('getPerkStats', () => {
    beforeEach(async () => {
      // Create test perks with different levels
      await db.perk.createMany({
        data: [
          { name: 'Beginner 1', requiredLevel: 5, ownerId: mockUser.id, visibility: 'PUBLIC' },
          { name: 'Beginner 2', requiredLevel: 8, ownerId: mockUser.id, visibility: 'PUBLIC' },
          { name: 'Intermediate 1', requiredLevel: 15, ownerId: mockUser.id, visibility: 'PUBLIC' },
          { name: 'Advanced 1', requiredLevel: 30, ownerId: mockUser.id, visibility: 'PUBLIC' },
          { name: 'Expert 1', requiredLevel: 60, ownerId: mockUser.id, visibility: 'PUBLIC' },
          {
            name: 'Private perk',
            requiredLevel: 25,
            ownerId: mockAdmin.id,
            visibility: 'PRIVATE',
          },
          { name: 'Orphaned perk', requiredLevel: 10, ownerId: null, visibility: 'PUBLIC' },
        ],
      })
    })

    it('should return correct statistics', async () => {
      const stats = await getPerkStats(mockAdmin)

      expect(stats).toMatchObject({
        totalPerks: 7, // Including the private perk
        publicPerks: 6,
        privatePerks: 1,
        orphanedPerks: 1,
      })
    })

    it('should return admin statistics including all perks', async () => {
      const stats = await getPerkStats(mockAdmin)

      expect(stats).toMatchObject({
        totalPerks: 7,
        publicPerks: 6,
        privatePerks: 1,
        orphanedPerks: 1,
      })
    })
  })
})
