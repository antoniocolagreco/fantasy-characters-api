import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { db } from '../../shared/database/index'
import type { AuthUser } from '../../shared/rbac.service'
import {
  createArchetype,
  deleteArchetype,
  findArchetypeById,
  getArchetypeStats,
  listArchetypes,
  updateArchetype,
} from '../archetype.service'

let mockUser: AuthUser
let mockAdmin: AuthUser

describe('Archetype Service', () => {
  beforeEach(async () => {
    await db.character.deleteMany({})
    await db.archetype.deleteMany({})
    await db.race.deleteMany({})
    await db.image.deleteMany({})
    await db.user.deleteMany({})

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
      role: createdUser.role,
      isActive: createdUser.isActive,
      isEmailVerified: createdUser.isEmailVerified,
    }

    mockAdmin = {
      id: createdAdmin.id,
      role: createdAdmin.role,
      isActive: createdAdmin.isActive,
      isEmailVerified: createdAdmin.isEmailVerified,
    }
  })

  afterEach(async () => {
    await db.character.deleteMany({})
    await db.archetype.deleteMany({})
    await db.race.deleteMany({})
    await db.image.deleteMany({})
    await db.user.deleteMany({})
  })

  describe('createArchetype', () => {
    it('should create an archetype successfully', async () => {
      const archetypeData = {
        name: 'Warrior',
        description: 'Strong melee fighter',
        visibility: 'PUBLIC' as const,
      }

      const result = await createArchetype(archetypeData, mockUser)

      expect(result).toMatchObject({
        name: 'Warrior',
        description: 'Strong melee fighter',
        ownerId: mockUser.id,
        visibility: 'PUBLIC',
      })
      expect(result.id).toBeDefined()
      expect(result.createdAt).toBeDefined()
      expect(result.updatedAt).toBeDefined()
    })

    it('should throw error if archetype name already exists', async () => {
      const archetypeData = {
        name: 'Warrior',
        description: 'Strong melee fighter',
        visibility: 'PUBLIC' as const,
      }

      await createArchetype(archetypeData, mockUser)

      await expect(createArchetype(archetypeData, mockUser)).rejects.toThrow(
        'Archetype with name "Warrior" already exists',
      )
    })

    it('should throw error if user is not authenticated', async () => {
      const archetypeData = {
        name: 'Warrior',
        description: 'Strong melee fighter',
        visibility: 'PUBLIC' as const,
      }

      await expect(createArchetype(archetypeData, undefined)).rejects.toThrow(
        'Authentication required',
      )
    })

    it('should create archetype with valid image', async () => {
      const image = await db.image.create({
        data: {
          blob: Buffer.from('fake image data'),
          filename: 'warrior.webp',
          size: 100,
          mimeType: 'image/webp',
          width: 100,
          height: 100,
          ownerId: mockUser.id,
          visibility: 'PUBLIC',
        },
      })

      const archetypeData = {
        name: 'Warrior',
        description: 'Strong melee fighter',
        imageId: image.id,
        visibility: 'PUBLIC' as const,
      }

      const result = await createArchetype(archetypeData, mockUser)

      expect(result.imageId).toBe(image.id)
    })

    it('should throw error if image does not exist', async () => {
      const archetypeData = {
        name: 'Warrior',
        description: 'Strong melee fighter',
        imageId: 'non-existent-image-id',
        visibility: 'PUBLIC' as const,
      }

      await expect(createArchetype(archetypeData, mockUser)).rejects.toThrow('Image not found')
    })
  })

  describe('findArchetypeById', () => {
    it('should find archetype by id', async () => {
      const archetype = await db.archetype.create({
        data: {
          name: 'Warrior',
          description: 'Strong melee fighter',
          ownerId: mockUser.id,
          visibility: 'PUBLIC',
        },
      })

      const result = await findArchetypeById(archetype.id, mockUser)

      expect(result).toMatchObject({
        id: archetype.id,
        name: 'Warrior',
        description: 'Strong melee fighter',
        visibility: 'PUBLIC',
      })
    })

    it('should throw error if archetype not found', async () => {
      await expect(findArchetypeById('non-existent-id', mockUser)).rejects.toThrow(
        'Archetype not found',
      )
    })

    it('should throw error if user cannot access private archetype', async () => {
      const otherUser = await db.user.create({
        data: {
          email: 'other@example.com',
          passwordHash: 'hashedpassword123',
          name: 'Other User',
          role: 'USER',
          isActive: true,
          isEmailVerified: true,
        },
      })

      const archetype = await db.archetype.create({
        data: {
          name: 'Warrior',
          description: 'Strong melee fighter',
          ownerId: otherUser.id,
          visibility: 'PRIVATE',
        },
      })

      await expect(findArchetypeById(archetype.id, mockUser)).rejects.toThrow(
        'Insufficient permissions',
      )
    })
  })

  describe('listArchetypes', () => {
    beforeEach(async () => {
      await db.archetype.create({
        data: {
          name: 'Warrior',
          description: 'Strong melee fighter',
          ownerId: mockUser.id,
          visibility: 'PUBLIC',
        },
      })

      await db.archetype.create({
        data: {
          name: 'Mage',
          description: 'Magical spellcaster',
          ownerId: mockUser.id,
          visibility: 'PUBLIC',
        },
      })
    })

    it('should list archetypes with pagination', async () => {
      const result = await listArchetypes({}, mockUser)

      expect(result.archetypes).toHaveLength(2)
      expect(result.pagination).toMatchObject({
        currentPage: 1,
        totalPages: 1,
        totalCount: 2,
        hasNext: false,
        hasPrev: false,
      })
    })

    it('should filter archetypes by search term', async () => {
      const result = await listArchetypes({ search: 'Warrior' }, mockUser)

      expect(result.archetypes).toHaveLength(1)
      expect(result.archetypes[0].name).toBe('Warrior')
    })

    it('should filter archetypes by visibility', async () => {
      await db.archetype.create({
        data: {
          name: 'Secret',
          description: 'Hidden archetype',
          ownerId: mockUser.id,
          visibility: 'PRIVATE',
        },
      })

      const publicResult = await listArchetypes({ visibility: 'PUBLIC' }, mockUser)
      const privateResult = await listArchetypes({ visibility: 'PRIVATE' }, mockUser)

      expect(publicResult.archetypes).toHaveLength(2)
      expect(privateResult.archetypes).toHaveLength(1)
      expect(privateResult.archetypes[0].name).toBe('Secret')
    })
  })

  describe('updateArchetype', () => {
    let archetype: any

    beforeEach(async () => {
      archetype = await db.archetype.create({
        data: {
          name: 'Warrior',
          description: 'Strong melee fighter',
          ownerId: mockUser.id,
          visibility: 'PUBLIC',
        },
      })
    })

    it('should update archetype successfully', async () => {
      const updateData = {
        name: 'Elite Warrior',
        description: 'Very strong melee fighter',
      }

      const result = await updateArchetype(archetype.id, updateData, mockUser)

      expect(result).toMatchObject({
        id: archetype.id,
        name: 'Elite Warrior',
        description: 'Very strong melee fighter',
      })
    })

    it('should throw error if archetype not found', async () => {
      await expect(
        updateArchetype('non-existent-id', { name: 'Updated' }, mockUser),
      ).rejects.toThrow('Archetype not found')
    })

    it('should throw error if user cannot modify archetype', async () => {
      const otherUser = await db.user.create({
        data: {
          email: 'other@example.com',
          passwordHash: 'hashedpassword123',
          name: 'Other User',
          role: 'USER',
          isActive: true,
          isEmailVerified: true,
        },
      })

      const otherMockUser = {
        id: otherUser.id,
        role: otherUser.role,
        isActive: otherUser.isActive,
        isEmailVerified: otherUser.isEmailVerified,
      }

      await expect(
        updateArchetype(archetype.id, { name: 'Updated' }, otherMockUser),
      ).rejects.toThrow('Insufficient permissions')
    })

    it('should throw error if name conflicts with existing archetype', async () => {
      await db.archetype.create({
        data: {
          name: 'Mage',
          description: 'Magical spellcaster',
          ownerId: mockUser.id,
          visibility: 'PUBLIC',
        },
      })

      await expect(updateArchetype(archetype.id, { name: 'Mage' }, mockUser)).rejects.toThrow(
        'Archetype with name "Mage" already exists',
      )
    })
  })

  describe('deleteArchetype', () => {
    let archetype: any

    beforeEach(async () => {
      archetype = await db.archetype.create({
        data: {
          name: 'Warrior',
          description: 'Strong melee fighter',
          ownerId: mockUser.id,
          visibility: 'PUBLIC',
        },
      })
    })

    it('should delete archetype successfully', async () => {
      await deleteArchetype(archetype.id, mockUser)

      const deletedArchetype = await db.archetype.findUnique({
        where: { id: archetype.id },
      })

      expect(deletedArchetype).toBeNull()
    })

    it('should throw error if archetype not found', async () => {
      await expect(deleteArchetype('non-existent-id', mockUser)).rejects.toThrow(
        'Archetype not found',
      )
    })

    it('should throw error if user cannot delete archetype', async () => {
      const otherUser = await db.user.create({
        data: {
          email: 'other@example.com',
          passwordHash: 'hashedpassword123',
          name: 'Other User',
          role: 'USER',
          isActive: true,
          isEmailVerified: true,
        },
      })

      const otherMockUser = {
        id: otherUser.id,
        role: otherUser.role,
        isActive: otherUser.isActive,
        isEmailVerified: otherUser.isEmailVerified,
      }

      await expect(deleteArchetype(archetype.id, otherMockUser)).rejects.toThrow(
        'Insufficient permissions',
      )
    })

    it('should throw error if archetype is used by characters', async () => {
      const race = await db.race.create({
        data: {
          name: 'Human',
          description: 'Versatile and adaptable',
          ownerId: mockUser.id,
          visibility: 'PUBLIC',
        },
      })

      await db.character.create({
        data: {
          name: 'Test Character',
          age: 25,
          sex: 'MALE',
          ownerId: mockUser.id,
          raceId: race.id,
          archetypeId: archetype.id,
          visibility: 'PUBLIC',
        },
      })

      await expect(deleteArchetype(archetype.id, mockUser)).rejects.toThrow(
        'Cannot delete archetype "Warrior" as it is used by 1 character(s)',
      )
    })
  })

  describe('getArchetypeStats', () => {
    beforeEach(async () => {
      await db.archetype.createMany({
        data: [
          {
            name: 'Warrior',
            description: 'Strong melee fighter',
            ownerId: mockUser.id,
            visibility: 'PUBLIC',
          },
          {
            name: 'Mage',
            description: 'Magical spellcaster',
            ownerId: mockUser.id,
            visibility: 'PUBLIC',
          },
        ],
      })
    })

    it('should return archetype statistics for admin', async () => {
      const result = await getArchetypeStats(mockAdmin)

      expect(result).toMatchObject({
        totalCount: 2,
        byVisibility: {},
        byOwnership: [],
        skillsDistribution: {},
        requiredRacesDistribution: {},
        tagsDistribution: {},
        charactersDistribution: {},
        averageSkillsPerArchetype: 0,
        averageRequiredRacesPerArchetype: 0,
        averageTagsPerArchetype: 0,
        averageCharactersPerArchetype: 0,
      })
    })

    it('should throw error if user cannot view statistics', async () => {
      await expect(getArchetypeStats(mockUser)).rejects.toThrow('Insufficient permissions')
    })
  })
})
