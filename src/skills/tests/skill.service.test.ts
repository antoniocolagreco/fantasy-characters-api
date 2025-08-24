import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
  createSkill,
  findSkillById,
  updateSkill,
  deleteSkill,
  listSkills,
  getSkillStats,
} from '../skill.service'
import { db } from '../../shared/prisma.service'
import type { AuthUser } from '../../auth/auth.types'

// Mock user for testing
let mockUser: AuthUser
let mockAdmin: AuthUser

describe('Skill Service', () => {
  beforeEach(async () => {
    // Clean up database before each test
    await db.skill.deleteMany({})
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
      email: createdUser.email,
      role: 'USER',
      isActive: true,
      isEmailVerified: true,
    }

    mockAdmin = {
      id: createdAdmin.id,
      email: createdAdmin.email,
      role: 'ADMIN',
      isActive: true,
      isEmailVerified: true,
    }
  })

  afterEach(async () => {
    // Clean up database after each test
    await db.skill.deleteMany({})
    await db.character.deleteMany({})
    await db.image.deleteMany({})
    await db.user.deleteMany({})
  })

  describe('createSkill', () => {
    it('should create a new skill successfully', async () => {
      const skillData = {
        name: 'Fireball',
        description: 'A powerful fire spell',
        requiredLevel: 5,
        visibility: 'PUBLIC' as const,
      }

      const skill = await createSkill(skillData, mockUser)

      expect(skill).toMatchObject({
        name: 'Fireball',
        description: 'A powerful fire spell',
        requiredLevel: 5,
        visibility: 'PUBLIC',
        ownerId: mockUser.id,
      })
      expect(skill.id).toBeDefined()
      expect(skill.createdAt).toBeDefined()
      expect(skill.updatedAt).toBeDefined()
    })

    it('should create a skill with default values', async () => {
      const skillData = {
        name: 'Basic Attack',
      }

      const skill = await createSkill(skillData, mockUser)

      expect(skill).toMatchObject({
        name: 'Basic Attack',
        description: null,
        requiredLevel: 1,
        visibility: 'PUBLIC',
        ownerId: mockUser.id,
        imageId: null,
      })
    })

    it('should throw error if skill name already exists', async () => {
      const skillData = {
        name: 'Fireball',
        description: 'A fire spell',
      }

      await createSkill(skillData, mockUser)

      await expect(createSkill(skillData, mockUser)).rejects.toThrow(
        'Skill with name "Fireball" already exists',
      )
    })

    it('should throw error if user is not authenticated', async () => {
      const skillData = {
        name: 'Fireball',
      }

      await expect(createSkill(skillData, undefined)).rejects.toThrow('Authentication required')
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

      const skillData = {
        name: 'Fireball',
        imageId: image.id,
      }

      const skill = await createSkill(skillData, mockUser)
      expect(skill.imageId).toBe(image.id)
    })

    it('should throw error if image does not exist', async () => {
      const skillData = {
        name: 'Fireball',
        imageId: 'non-existent-id',
      }

      await expect(createSkill(skillData, mockUser)).rejects.toThrow('Image not found')
    })
  })

  describe('findSkillById', () => {
    it('should find skill by ID', async () => {
      const createdSkill = await db.skill.create({
        data: {
          name: 'Test Skill',
          description: 'Test description',
          requiredLevel: 10,
          ownerId: mockUser.id,
          visibility: 'PUBLIC',
        },
      })

      const skill = await findSkillById(createdSkill.id, mockUser)

      expect(skill).toMatchObject({
        id: createdSkill.id,
        name: 'Test Skill',
        description: 'Test description',
        requiredLevel: 10,
        ownerId: mockUser.id,
        visibility: 'PUBLIC',
      })
    })

    it('should throw error if skill not found', async () => {
      await expect(findSkillById('non-existent-id', mockUser)).rejects.toThrow('Skill not found')
    })

    it('should throw error if user cannot access private skill', async () => {
      // Create a private skill owned by admin
      const createdSkill = await db.skill.create({
        data: {
          name: 'Private Skill',
          ownerId: mockAdmin.id,
          visibility: 'PRIVATE',
        },
      })

      await expect(findSkillById(createdSkill.id, mockUser)).rejects.toThrow(
        'Insufficient permissions to access this skill',
      )
    })

    it('should allow admin to access any skill', async () => {
      // Create a private skill owned by user
      const createdSkill = await db.skill.create({
        data: {
          name: 'Private Skill',
          ownerId: mockUser.id,
          visibility: 'PRIVATE',
        },
      })

      const skill = await findSkillById(createdSkill.id, mockAdmin)
      expect(skill.name).toBe('Private Skill')
    })
  })

  describe('updateSkill', () => {
    it('should update skill successfully', async () => {
      const createdSkill = await db.skill.create({
        data: {
          name: 'Original Skill',
          description: 'Original description',
          requiredLevel: 5,
          ownerId: mockUser.id,
          visibility: 'PUBLIC',
        },
      })

      const updateData = {
        name: 'Updated Skill',
        description: 'Updated description',
        requiredLevel: 10,
      }

      const updatedSkill = await updateSkill(createdSkill.id, updateData, mockUser)

      expect(updatedSkill).toMatchObject({
        name: 'Updated Skill',
        description: 'Updated description',
        requiredLevel: 10,
      })
    })

    it('should throw error if user cannot modify skill', async () => {
      // Create skill owned by admin
      const createdSkill = await db.skill.create({
        data: {
          name: 'Admin Skill',
          ownerId: mockAdmin.id,
        },
      })

      await expect(updateSkill(createdSkill.id, { name: 'Modified' }, mockUser)).rejects.toThrow(
        'Insufficient permissions to modify this skill',
      )
    })

    it('should throw error if new name conflicts', async () => {
      // Create two skills
      await db.skill.create({
        data: {
          name: 'Skill One',
          ownerId: mockUser.id,
        },
      })

      const skill2 = await db.skill.create({
        data: {
          name: 'Skill Two',
          ownerId: mockUser.id,
        },
      })

      await expect(updateSkill(skill2.id, { name: 'Skill One' }, mockUser)).rejects.toThrow(
        'Skill with name "Skill One" already exists',
      )
    })
  })

  describe('deleteSkill', () => {
    it('should delete skill successfully', async () => {
      const createdSkill = await db.skill.create({
        data: {
          name: 'Skill to Delete',
          ownerId: mockUser.id,
        },
      })

      await deleteSkill(createdSkill.id, mockUser)

      const deletedSkill = await db.skill.findUnique({
        where: { id: createdSkill.id },
      })
      expect(deletedSkill).toBeNull()
    })

    it('should throw error if user cannot delete skill', async () => {
      const createdSkill = await db.skill.create({
        data: {
          name: 'Protected Skill',
          ownerId: mockAdmin.id,
        },
      })

      await expect(deleteSkill(createdSkill.id, mockUser)).rejects.toThrow(
        'Insufficient permissions to delete this skill',
      )
    })

    it('should throw error if skill is used by characters', async () => {
      // Create a race and archetype first with unique names
      const timestamp = Date.now()
      const race = await db.race.create({
        data: {
          name: `Test Race Skills ${timestamp}`,
          ownerId: mockUser.id,
        },
      })

      const archetype = await db.archetype.create({
        data: {
          name: `Test Archetype Skills ${timestamp}`,
          ownerId: mockUser.id,
        },
      })

      const skill = await db.skill.create({
        data: {
          name: 'Used Skill',
          ownerId: mockUser.id,
        },
      })

      // Create a character that uses this skill
      await db.character.create({
        data: {
          name: 'Test Character',
          ownerId: mockUser.id,
          raceId: race.id,
          archetypeId: archetype.id,
          skills: {
            connect: { id: skill.id },
          },
        },
      })

      await expect(deleteSkill(skill.id, mockUser)).rejects.toThrow(
        'Cannot delete skill that is being used by characters',
      )
    })
  })

  describe('listSkills', () => {
    beforeEach(async () => {
      // Create test skills
      await db.skill.createMany({
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
            name: 'Private Skill',
            requiredLevel: 10,
            ownerId: mockAdmin.id,
            visibility: 'PRIVATE',
          },
        ],
      })
    })

    it('should list skills with pagination', async () => {
      const result = await listSkills({ page: 1, limit: 2 }, mockUser)

      expect(result.data).toHaveLength(2)
      expect(result.pagination).toMatchObject({
        page: 1,
        limit: 2,
        total: 3, // Should not include private skill
        totalPages: 2,
      })
    })

    it('should filter by level range', async () => {
      const result = await listSkills({ minLevel: 3, maxLevel: 5 }, mockUser)

      expect(result.data).toHaveLength(2)
      expect(result.data.every(skill => skill.requiredLevel >= 3 && skill.requiredLevel <= 5)).toBe(
        true,
      )
    })

    it('should search by name and description', async () => {
      const result = await listSkills({ search: 'fire' }, mockUser)

      expect(result.data).toHaveLength(1)
      expect(result.data[0].name).toBe('Fireball')
    })

    it('should allow admin to see all skills including private', async () => {
      const result = await listSkills({}, mockAdmin)

      expect(result.data).toHaveLength(4) // Including private skill
    })
  })

  describe('getSkillStats', () => {
    beforeEach(async () => {
      // Create test skills with different levels
      await db.skill.createMany({
        data: [
          { name: 'Beginner 1', requiredLevel: 5, ownerId: mockUser.id, visibility: 'PUBLIC' },
          { name: 'Beginner 2', requiredLevel: 8, ownerId: mockUser.id, visibility: 'PUBLIC' },
          { name: 'Intermediate 1', requiredLevel: 15, ownerId: mockUser.id, visibility: 'PUBLIC' },
          { name: 'Advanced 1', requiredLevel: 30, ownerId: mockUser.id, visibility: 'PUBLIC' },
          { name: 'Expert 1', requiredLevel: 60, ownerId: mockUser.id, visibility: 'PUBLIC' },
          {
            name: 'Private Skill',
            requiredLevel: 25,
            ownerId: mockAdmin.id,
            visibility: 'PRIVATE',
          },
          { name: 'Orphaned Skill', requiredLevel: 10, ownerId: null, visibility: 'PUBLIC' },
        ],
      })
    })

    it('should return correct statistics', async () => {
      const stats = await getSkillStats(mockUser)

      expect(stats).toMatchObject({
        totalSkills: 6, // Excluding private skill owned by admin
        publicSkills: 6,
        privateSkills: 0,
        orphanedSkills: 1,
        averageRequiredLevel: 21, // (5+8+15+30+60+10)/6 = 21.33 rounded
        skillsByLevelRange: {
          beginner: 3, // 5, 8, 10
          intermediate: 1, // 15
          advanced: 1, // 30
          expert: 1, // 60
        },
      })
    })

    it('should return admin statistics including all skills', async () => {
      const stats = await getSkillStats(mockAdmin)

      expect(stats).toMatchObject({
        totalSkills: 7,
        publicSkills: 6,
        privateSkills: 1,
        orphanedSkills: 1,
      })
    })
  })
})
