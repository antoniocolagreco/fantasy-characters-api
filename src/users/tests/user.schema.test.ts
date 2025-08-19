/**
 * User schema tests
 * Unit tests for user validation schemas
 */

import { describe, it, expect } from 'vitest'
import Ajv from 'ajv'
import addFormats from 'ajv-formats'
import {
  CreateUserRequestSchema,
  UpdateUserRequestSchema,
  UserResponseSchema,
  UserListQuerySchema,
  UserIdParamSchema,
} from '@/users/user.schema.js'

// Setup AJV for schema validation
const ajv = new Ajv({ strict: false })
addFormats(ajv) // Add format validation support

describe('User Schemas', () => {
  describe('CreateUserRequestSchema', () => {
    const validate = ajv.compile(CreateUserRequestSchema)

    it('should validate correct user creation data', () => {
      const validData = {
        email: 'test@example.com',
        passwordHash: 'securepassword123',
        name: 'Test User',
        bio: 'This is a test bio',
        role: 'USER',
      }

      const isValid = validate(validData)
      expect(isValid).toBe(true)
      expect(validate.errors).toBeNull()
    })

    it('should validate minimal user creation data', () => {
      const validData = {
        email: 'test@example.com',
        passwordHash: 'securepassword123',
      }

      const isValid = validate(validData)
      expect(isValid).toBe(true)
    })

    it('should reject invalid email format', () => {
      const invalidData = {
        email: 'invalid-email',
        passwordHash: 'securepassword123',
      }

      const isValid = validate(invalidData)
      expect(isValid).toBe(false)
      expect(validate.errors).toBeDefined()
    })

    it('should reject missing required fields', () => {
      const invalidData = {
        email: 'test@example.com',
        // Missing passwordHash
      }

      const isValid = validate(invalidData)
      expect(isValid).toBe(false)
    })

    it('should reject too short password', () => {
      const invalidData = {
        email: 'test@example.com',
        passwordHash: 'short',
      }

      const isValid = validate(invalidData)
      expect(isValid).toBe(false)
    })

    it('should reject too long password', () => {
      const invalidData = {
        email: 'test@example.com',
        passwordHash: 'a'.repeat(129), // Too long
      }

      const isValid = validate(invalidData)
      expect(isValid).toBe(false)
    })

    it('should reject too short display name', () => {
      const invalidData = {
        email: 'test@example.com',
        passwordHash: 'securepassword123',
        name: 'a', // Too short
      }

      const isValid = validate(invalidData)
      expect(isValid).toBe(false)
    })

    it('should reject too long display name', () => {
      const invalidData = {
        email: 'test@example.com',
        passwordHash: 'securepassword123',
        name: 'a'.repeat(101), // Too long
      }

      const isValid = validate(invalidData)
      expect(isValid).toBe(false)
    })

    it('should reject too long bio', () => {
      const invalidData = {
        email: 'test@example.com',
        passwordHash: 'securepassword123',
        bio: 'a'.repeat(1001), // Too long
      }

      const isValid = validate(invalidData)
      expect(isValid).toBe(false)
    })

    it('should reject invalid role', () => {
      const invalidData = {
        email: 'test@example.com',
        passwordHash: 'securepassword123',
        role: 'INVALID_ROLE',
      }

      const isValid = validate(invalidData)
      expect(isValid).toBe(false)
    })

    it('should reject additional properties', () => {
      const invalidData = {
        email: 'test@example.com',
        passwordHash: 'securepassword123',
        extraField: 'not allowed',
      }

      const isValid = validate(invalidData)
      expect(isValid).toBe(false)
    })
  })

  describe('UpdateUserRequestSchema', () => {
    const validate = ajv.compile(UpdateUserRequestSchema)

    it('should validate correct update data', () => {
      const validData = {
        email: 'newemail@example.com',
        name: 'New Name',
        bio: 'New bio',
        role: 'ADMIN',
        isActive: false,
        isEmailVerified: true,
      }

      const isValid = validate(validData)
      expect(isValid).toBe(true)
    })

    it('should validate empty update data', () => {
      const validData = {}

      const isValid = validate(validData)
      expect(isValid).toBe(true)
    })

    it('should validate partial update data', () => {
      const validData = {
        name: 'Only Name Update',
      }

      const isValid = validate(validData)
      expect(isValid).toBe(true)
    })

    it('should reject invalid email format', () => {
      const invalidData = {
        email: 'invalid-email',
      }

      const isValid = validate(invalidData)
      expect(isValid).toBe(false)
    })

    it('should reject too short display name', () => {
      const invalidData = {
        name: 'a', // Too short
      }

      const isValid = validate(invalidData)
      expect(isValid).toBe(false)
    })

    it('should reject additional properties', () => {
      const invalidData = {
        name: 'Valid Name',
        extraField: 'not allowed',
      }

      const isValid = validate(invalidData)
      expect(isValid).toBe(false)
    })
  })

  describe('UserResponseSchema', () => {
    const validate = ajv.compile(UserResponseSchema)

    it('should validate correct user response data', () => {
      const validData = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'test@example.com',
        name: 'Test User',
        bio: 'Test bio',
        role: 'USER',
        isEmailVerified: true,
        isActive: true,
        profilePictureId: '123e4567-e89b-12d3-a456-426614174001',
        lastLogin: '2023-08-13T10:30:00.000Z',
        createdAt: '2023-08-13T10:30:00.000Z',
        updatedAt: '2023-08-13T10:30:00.000Z',
      }

      const isValid = validate(validData)
      expect(isValid).toBe(true)
    })

    it('should validate user response with null optional fields', () => {
      const validData = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'test@example.com',
        name: null,
        bio: null,
        role: 'USER',
        isEmailVerified: false,
        isActive: true,
        profilePictureId: null,
        lastLogin: '2023-08-13T10:30:00.000Z',
        createdAt: '2023-08-13T10:30:00.000Z',
        updatedAt: '2023-08-13T10:30:00.000Z',
      }

      const isValid = validate(validData)
      expect(isValid).toBe(true)
    })

    it('should reject invalid UUID format', () => {
      const invalidData = {
        id: 'invalid-uuid',
        email: 'test@example.com',
        name: 'Test User',
        bio: 'Test bio',
        role: 'USER',
        isEmailVerified: true,
        isActive: true,
        profilePictureId: null,
        lastLogin: '2023-08-13T10:30:00.000Z',
        createdAt: '2023-08-13T10:30:00.000Z',
        updatedAt: '2023-08-13T10:30:00.000Z',
      }

      const isValid = validate(invalidData)
      expect(isValid).toBe(false)
    })

    it('should reject missing required fields', () => {
      const invalidData = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        // Missing email and other required fields
      }

      const isValid = validate(invalidData)
      expect(isValid).toBe(false)
    })
  })

  describe('UserListQuerySchema', () => {
    const validate = ajv.compile(UserListQuerySchema)

    it('should validate correct query parameters', () => {
      const validData = {
        page: 1,
        pageSize: 10,
        sortBy: 'email',
        sortOrder: 'asc',
        role: 'USER',
        isActive: true,
        isEmailVerified: false,
        search: 'test',
      }

      const isValid = validate(validData)
      expect(isValid).toBe(true)
    })

    it('should validate empty query parameters', () => {
      const validData = {}

      const isValid = validate(validData)
      expect(isValid).toBe(true)
    })

    it('should validate partial query parameters', () => {
      const validData = {
        page: 2,
        role: 'ADMIN',
      }

      const isValid = validate(validData)
      expect(isValid).toBe(true)
    })

    it('should reject invalid page number', () => {
      const invalidData = {
        page: 0, // Must be >= 1
      }

      const isValid = validate(invalidData)
      expect(isValid).toBe(false)
    })

    it('should reject invalid page size', () => {
      const invalidData = {
        pageSize: 0, // Must be >= 1
      }

      const isValid = validate(invalidData)
      expect(isValid).toBe(false)
    })

    it('should reject invalid sort order', () => {
      const invalidData = {
        sortOrder: 'invalid',
      }

      const isValid = validate(invalidData)
      expect(isValid).toBe(false)
    })

    it('should reject invalid role', () => {
      const invalidData = {
        role: 'INVALID_ROLE',
      }

      const isValid = validate(invalidData)
      expect(isValid).toBe(false)
    })
  })

  describe('UserIdParamSchema', () => {
    const validate = ajv.compile(UserIdParamSchema)

    it('should validate correct UUID', () => {
      const validData = {
        id: '123e4567-e89b-12d3-a456-426614174000',
      }

      const isValid = validate(validData)
      expect(isValid).toBe(true)
    })

    it('should reject invalid UUID format', () => {
      const invalidData = {
        id: 'invalid-uuid',
      }

      const isValid = validate(invalidData)
      expect(isValid).toBe(false)
    })

    it('should reject missing id field', () => {
      const invalidData = {}

      const isValid = validate(invalidData)
      expect(isValid).toBe(false)
    })
  })
})
