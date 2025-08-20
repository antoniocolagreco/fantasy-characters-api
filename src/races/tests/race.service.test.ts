import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
  createRace,
  findRaceById,
  updateRace,
  deleteRace,
  listRaces,
  getRaceStats,
} from '../race.service.js'
import { db } from '../../shared/database/index.js'
import type { AuthUser } from '../../shared/rbac.service.js'

// Mock user for testing
let mockUser: AuthUser
let mockAdmin: AuthUser

describe('Race Service', () => {
  beforeEach(async () => {
    // Clean up database before each test in proper order due to foreign key constraints
    await db.character.deleteMany({})
    await db.archetype.deleteMany({})
    await db.race.deleteMany({})
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
    // Clean up database after each test in proper order due to foreign key constraints
    await db.character.deleteMany({})
    await db.archetype.deleteMany({})
    await db.race.deleteMany({})
    await db.image.deleteMany({})
    await db.user.deleteMany({})
  })

  describe('createRace', () => {
    it('should create a new race successfully', async () => {
      const raceData = {
        name: 'Elf',
        description: 'Graceful forest dwellers',
        strengthModifier: 8,
        dexterityModifier: 14,
        intelligenceModifier: 12,
        visibility: 'PUBLIC' as const,
      }

      const race = await createRace(raceData, mockUser)

      expect(race).toMatchObject({
        name: 'Elf',
        description: 'Graceful forest dwellers',
        strengthModifier: 8,
        dexterityModifier: 14,
        intelligenceModifier: 12,
        visibility: 'PUBLIC',
        ownerId: mockUser.id,
      })
      expect(race.id).toBeDefined()
      expect(race.createdAt).toBeDefined()
      expect(race.updatedAt).toBeDefined()
    })

    it('should create a race with default values', async () => {
      const raceData = {
        name: 'Human',
      }

      const race = await createRace(raceData, mockUser)

      expect(race).toMatchObject({
        name: 'Human',
        description: null,
        healthModifier: 100,
        manaModifier: 100,
        staminaModifier: 100,
        strengthModifier: 10,
        constitutionModifier: 10,
        dexterityModifier: 10,
        intelligenceModifier: 10,
        wisdomModifier: 10,
        charismaModifier: 10,
        visibility: 'PUBLIC',
        ownerId: mockUser.id,
        imageId: null,
      })
    })

    it('should create race with all modifier values', async () => {
      const raceData = {
        name: 'Dwarf',
        description: 'Sturdy mountain folk',
        healthModifier: 120,
        manaModifier: 80,
        staminaModifier: 110,
        strengthModifier: 13,
        constitutionModifier: 14,
        dexterityModifier: 8,
        intelligenceModifier: 9,
        wisdomModifier: 11,
        charismaModifier: 9,
      }

      const race = await createRace(raceData, mockUser)

      expect(race).toMatchObject(raceData)
      expect(race.ownerId).toBe(mockUser.id)
    })

    it('should throw error if race name already exists', async () => {
      const raceData = {
        name: 'Elf',
        description: 'Forest dwellers',
      }

      await createRace(raceData, mockUser)

      await expect(createRace(raceData, mockUser)).rejects.toThrow(
        'Race with name "Elf" already exists',
      )
    })

    it('should throw error if user is not authenticated', async () => {
      const raceData = {
        name: 'Elf',
      }

      await expect(createRace(raceData, null)).rejects.toThrow('Authentication required')
    })

    it('should validate image exists when provided', async () => {
      // Create an image first
      const image = await db.image.create({
        data: {
          blob: Buffer.from('test-image'),
          filename: 'elf.webp',
          size: 1024,
          mimeType: 'image/webp',
          width: 100,
          height: 100,
          ownerId: mockUser.id,
        },
      })

      const raceData = {
        name: 'Elf',
        imageId: image.id,
      }

      const race = await createRace(raceData, mockUser)
      expect(race.imageId).toBe(image.id)
    })

    it('should throw error if image does not exist', async () => {
      const raceData = {
        name: 'Elf',
        imageId: 'non-existent-id',
      }

      await expect(createRace(raceData, mockUser)).rejects.toThrow('Image not found')
    })
  })

  describe('findRaceById', () => {
    it('should find race by ID', async () => {
      const createdRace = await db.race.create({
        data: {
          name: 'Test Race',
          description: 'Test description',
          strengthModifier: 12,
          ownerId: mockUser.id,
          visibility: 'PUBLIC',
        },
      })

      const race = await findRaceById(createdRace.id, mockUser)

      expect(race).toMatchObject({
        id: createdRace.id,
        name: 'Test Race',
        description: 'Test description',
        strengthModifier: 12,
        ownerId: mockUser.id,
        visibility: 'PUBLIC',
      })
    })

    it('should throw error if race not found', async () => {
      await expect(findRaceById('non-existent-id', mockUser)).rejects.toThrow('Race not found')
    })

    it('should throw error if user cannot access private race', async () => {
      // Create a private race owned by admin
      const createdRace = await db.race.create({
        data: {
          name: 'Private Race',
          ownerId: mockAdmin.id,
          visibility: 'PRIVATE',
        },
      })

      await expect(findRaceById(createdRace.id, mockUser)).rejects.toThrow(
        'Insufficient permissions to access this race',
      )
    })

    it('should allow admin to access any race', async () => {
      // Create a private race owned by user
      const createdRace = await db.race.create({
        data: {
          name: 'Private Race',
          ownerId: mockUser.id,
          visibility: 'PRIVATE',
        },
      })

      const race = await findRaceById(createdRace.id, mockAdmin)
      expect(race.name).toBe('Private Race')
    })
  })

  describe('listRaces', () => {
    beforeEach(async () => {
      // Create test races
      await db.race.createMany({
        data: [
          {
            name: 'Human',
            description: 'Versatile beings',
            strengthModifier: 10,
            intelligenceModifier: 10,
            ownerId: mockUser.id,
            visibility: 'PUBLIC',
          },
          {
            name: 'Elf',
            description: 'Graceful forest dwellers',
            strengthModifier: 8,
            dexterityModifier: 14,
            intelligenceModifier: 12,
            ownerId: mockUser.id,
            visibility: 'PUBLIC',
          },
          {
            name: 'Dwarf',
            description: 'Sturdy mountain folk',
            strengthModifier: 13,
            constitutionModifier: 14,
            dexterityModifier: 8,
            ownerId: mockAdmin.id,
            visibility: 'PUBLIC',
          },
          {
            name: 'Private Race',
            ownerId: mockAdmin.id,
            visibility: 'PRIVATE',
          },
        ],
      })
    })

    it('should list all accessible races', async () => {
      const result = await listRaces({}, mockUser)

      expect(result.races).toHaveLength(3) // 3 public races
      expect(result.total).toBe(3)
      expect(result.races.map(r => r.name)).toContain('Human')
      expect(result.races.map(r => r.name)).toContain('Elf')
      expect(result.races.map(r => r.name)).toContain('Dwarf')
      expect(result.races.map(r => r.name)).not.toContain('Private Race')
    })

    it('should allow admin to see all races', async () => {
      const result = await listRaces({}, mockAdmin)

      expect(result.races).toHaveLength(4) // All races including private
      expect(result.total).toBe(4)
      expect(result.races.map(r => r.name)).toContain('Private Race')
    })

    it('should filter by strength modifier', async () => {
      const result = await listRaces({ minStrength: 12 }, mockUser)

      expect(result.races).toHaveLength(1)
      expect(result.races[0].name).toBe('Dwarf')
      expect(result.races[0].strengthModifier).toBe(13)
    })

    it('should filter by intelligence modifier', async () => {
      const result = await listRaces({ minIntelligence: 11 }, mockUser)

      expect(result.races).toHaveLength(1)
      expect(result.races[0].name).toBe('Elf')
      expect(result.races[0].intelligenceModifier).toBe(12)
    })

    it('should filter by strength range', async () => {
      const result = await listRaces({ minStrength: 9, maxStrength: 11 }, mockUser)

      expect(result.races).toHaveLength(1)
      expect(result.races[0].name).toBe('Human')
      expect(result.races[0].strengthModifier).toBe(10)
    })

    it('should search by name', async () => {
      const result = await listRaces({ search: 'Elf' }, mockUser)

      expect(result.races).toHaveLength(1)
      expect(result.races[0].name).toBe('Elf')
    })

    it('should search by description', async () => {
      const result = await listRaces({ search: 'forest' }, mockUser)

      expect(result.races).toHaveLength(1)
      expect(result.races[0].name).toBe('Elf')
    })

    it('should paginate results', async () => {
      const result = await listRaces({ page: 1, limit: 2 }, mockUser)

      expect(result.races).toHaveLength(2)
      expect(result.page).toBe(1)
      expect(result.limit).toBe(2)
      expect(result.total).toBe(3)
      expect(result.totalPages).toBe(2)
    })

    it('should handle empty results', async () => {
      const result = await listRaces({ search: 'Nonexistent' }, mockUser)

      expect(result.races).toHaveLength(0)
      expect(result.total).toBe(0)
    })
  })

  describe('updateRace', () => {
    let raceId: string

    beforeEach(async () => {
      const createdRace = await db.race.create({
        data: {
          name: 'Original Race',
          description: 'Original description',
          strengthModifier: 10,
          ownerId: mockUser.id,
          visibility: 'PUBLIC',
        },
      })
      raceId = createdRace.id
    })

    it('should update race successfully', async () => {
      const updateData = {
        name: 'Updated Race',
        description: 'Updated description',
        strengthModifier: 12,
        dexterityModifier: 14,
      }

      const updatedRace = await updateRace(raceId, updateData, mockUser)

      expect(updatedRace).toMatchObject({
        id: raceId,
        name: 'Updated Race',
        description: 'Updated description',
        strengthModifier: 12,
        dexterityModifier: 14,
        ownerId: mockUser.id,
      })
    })

    it('should update only specified fields', async () => {
      const updateData = {
        strengthModifier: 15,
      }

      const updatedRace = await updateRace(raceId, updateData, mockUser)

      expect(updatedRace.name).toBe('Original Race') // Unchanged
      expect(updatedRace.strengthModifier).toBe(15) // Changed
    })

    it('should throw error if race not found', async () => {
      const updateData = { name: 'New Name' }

      await expect(updateRace('non-existent-id', updateData, mockUser)).rejects.toThrow(
        'Race not found',
      )
    })

    it('should throw error if user cannot modify race', async () => {
      // Create a race owned by admin
      const adminRace = await db.race.create({
        data: {
          name: 'Admin Race',
          ownerId: mockAdmin.id,
        },
      })

      const updateData = { name: 'Updated Name' }

      await expect(updateRace(adminRace.id, updateData, mockUser)).rejects.toThrow(
        'Insufficient permissions to modify this race',
      )
    })

    it('should allow admin to modify any race', async () => {
      const updateData = { name: 'Admin Updated' }

      const updatedRace = await updateRace(raceId, updateData, mockAdmin)

      expect(updatedRace.name).toBe('Admin Updated')
    })

    it('should throw error if name already exists', async () => {
      // Create another race
      await db.race.create({
        data: {
          name: 'Existing Race',
          ownerId: mockUser.id,
        },
      })

      const updateData = { name: 'Existing Race' }

      await expect(updateRace(raceId, updateData, mockUser)).rejects.toThrow(
        'Race with name "Existing Race" already exists',
      )
    })

    it('should update with image reference', async () => {
      // Create an image
      const image = await db.image.create({
        data: {
          blob: Buffer.from('test-image'),
          filename: 'race.webp',
          size: 1024,
          mimeType: 'image/webp',
          width: 100,
          height: 100,
          ownerId: mockUser.id,
        },
      })

      const updateData = { imageId: image.id }

      const updatedRace = await updateRace(raceId, updateData, mockUser)
      expect(updatedRace.imageId).toBe(image.id)
    })
  })

  describe('deleteRace', () => {
    let raceId: string

    beforeEach(async () => {
      const createdRace = await db.race.create({
        data: {
          name: 'Test Race',
          ownerId: mockUser.id,
        },
      })
      raceId = createdRace.id
    })

    it('should delete race successfully', async () => {
      await deleteRace(raceId, mockUser)

      const deletedRace = await db.race.findUnique({ where: { id: raceId } })
      expect(deletedRace).toBeNull()
    })

    it('should throw error if race not found', async () => {
      await expect(deleteRace('non-existent-id', mockUser)).rejects.toThrow('Race not found')
    })

    it('should throw error if user cannot delete race', async () => {
      // Create a race owned by admin
      const adminRace = await db.race.create({
        data: {
          name: 'Admin Race',
          ownerId: mockAdmin.id,
        },
      })

      await expect(deleteRace(adminRace.id, mockUser)).rejects.toThrow(
        'Insufficient permissions to delete this race',
      )
    })

    it('should allow admin to delete any race', async () => {
      await deleteRace(raceId, mockAdmin)

      const deletedRace = await db.race.findUnique({ where: { id: raceId } })
      expect(deletedRace).toBeNull()
    })

    it('should throw error if race is used by characters', async () => {
      // Create an archetype first with unique name
      const timestamp = Date.now()
      const archetype = await db.archetype.create({
        data: {
          name: `Test Archetype ${timestamp}`,
          ownerId: mockUser.id,
        },
      })

      // Create a character using the race
      await db.character.create({
        data: {
          name: `Test Character ${timestamp}`,
          ownerId: mockUser.id,
          raceId: raceId,
          archetypeId: archetype.id,
        },
      })

      await expect(deleteRace(raceId, mockUser)).rejects.toThrow(
        'Cannot delete race "Test Race" as it is being used by 1 character(s)',
      )
    })

    it('should throw error if race is required by archetypes', async () => {
      // Create an archetype that requires this race
      await db.archetype.create({
        data: {
          name: 'Elven Archer',
          ownerId: mockUser.id,
          requiredRaces: {
            connect: { id: raceId },
          },
        },
      })

      await expect(deleteRace(raceId, mockUser)).rejects.toThrow(
        'Cannot delete race "Test Race" as it is required by 1 archetype(s)',
      )
    })
  })

  describe('getRaceStats', () => {
    beforeEach(async () => {
      // Create test races for statistics
      await db.race.createMany({
        data: [
          {
            name: 'Human',
            strengthModifier: 10,
            intelligenceModifier: 10,
            healthModifier: 100,
            manaModifier: 100,
            ownerId: mockUser.id,
            visibility: 'PUBLIC',
          },
          {
            name: 'Elf',
            strengthModifier: 8,
            intelligenceModifier: 14,
            dexterityModifier: 12,
            healthModifier: 90,
            manaModifier: 130,
            ownerId: mockUser.id,
            visibility: 'PUBLIC',
          },
          {
            name: 'Dwarf',
            strengthModifier: 14,
            constitutionModifier: 13,
            intelligenceModifier: 8,
            healthModifier: 120,
            manaModifier: 80,
            ownerId: mockAdmin.id,
            visibility: 'PUBLIC',
          },
          {
            name: 'Private Race',
            strengthModifier: 12,
            ownerId: mockAdmin.id,
            visibility: 'PRIVATE',
          },
          {
            name: 'Orphaned Race',
            strengthModifier: 11,
            ownerId: null,
            visibility: 'PUBLIC',
          },
        ],
      })
    })

    it('should return race statistics for user', async () => {
      const stats = await getRaceStats(mockUser)

      expect(stats.totalRaces).toBe(4) // User can see 4 races (3 public + 1 orphaned)
      expect(stats.publicRaces).toBe(4) // All visible races are public
      expect(stats.privateRaces).toBe(0) // User can't see private races
      expect(stats.orphanedRaces).toBe(1)
    })

    it('should return complete race statistics for admin', async () => {
      const stats = await getRaceStats(mockAdmin)

      expect(stats.totalRaces).toBe(5) // Admin can see all races
      expect(stats.publicRaces).toBe(4)
      expect(stats.privateRaces).toBe(1)
      expect(stats.orphanedRaces).toBe(1)
    })

    it('should calculate average modifiers correctly', async () => {
      const stats = await getRaceStats(mockAdmin)

      // Calculate expected averages
      // Human: str=10, int=10, health=100, mana=100
      // Elf: str=8, int=14, dex=12, health=90, mana=130
      // Dwarf: str=14, con=13, int=8, health=120, mana=80
      // Private: str=12 (defaults for others)
      // Orphaned: str=11 (defaults for others)

      expect(stats.averageModifiers.strength).toBeCloseTo((10 + 8 + 14 + 12 + 11) / 5, 2)
      expect(stats.averageModifiers.intelligence).toBeCloseTo((10 + 14 + 8 + 10 + 10) / 5, 2)
      expect(stats.averageModifiers.health).toBeCloseTo((100 + 90 + 120 + 100 + 100) / 5, 2)
    })

    it('should calculate popular modifier ranges correctly', async () => {
      const stats = await getRaceStats(mockAdmin)

      expect(stats.popularModifierRanges.highStrength).toBe(2) // Dwarf (14), Private (12)
      expect(stats.popularModifierRanges.highIntelligence).toBe(1) // Elf (14)
      expect(stats.popularModifierRanges.highDexterity).toBe(1) // Elf (12)
      expect(stats.popularModifierRanges.highConstitution).toBe(1) // Dwarf (13)
      expect(stats.popularModifierRanges.balanced).toBe(2) // Human and Orphaned (all have 9-11 in all attributes)
    })
  })
})
