/**
 * Character schema tests
 * Unit tests for character input validation schemas
 */

import { describe, it, expect } from 'vitest'
import Ajv from 'ajv'
import addFormats from 'ajv-formats'
import {
  CreateCharacterSchema,
  UpdateCharacterSchema,
  ListCharactersQuerySchema,
  CharacterParamSchema,
} from '../character.schema'

// Setup AJV with format validation
const ajv = new Ajv({ allErrors: true })
addFormats(ajv)

describe('Character Schema Validation', () => {
  describe('CreateCharacterSchema', () => {
    const validate = ajv.compile(CreateCharacterSchema)

    it('should validate valid character creation data', () => {
      const validData = {
        name: 'Test Character',
        sex: 'MALE',
        age: 25,
        description: 'A brave warrior',
        level: 1,
        experience: 0,
        strength: 10,
        constitution: 10,
        dexterity: 10,
        intelligence: 10,
        wisdom: 10,
        charisma: 10,
        raceId: '550e8400-e29b-41d4-a716-446655440000',
        archetypeId: '550e8400-e29b-41d4-a716-446655440001',
        visibility: 'PUBLIC',
      }

      const isValid = validate(validData)
      expect(isValid).toBe(true)
      expect(validate.errors).toBeNull()
    })

    it('should require name field', () => {
      const invalidData = {
        sex: 'MALE',
        age: 25,
        raceId: '550e8400-e29b-41d4-a716-446655440000',
        archetypeId: '550e8400-e29b-41d4-a716-446655440001',
      }

      const isValid = validate(invalidData)
      expect(isValid).toBe(false)
      expect(validate.errors).toBeDefined()
      const nameError = validate.errors?.find(
        error => error.keyword === 'required' && error.params?.missingProperty === 'name',
      )
      expect(nameError?.keyword).toBe('required')
    })

    it('should enforce minimum name length', () => {
      const invalidData = {
        name: 'A', // Too short
        sex: 'MALE',
        age: 25,
        raceId: '550e8400-e29b-41d4-a716-446655440000',
        archetypeId: '550e8400-e29b-41d4-a716-446655440001',
      }

      const isValid = validate(invalidData)
      expect(isValid).toBe(false)
      expect(validate.errors).toBeDefined()
      const nameError = validate.errors?.find(error => error.instancePath === '/name')
      expect(nameError?.keyword).toBe('minLength')
    })

    it('should enforce maximum name length', () => {
      const invalidData = {
        name: 'A'.repeat(101), // Too long
        sex: 'MALE',
        age: 25,
        raceId: '550e8400-e29b-41d4-a716-446655440000',
        archetypeId: '550e8400-e29b-41d4-a716-446655440001',
      }

      const isValid = validate(invalidData)
      expect(isValid).toBe(false)
      expect(validate.errors).toBeDefined()
      const nameError = validate.errors?.find(error => error.instancePath === '/name')
      expect(nameError?.keyword).toBe('maxLength')
    })

    it('should validate sex enum values', () => {
      const invalidData = {
        name: 'Test Character',
        sex: 'INVALID_SEX',
        age: 25,
        raceId: '550e8400-e29b-41d4-a716-446655440000',
        archetypeId: '550e8400-e29b-41d4-a716-446655440001',
      }

      const isValid = validate(invalidData)
      expect(isValid).toBe(false)
      expect(validate.errors).toBeDefined()
      const sexError = validate.errors?.find(error => error.instancePath === '/sex')
      expect(sexError?.keyword).toBe('enum')
    })

    it('should enforce age minimum constraint', () => {
      const invalidData = {
        name: 'Test Character',
        sex: 'MALE',
        age: 15, // Too young
        raceId: '550e8400-e29b-41d4-a716-446655440000',
        archetypeId: '550e8400-e29b-41d4-a716-446655440001',
      }

      const isValid = validate(invalidData)
      expect(isValid).toBe(false)
      expect(validate.errors).toBeDefined()
      const ageError = validate.errors?.find(error => error.instancePath === '/age')
      expect(ageError?.keyword).toBe('minimum')
    })

    it('should enforce age maximum constraint', () => {
      const invalidData = {
        name: 'Test Character',
        sex: 'MALE',
        age: 1001, // Too old
        raceId: '550e8400-e29b-41d4-a716-446655440000',
        archetypeId: '550e8400-e29b-41d4-a716-446655440001',
      }

      const isValid = validate(invalidData)
      expect(isValid).toBe(false)
      expect(validate.errors).toBeDefined()
      const ageError = validate.errors?.find(error => error.instancePath === '/age')
      expect(ageError?.keyword).toBe('maximum')
    })

    it('should enforce level constraints', () => {
      const invalidData = {
        name: 'Test Character',
        sex: 'MALE',
        age: 25,
        level: 0, // Too low
        raceId: '550e8400-e29b-41d4-a716-446655440000',
        archetypeId: '550e8400-e29b-41d4-a716-446655440001',
      }

      const isValid = validate(invalidData)
      expect(isValid).toBe(false)
      expect(validate.errors).toBeDefined()
      const levelError = validate.errors?.find(error => error.instancePath === '/level')
      expect(levelError?.keyword).toBe('minimum')
    })

    it('should enforce attribute constraints', () => {
      const invalidData = {
        name: 'Test Character',
        sex: 'MALE',
        age: 25,
        strength: 31, // Too high
        raceId: '550e8400-e29b-41d4-a716-446655440000',
        archetypeId: '550e8400-e29b-41d4-a716-446655440001',
      }

      const isValid = validate(invalidData)
      expect(isValid).toBe(false)
      expect(validate.errors).toBeDefined()
      const strengthError = validate.errors?.find(error => error.instancePath === '/strength')
      expect(strengthError?.keyword).toBe('maximum')
    })

    it('should validate UUID format for raceId', () => {
      const invalidData = {
        name: 'Test Character',
        sex: 'MALE',
        age: 25,
        raceId: 'invalid-uuid',
        archetypeId: '550e8400-e29b-41d4-a716-446655440001',
      }

      const isValid = validate(invalidData)
      expect(isValid).toBe(false)
      expect(validate.errors).toBeDefined()
      const raceIdError = validate.errors?.find(error => error.instancePath === '/raceId')
      expect(raceIdError?.keyword).toBe('format')
    })

    it('should validate UUID format for archetypeId', () => {
      const invalidData = {
        name: 'Test Character',
        sex: 'MALE',
        age: 25,
        raceId: '550e8400-e29b-41d4-a716-446655440000',
        archetypeId: 'invalid-uuid',
      }

      const isValid = validate(invalidData)
      expect(isValid).toBe(false)
      expect(validate.errors).toBeDefined()
      const archetypeIdError = validate.errors?.find(error => error.instancePath === '/archetypeId')
      expect(archetypeIdError?.keyword).toBe('format')
    })

    it('should validate visibility enum values', () => {
      const invalidData = {
        name: 'Test Character',
        sex: 'MALE',
        age: 25,
        raceId: '550e8400-e29b-41d4-a716-446655440000',
        archetypeId: '550e8400-e29b-41d4-a716-446655440001',
        visibility: 'INVALID_VISIBILITY',
      }

      const isValid = validate(invalidData)
      expect(isValid).toBe(false)
      expect(validate.errors).toBeDefined()
      const visibilityError = validate.errors?.find(error => error.instancePath === '/visibility')
      expect(visibilityError?.keyword).toBe('enum')
    })

    it('should accept skill and perk ID arrays', () => {
      const validData = {
        name: 'Test Character',
        sex: 'MALE',
        age: 25,
        raceId: '550e8400-e29b-41d4-a716-446655440000',
        archetypeId: '550e8400-e29b-41d4-a716-446655440001',
        skillIds: ['550e8400-e29b-41d4-a716-446655440002'],
        perkIds: ['550e8400-e29b-41d4-a716-446655440003'],
        tagIds: ['550e8400-e29b-41d4-a716-446655440004'],
      }

      const isValid = validate(validData)
      expect(isValid).toBe(true)
      expect(validate.errors).toBeNull()
    })
  })

  describe('UpdateCharacterSchema', () => {
    const validate = ajv.compile(UpdateCharacterSchema)

    it('should validate partial update data', () => {
      const validData = {
        name: 'Updated Character',
        age: 30,
        level: 5,
      }

      const isValid = validate(validData)
      expect(isValid).toBe(true)
      expect(validate.errors).toBeNull()
    })

    it('should validate empty update data', () => {
      const validData = {}

      const isValid = validate(validData)
      expect(isValid).toBe(true)
      expect(validate.errors).toBeNull()
    })

    it('should enforce name length constraints when present', () => {
      const invalidData = {
        name: 'A', // Too short
      }

      const isValid = validate(invalidData)
      expect(isValid).toBe(false)
      expect(validate.errors).toBeDefined()
      const nameError = validate.errors?.find(error => error.instancePath === '/name')
      expect(nameError?.keyword).toBe('minLength')
    })

    it('should enforce age constraints when present', () => {
      const invalidData = {
        age: 15, // Too young
      }

      const isValid = validate(invalidData)
      expect(isValid).toBe(false)
      expect(validate.errors).toBeDefined()
      const ageError = validate.errors?.find(error => error.instancePath === '/age')
      expect(ageError?.keyword).toBe('minimum')
    })

    it('should validate sex enum when present', () => {
      const invalidData = {
        sex: 'INVALID_SEX',
      }

      const isValid = validate(invalidData)
      expect(isValid).toBe(false)
      expect(validate.errors).toBeDefined()
      const sexError = validate.errors?.find(error => error.instancePath === '/sex')
      expect(sexError?.keyword).toBe('enum')
    })

    it('should validate visibility enum when present', () => {
      const invalidData = {
        visibility: 'INVALID_VISIBILITY',
      }

      const isValid = validate(invalidData)
      expect(isValid).toBe(false)
      expect(validate.errors).toBeDefined()
      const visibilityError = validate.errors?.find(error => error.instancePath === '/visibility')
      expect(visibilityError?.keyword).toBe('enum')
    })

    it('should validate UUID arrays for skills and perks', () => {
      const invalidData = {
        skillIds: ['invalid-uuid'],
        perkIds: ['550e8400-e29b-41d4-a716-446655440003'],
      }

      const isValid = validate(invalidData)
      expect(isValid).toBe(false)
      expect(validate.errors).toBeDefined()
      const skillError = validate.errors?.find(error => error.instancePath.includes('/skillIds'))
      expect(skillError?.keyword).toBe('format')
    })
  })

  describe('ListCharactersQuerySchema', () => {
    const validate = ajv.compile(ListCharactersQuerySchema)

    it('should validate valid query parameters', () => {
      const validData = {
        page: '1',
        limit: '20',
        search: 'warrior',
        raceId: '550e8400-e29b-41d4-a716-446655440000',
        archetypeId: '550e8400-e29b-41d4-a716-446655440001',
        minLevel: '5',
        maxLevel: '10',
        sex: 'MALE',
        visibility: 'PUBLIC',
        ownerId: '550e8400-e29b-41d4-a716-446655440002',
        includeRelations: 'true',
      }

      const isValid = validate(validData)
      expect(isValid).toBe(true)
      expect(validate.errors).toBeNull()
    })

    it('should validate empty query parameters', () => {
      const validData = {}

      const isValid = validate(validData)
      expect(isValid).toBe(true)
      expect(validate.errors).toBeNull()
    })

    it('should validate sex enum in query', () => {
      const invalidData = {
        sex: 'INVALID_SEX',
      }

      const isValid = validate(invalidData)
      expect(isValid).toBe(false)
      expect(validate.errors).toBeDefined()
      const sexError = validate.errors?.find(error => error.instancePath === '/sex')
      expect(sexError?.keyword).toBe('enum')
    })

    it('should validate visibility enum in query', () => {
      const invalidData = {
        visibility: 'INVALID_VISIBILITY',
      }

      const isValid = validate(invalidData)
      expect(isValid).toBe(false)
      expect(validate.errors).toBeDefined()
      const visibilityError = validate.errors?.find(error => error.instancePath === '/visibility')
      expect(visibilityError?.keyword).toBe('enum')
    })

    it('should validate UUID format for filter IDs', () => {
      const invalidData = {
        raceId: 'invalid-uuid',
      }

      const isValid = validate(invalidData)
      expect(isValid).toBe(false)
      expect(validate.errors).toBeDefined()
      const raceIdError = validate.errors?.find(error => error.instancePath === '/raceId')
      expect(raceIdError?.keyword).toBe('format')
    })

    it('should validate includeRelations boolean string', () => {
      const invalidData = {
        includeRelations: 'invalid-boolean',
      }

      const isValid = validate(invalidData)
      expect(isValid).toBe(false)
      expect(validate.errors).toBeDefined()
      const includeRelationsError = validate.errors?.find(
        error => error.instancePath === '/includeRelations',
      )
      expect(includeRelationsError?.keyword).toBe('enum')
    })

    it('should validate page number string format', () => {
      const invalidData = {
        page: 'not-a-number',
      }

      const isValid = validate(invalidData)
      expect(isValid).toBe(false)
      expect(validate.errors).toBeDefined()
      const pageError = validate.errors?.find(error => error.instancePath === '/page')
      expect(pageError?.keyword).toBe('pattern')
    })

    it('should validate limit number string format', () => {
      const invalidData = {
        limit: 'not-a-number',
      }

      const isValid = validate(invalidData)
      expect(isValid).toBe(false)
      expect(validate.errors).toBeDefined()
      const limitError = validate.errors?.find(error => error.instancePath === '/limit')
      expect(limitError?.keyword).toBe('pattern')
    })
  })

  describe('CharacterParamSchema', () => {
    const validate = ajv.compile(CharacterParamSchema)

    it('should validate valid UUID parameter', () => {
      const validData = {
        id: '550e8400-e29b-41d4-a716-446655440000',
      }

      const isValid = validate(validData)
      expect(isValid).toBe(true)
      expect(validate.errors).toBeNull()
    })

    it('should require id parameter', () => {
      const invalidData = {}

      const isValid = validate(invalidData)
      expect(isValid).toBe(false)
      expect(validate.errors).toBeDefined()
      const idError = validate.errors?.find(
        error => error.keyword === 'required' && error.params?.missingProperty === 'id',
      )
      expect(idError?.keyword).toBe('required')
    })

    it('should validate UUID format for id parameter', () => {
      const invalidData = {
        id: 'invalid-uuid',
      }

      const isValid = validate(invalidData)
      expect(isValid).toBe(false)
      expect(validate.errors).toBeDefined()
      const idError = validate.errors?.find(error => error.instancePath === '/id')
      expect(idError?.keyword).toBe('format')
    })

    it('should reject empty string for id parameter', () => {
      const invalidData = {
        id: '',
      }

      const isValid = validate(invalidData)
      expect(isValid).toBe(false)
      expect(validate.errors).toBeDefined()
      const idError = validate.errors?.find(error => error.instancePath === '/id')
      expect(idError?.keyword).toBe('format')
    })
  })

  describe('Schema Edge Cases', () => {
    it('should handle numeric strings in create schema', () => {
      const validate = ajv.compile(CreateCharacterSchema)
      const dataWithNumericStrings = {
        name: 'Test Character',
        sex: 'MALE',
        age: '25', // String instead of number
        level: '1', // String instead of number
        strength: '10', // String instead of number
        raceId: '550e8400-e29b-41d4-a716-446655440000',
        archetypeId: '550e8400-e29b-41d4-a716-446655440001',
      }

      const isValid = validate(dataWithNumericStrings)
      // Should fail because age/level/strength are expected as numbers, not strings
      expect(isValid).toBe(false)
    })

    it('should handle very long description strings', () => {
      const validate = ajv.compile(CreateCharacterSchema)
      const dataWithLongDescription = {
        name: 'Test Character',
        sex: 'MALE',
        age: 25,
        description: 'A'.repeat(1001), // Very long description
        raceId: '550e8400-e29b-41d4-a716-446655440000',
        archetypeId: '550e8400-e29b-41d4-a716-446655440001',
      }

      const isValid = validate(dataWithLongDescription)
      expect(isValid).toBe(false)
      const descriptionError = validate.errors?.find(error => error.instancePath === '/description')
      expect(descriptionError?.keyword).toBe('maxLength')
    })

    it('should handle null values in update schema', () => {
      const validate = ajv.compile(UpdateCharacterSchema)
      const dataWithNulls = {
        name: null,
        description: null,
      }

      const isValid = validate(dataWithNulls)
      // Should fail because null is not allowed for string fields
      expect(isValid).toBe(false)
    })
  })
})
