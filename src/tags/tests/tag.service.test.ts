import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { createTag, findTagById, updateTag, deleteTag, listTags, getTagStats } from '../tag.service'
import { db } from '../../shared/database/index'
import type { AuthUser } from '../../shared/rbac.service'

// Mock user for testing
let mockUser: AuthUser

describe('Tag Service', () => {
  beforeEach(async () => {
    // Clean up database before each test
    await db.tag.deleteMany({})
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

    mockUser = {
      id: createdUser.id,
      role: 'USER',
      isActive: true,
      isEmailVerified: true,
    }
  })

  afterEach(async () => {
    // Clean up database after each test
    await db.tag.deleteMany({})
    await db.user.deleteMany({})
  })

  describe('createTag', () => {
    it('should create a new tag successfully', async () => {
      const tagData = {
        name: 'test-tag',
        description: 'A test tag',
        visibility: 'PUBLIC' as const,
      }

      const tag = await createTag(tagData, mockUser)

      expect(tag).toMatchObject({
        name: 'test-tag',
        description: 'A test tag',
        visibility: 'PUBLIC',
        ownerId: mockUser.id,
      })
      expect(tag.id).toBeDefined()
      expect(tag.createdAt).toBeDefined()
      expect(tag.updatedAt).toBeDefined()
    })

    it('should throw error for duplicate tag name', async () => {
      const tagData = {
        name: 'duplicate-tag',
        description: 'A test tag',
      }

      await createTag(tagData, mockUser)

      await expect(createTag(tagData, mockUser)).rejects.toThrow('already exists')
    })
  })

  describe('findTagById', () => {
    it('should find tag by ID', async () => {
      const tagData = {
        name: 'find-tag',
        description: 'A findable tag',
      }

      const createdTag = await createTag(tagData, mockUser)
      const foundTag = await findTagById(createdTag.id, mockUser)

      expect(foundTag).toMatchObject({
        id: createdTag.id,
        name: 'find-tag',
        description: 'A findable tag',
      })
    })

    it('should throw error for non-existent tag', async () => {
      await expect(findTagById('non-existent-id', mockUser)).rejects.toThrow('not found')
    })
  })

  describe('listTags', () => {
    it('should list tags with pagination', async () => {
      await createTag({ name: 'tag1' }, mockUser)
      await createTag({ name: 'tag2' }, mockUser)

      const result = await listTags({ page: 1, limit: 10 }, mockUser)

      expect(result.data).toHaveLength(2)
      expect(result.pagination).toMatchObject({
        page: 1,
        limit: 10,
        total: 2,
        totalPages: 1,
      })
    })
  })

  describe('getTagStats', () => {
    it('should return tag statistics', async () => {
      await createTag({ name: 'public-tag', visibility: 'PUBLIC' }, mockUser)
      await createTag({ name: 'private-tag', visibility: 'PRIVATE' }, mockUser)

      const stats = await getTagStats(mockUser)

      expect(stats).toMatchObject({
        totalTags: 2,
        publicTags: 1,
        privateTags: 1,
        orphanedTags: 0,
      })
    })
  })

  describe('updateTag', () => {
    it('should update tag successfully', async () => {
      const tagData = {
        name: 'original-tag',
        description: 'Original description',
        visibility: 'PUBLIC' as const,
      }

      const createdTag = await createTag(tagData, mockUser)
      const updateData = {
        name: 'updated-tag',
        description: 'Updated description',
        visibility: 'PRIVATE' as const,
      }

      const updatedTag = await updateTag(createdTag.id, updateData, mockUser)

      expect(updatedTag).toMatchObject({
        id: createdTag.id,
        name: 'updated-tag',
        description: 'Updated description',
        visibility: 'PRIVATE',
        ownerId: mockUser.id,
      })
    })

    it('should throw error when updating to duplicate name', async () => {
      await createTag({ name: 'existing-tag' }, mockUser)
      const secondTag = await createTag({ name: 'second-tag' }, mockUser)

      await expect(updateTag(secondTag.id, { name: 'existing-tag' }, mockUser)).rejects.toThrow(
        'already exists',
      )
    })

    it('should allow updating same tag with same name', async () => {
      const tag = await createTag({ name: 'same-tag' }, mockUser)

      const updatedTag = await updateTag(
        tag.id,
        { name: 'same-tag', description: 'Updated' },
        mockUser,
      )

      expect(updatedTag.name).toBe('same-tag')
      expect(updatedTag.description).toBe('Updated')
    })

    it('should throw error for non-existent tag', async () => {
      await expect(updateTag('non-existent-id', { name: 'new-name' }, mockUser)).rejects.toThrow(
        'not found',
      )
    })
  })

  describe('deleteTag', () => {
    it('should delete tag successfully', async () => {
      const tag = await createTag({ name: 'delete-me' }, mockUser)

      await deleteTag(tag.id, mockUser)

      // Verify tag is deleted
      await expect(findTagById(tag.id, mockUser)).rejects.toThrow('not found')
    })

    it('should throw error for non-existent tag', async () => {
      await expect(deleteTag('non-existent-id', mockUser)).rejects.toThrow('not found')
    })
  })
})
