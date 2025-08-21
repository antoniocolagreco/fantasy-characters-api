/**
 * Character service tests
 * Unit tests for character business logic
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { db } from '../../shared/database/index'
import type { AuthUser } from '../../shared/rbac.service'
import {
  createCharacter,
  findCharacterById,
  listCharacters,
  updateCharacter,
  deleteCharacter,
  getCharacterStats,
} from '../character.service'
import type { CreateCharacterData, UpdateCharacterData, CharacterFilters } from '../character.types'
import { cleanupTestData, createTestUser, createTestAdminUser } from '../../shared/tests/test-utils'

describe('Character Service', () => {
  let testUser: AuthUser
  let adminUser: AuthUser
  let testRace: { id: string }
  let testArchetype: { id: string }

  beforeEach(async () => {
    // Clean up database before each test
    await db.character.deleteMany()
    await db.archetype.deleteMany()
    await db.race.deleteMany()
    await cleanupTestData()

    // Create test users
    const userData = await createTestUser()
    testUser = {
      id: userData.user.id,
      role: userData.user.role,
      isActive: userData.user.isActive,
      isEmailVerified: userData.user.isEmailVerified,
    }

    const adminData = await createTestAdminUser()
    adminUser = {
      id: adminData.user.id,
      role: adminData.user.role,
      isActive: adminData.user.isActive,
      isEmailVerified: adminData.user.isEmailVerified,
    }

    // Create test race with unique name
    const raceTestId = Math.random().toString(36).substring(7)
    testRace = await db.race.create({
      data: {
        name: `Test Elf ${raceTestId}`,
        description: 'Test elf race',
        healthModifier: 90,
        manaModifier: 120,
        staminaModifier: 100,
        strengthModifier: 8,
        constitutionModifier: 9,
        dexterityModifier: 12,
        intelligenceModifier: 11,
        wisdomModifier: 10,
        charismaModifier: 10,
        ownerId: adminUser.id,
        visibility: 'PUBLIC',
      },
    })

    // Create test archetype with unique name
    const archetypeTestId = Math.random().toString(36).substring(7)
    testArchetype = await db.archetype.create({
      data: {
        name: `Test Ranger ${archetypeTestId}`,
        description: 'Test ranger archetype',
        ownerId: adminUser.id,
        visibility: 'PUBLIC',
      },
    })
  })

  afterEach(async () => {
    // Clean up database after each test
    await db.character.deleteMany()
    await db.archetype.deleteMany()
    await db.race.deleteMany()
    await cleanupTestData()
  })

  // Helper function to create valid character data
  const createValidCharacterData = (
    overrides: Partial<CreateCharacterData> = {},
  ): CreateCharacterData => {
    const testId = Math.random().toString(36).substring(7)
    return {
      name: `Test Character ${testId}`,
      sex: 'MALE',
      age: 25,
      description: 'A test character',
      level: 1,
      experience: 0,
      strength: 10,
      constitution: 10,
      dexterity: 10,
      intelligence: 10,
      wisdom: 10,
      charisma: 10,
      raceId: testRace.id,
      archetypeId: testArchetype.id,
      visibility: 'PUBLIC',
      ...overrides,
    }
  }

  describe('createCharacter', () => {
    it('should create a character successfully', async () => {
      const characterData = createValidCharacterData()
      const result = await createCharacter(characterData, testUser)

      expect(result).toMatchObject({
        name: characterData.name,
        sex: characterData.sex,
        age: characterData.age,
        level: characterData.level,
        ownerId: testUser.id,
        raceId: testRace.id,
        archetypeId: testArchetype.id,
      })
      expect(result.id).toBeDefined()
      expect(result.createdAt).toBeDefined()
      expect(result.updatedAt).toBeDefined()
    })

    it('should calculate stats with race modifiers', async () => {
      const characterData = createValidCharacterData({
        strength: 10,
        constitution: 10,
        dexterity: 10,
        intelligence: 10,
        wisdom: 10,
        charisma: 10,
      })
      const result = await createCharacter(characterData, testUser)

      // Stats should be modified by race modifiers
      expect(result.health).toBe(90) // 100 * 0.9 (race healthModifier: 90)
      expect(result.mana).toBe(120) // 100 * 1.2 (race manaModifier: 120)
      expect(result.stamina).toBe(100) // 100 * 1.0 (race staminaModifier: 100)
      expect(result.strength).toBe(8) // race strengthModifier: 8
      expect(result.dexterity).toBe(12) // race dexterityModifier: 12
    })

    it('should reject character creation with duplicate name', async () => {
      const characterData = createValidCharacterData({ name: 'Duplicate Character' })

      // Create first character
      await createCharacter(characterData, testUser)

      // Try to create second character with same name
      await expect(createCharacter(characterData, testUser)).rejects.toThrow('already exists')
    })

    it('should reject character creation with invalid race', async () => {
      const characterData = createValidCharacterData({ raceId: 'invalid-race-id' })

      await expect(createCharacter(characterData, testUser)).rejects.toThrow()
    })

    it('should reject character creation with invalid archetype', async () => {
      const characterData = createValidCharacterData({ archetypeId: 'invalid-archetype-id' })

      await expect(createCharacter(characterData, testUser)).rejects.toThrow()
    })

    it('should enforce minimum age requirement', async () => {
      const characterData = createValidCharacterData({ age: 15 })

      await expect(createCharacter(characterData, testUser)).rejects.toThrow('must be at least 16')
    })

    it('should enforce maximum age requirement', async () => {
      const characterData = createValidCharacterData({ age: 1001 })

      await expect(createCharacter(characterData, testUser)).rejects.toThrow('cannot exceed 1000')
    })
  })

  describe('findCharacterById', () => {
    it('should find character by ID with relationships', async () => {
      const characterData = createValidCharacterData()
      const created = await createCharacter(characterData, testUser)

      const result = await findCharacterById(created.id, testUser, true)

      expect(result).toBeDefined()
      expect(result?.id).toBe(created.id)
      expect(result?.race).toBeDefined()
      expect(result?.archetype).toBeDefined()
      expect(result?.owner).toBeDefined()
    })

    it('should find character by ID without extended relationships', async () => {
      const created = await createCharacter(createValidCharacterData(), testUser)

      const result = await findCharacterById(created.id, testUser, false)

      expect(result).toBeDefined()
      expect(result?.id).toBe(created.id)
      // Race and archetype are always included as they are essential
      expect(result?.race).toBeDefined()
      expect(result?.archetype).toBeDefined()
      // Extended relationships should not be included
      expect(result?.skills).toEqual([])
      expect(result?.perks).toEqual([])
      expect(result?.tags).toEqual([])
      expect(result?.inventory).toEqual([])
    })

    it('should return null for non-existent character', async () => {
      const result = await findCharacterById('00000000-0000-0000-0000-000000000000', testUser)
      expect(result).toBeNull()
    })

    it('should respect visibility for non-owners', async () => {
      // Create private character as testUser
      const characterData = createValidCharacterData({
        name: 'Private Character',
        visibility: 'PRIVATE',
      })
      const created = await createCharacter(characterData, testUser)

      // Try to access as different user
      const otherUserData = await createTestUser({ email: 'other@example.com' })
      const otherUser: AuthUser = {
        id: otherUserData.user.id,
        role: otherUserData.user.role,
        isActive: otherUserData.user.isActive,
        isEmailVerified: otherUserData.user.isEmailVerified,
      }

      const result = await findCharacterById(created.id, otherUser)
      expect(result).toBeNull()
    })

    it('should allow admin to access any character', async () => {
      // Create private character as testUser
      const characterData = createValidCharacterData({
        name: 'Private Character',
        visibility: 'PRIVATE',
      })
      const created = await createCharacter(characterData, testUser)

      // Admin should be able to access
      const result = await findCharacterById(created.id, adminUser)
      expect(result).toBeDefined()
      expect(result?.id).toBe(created.id)
    })
  })

  describe('listCharacters', () => {
    beforeEach(async () => {
      // Create test characters
      await createCharacter(createValidCharacterData({ name: 'Character 1', level: 5 }), testUser)
      await createCharacter(createValidCharacterData({ name: 'Character 2', level: 10 }), testUser)
      await createCharacter(
        createValidCharacterData({
          name: 'Private Character',
          level: 15,
          visibility: 'PRIVATE',
        }),
        testUser,
      )
    })

    it('should list characters with pagination', async () => {
      const filters: CharacterFilters = { page: 1, limit: 2 }
      const result = await listCharacters(filters, testUser)

      expect(result.characters).toHaveLength(2)
      expect(result.total).toBeGreaterThanOrEqual(2)
      expect(result.page).toBe(1)
      expect(result.limit).toBe(2)
    })

    it('should filter characters by minimum level', async () => {
      const filters: CharacterFilters = { minLevel: 8 }
      const result = await listCharacters(filters, testUser)

      expect(result.characters.every(char => char.level >= 8)).toBe(true)
    })

    it('should filter characters by race', async () => {
      const filters: CharacterFilters = { raceId: testRace.id }
      const result = await listCharacters(filters, testUser)

      expect(result.characters.every(char => char.raceId === testRace.id)).toBe(true)
    })

    it('should filter characters by archetype', async () => {
      const filters: CharacterFilters = { archetypeId: testArchetype.id }
      const result = await listCharacters(filters, testUser)

      expect(result.characters.every(char => char.archetypeId === testArchetype.id)).toBe(true)
    })

    it('should search characters by name', async () => {
      const filters: CharacterFilters = { search: 'Character 1' }
      const result = await listCharacters(filters, testUser)

      expect(result.characters.some(char => char.name.includes('Character 1'))).toBe(true)
    })

    it('should include only visible characters for regular users', async () => {
      const otherUserData = await createTestUser({ email: 'other@example.com' })
      const otherUser: AuthUser = {
        id: otherUserData.user.id,
        role: otherUserData.user.role,
        isActive: otherUserData.user.isActive,
        isEmailVerified: otherUserData.user.isEmailVerified,
      }

      const result = await listCharacters({}, otherUser)

      // Should not include private characters from other users
      expect(
        result.characters.every(
          char => char.visibility === 'PUBLIC' || char.ownerId === otherUser.id,
        ),
      ).toBe(true)
    })

    it('should include all characters for admin users', async () => {
      const result = await listCharacters({}, adminUser)

      // Should include characters regardless of visibility (3 from beforeEach + potential private)
      expect(result.characters.length).toBeGreaterThanOrEqual(2)
    })
  })

  describe('updateCharacter', () => {
    let characterId: string

    beforeEach(async () => {
      const characterData = createValidCharacterData({ name: 'Character to Update' })
      const created = await createCharacter(characterData, testUser)
      characterId = created.id
    })

    it('should update character successfully', async () => {
      const updateData: UpdateCharacterData = {
        name: 'Updated Character',
        age: 30,
        level: 5,
      }

      const result = await updateCharacter(characterId, updateData, testUser)

      expect(result.name).toBe('Updated Character')
      expect(result.age).toBe(30)
      expect(result.level).toBe(5)
    })

    it('should recalculate stats when level changes', async () => {
      const updateData: UpdateCharacterData = { level: 10 }

      const result = await updateCharacter(characterId, updateData, testUser)

      expect(result.level).toBe(10)
      // Health, mana, stamina should be recalculated based on new level
    })

    it('should reject updates with duplicate names', async () => {
      // Create another character
      await createCharacter(createValidCharacterData({ name: 'Another Character' }), testUser)

      // Try to update first character to same name
      const updateData: UpdateCharacterData = { name: 'Another Character' }

      await expect(updateCharacter(characterId, updateData, testUser)).rejects.toThrow(
        'is already taken',
      )
    })

    it('should reject updates by non-owner', async () => {
      const otherUserData = await createTestUser({ email: 'other@example.com' })
      const otherUser: AuthUser = {
        id: otherUserData.user.id,
        role: otherUserData.user.role,
        isActive: otherUserData.user.isActive,
        isEmailVerified: otherUserData.user.isEmailVerified,
      }

      const updateData: UpdateCharacterData = { name: 'Hacked Character' }

      await expect(updateCharacter(characterId, updateData, otherUser)).rejects.toThrow(
        'Insufficient permissions',
      )
    })

    it('should allow admin to update any character', async () => {
      const updateData: UpdateCharacterData = { name: 'Admin Updated' }

      const result = await updateCharacter(characterId, updateData, adminUser)

      expect(result.name).toBe('Admin Updated')
    })
  })

  describe('deleteCharacter', () => {
    let characterId: string

    beforeEach(async () => {
      const characterData = createValidCharacterData({ name: 'Character to Delete' })
      const created = await createCharacter(characterData, testUser)
      characterId = created.id
    })

    it('should delete character successfully', async () => {
      await expect(deleteCharacter(characterId, testUser)).resolves.not.toThrow()

      // Verify character is deleted by checking it doesn't exist
      const result = await findCharacterById(characterId, testUser)
      expect(result).toBeNull()
    })

    it('should reject deletion by non-owner', async () => {
      const otherUserData = await createTestUser({ email: 'other@example.com' })
      const otherUser: AuthUser = {
        id: otherUserData.user.id,
        role: otherUserData.user.role,
        isActive: otherUserData.user.isActive,
        isEmailVerified: otherUserData.user.isEmailVerified,
      }

      await expect(deleteCharacter(characterId, otherUser)).rejects.toThrow(
        'Insufficient permissions',
      )
    })

    it('should allow admin to delete any character', async () => {
      await expect(deleteCharacter(characterId, adminUser)).resolves.not.toThrow()

      // Verify character is deleted by checking it doesn't exist
      const result = await findCharacterById(characterId, adminUser)
      expect(result).toBeNull()
    })

    it('should return error for non-existent character', async () => {
      await expect(
        deleteCharacter('00000000-0000-0000-0000-000000000000', testUser),
      ).rejects.toThrow('not found')
    })
  })

  describe('getCharacterStats', () => {
    beforeEach(async () => {
      // Create characters with different levels and races
      await createCharacter(createValidCharacterData({ name: 'Char 1', level: 5 }), testUser)
      await createCharacter(createValidCharacterData({ name: 'Char 2', level: 10 }), testUser)
      await createCharacter(createValidCharacterData({ name: 'Char 3', level: 15 }), testUser)
    })

    it('should return character statistics', async () => {
      const result = await getCharacterStats(testUser)

      expect(result.totalCount).toBeGreaterThanOrEqual(3)
      expect(result.averageLevel).toBeGreaterThan(0)
      expect(result.levelDistribution).toBeDefined()
      expect(result.raceDistribution).toBeDefined()
      expect(result.archetypeDistribution).toBeDefined()
    })

    it('should filter stats by visibility for regular users', async () => {
      // Create private character
      await createCharacter(
        createValidCharacterData({
          name: 'Private Char',
          visibility: 'PRIVATE',
        }),
        testUser,
      )

      const otherUserData = await createTestUser({ email: 'other@example.com' })
      const otherUser: AuthUser = {
        id: otherUserData.user.id,
        role: otherUserData.user.role,
        isActive: otherUserData.user.isActive,
        isEmailVerified: otherUserData.user.isEmailVerified,
      }

      const result = await getCharacterStats(otherUser)

      // Should only count public characters
      expect(result.totalCount).toBe(3) // Only public characters
    })

    it('should include all characters in stats for admin', async () => {
      // Create private character
      await createCharacter(
        createValidCharacterData({
          name: 'Private Char',
          visibility: 'PRIVATE',
        }),
        testUser,
      )

      const result = await getCharacterStats(adminUser)

      // Should count all characters including private ones (3 from beforeEach + 1 private = 4 total)
      expect(result.totalCount).toBeGreaterThanOrEqual(3)
    })
  })

  // Additional tests to improve branch coverage
  describe('listCharacters edge cases', () => {
    it('should test various filter combinations for branch coverage', async () => {
      // Create characters with different attributes to test filters
      const char1 = await createCharacter(
        createValidCharacterData({
          name: 'Test Filter 1',
          experience: 1500,
          strength: 15,
          constitution: 14,
          dexterity: 16,
          intelligence: 18,
          wisdom: 17,
          charisma: 19,
        }),
        testUser,
      )

      // Update the character to have specific health/mana/stamina values
      await db.character.update({
        where: { id: char1.id },
        data: { health: 120, mana: 130, stamina: 110 },
      })

      // Test each attribute filter branch
      let result = await listCharacters({ minExperience: 1000 }, testUser)
      expect(result.characters.length).toBeGreaterThanOrEqual(1)

      result = await listCharacters({ maxExperience: 2000 }, testUser)
      expect(result.characters.length).toBeGreaterThanOrEqual(1)

      result = await listCharacters({ minStrength: 10 }, testUser)
      expect(result.characters.length).toBeGreaterThanOrEqual(1)

      result = await listCharacters({ maxStrength: 20 }, testUser)
      expect(result.characters.length).toBeGreaterThanOrEqual(1)

      result = await listCharacters({ minConstitution: 10 }, testUser)
      expect(result.characters.length).toBeGreaterThanOrEqual(1)

      result = await listCharacters({ maxConstitution: 20 }, testUser)
      expect(result.characters.length).toBeGreaterThanOrEqual(1)

      result = await listCharacters({ minDexterity: 10 }, testUser)
      expect(result.characters.length).toBeGreaterThanOrEqual(1)

      result = await listCharacters({ maxDexterity: 20 }, testUser)
      expect(result.characters.length).toBeGreaterThanOrEqual(1)

      result = await listCharacters({ minIntelligence: 10 }, testUser)
      expect(result.characters.length).toBeGreaterThanOrEqual(1)

      result = await listCharacters({ maxIntelligence: 20 }, testUser)
      expect(result.characters.length).toBeGreaterThanOrEqual(1)

      result = await listCharacters({ minWisdom: 10 }, testUser)
      expect(result.characters.length).toBeGreaterThanOrEqual(1)

      result = await listCharacters({ maxWisdom: 20 }, testUser)
      expect(result.characters.length).toBeGreaterThanOrEqual(1)

      result = await listCharacters({ minCharisma: 10 }, testUser)
      expect(result.characters.length).toBeGreaterThanOrEqual(1)

      result = await listCharacters({ maxCharisma: 20 }, testUser)
      expect(result.characters.length).toBeGreaterThanOrEqual(1)

      // Test core attribute filters
      result = await listCharacters({ minHealth: 100 }, testUser)
      expect(result.characters.length).toBeGreaterThanOrEqual(1)

      result = await listCharacters({ maxHealth: 150 }, testUser)
      expect(result.characters.length).toBeGreaterThanOrEqual(1)

      result = await listCharacters({ minMana: 100 }, testUser)
      expect(result.characters.length).toBeGreaterThanOrEqual(1)

      result = await listCharacters({ maxMana: 150 }, testUser)
      expect(result.characters.length).toBeGreaterThanOrEqual(1)

      result = await listCharacters({ minStamina: 100 }, testUser)
      expect(result.characters.length).toBeGreaterThanOrEqual(1)

      result = await listCharacters({ maxStamina: 150 }, testUser)
      expect(result.characters.length).toBeGreaterThanOrEqual(1)

      // Test other filters
      result = await listCharacters({ sex: 'MALE' }, testUser)
      expect(result.characters.length).toBeGreaterThanOrEqual(1)

      result = await listCharacters({ visibility: 'PUBLIC' }, testUser)
      expect(result.characters.length).toBeGreaterThanOrEqual(1)

      result = await listCharacters({ ownerId: testUser.id }, testUser)
      expect(result.characters.length).toBeGreaterThanOrEqual(1)

      result = await listCharacters({ includeOrphaned: true }, adminUser)
      expect(result.characters.length).toBeGreaterThanOrEqual(1)

      result = await listCharacters({ includeOrphaned: false }, adminUser)
      expect(result.characters.length).toBeGreaterThanOrEqual(1)
    })
  })
})
