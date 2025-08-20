/**
 * Constants tests
 * Tests for application constants and their structure
 */

import { describe, it, expect } from 'vitest'
import {
  HTTP_STATUS,
  MESSAGES,
  VALIDATION,
  PAGINATION,
  RATE_LIMIT,
  CONTENT_TYPES,
  IMAGE,
  DATABASE,
  SECURITY,
  CACHE,
  ENVIRONMENTS,
  USER_ROLES,
  ITEM_RARITY,
  EQUIPMENT_SLOTS,
  CHARACTER_DEFAULTS,
  API_VERSIONS,
  LOG_LEVELS,
} from '@/shared/constants'

describe('Application Constants', () => {
  describe('HTTP_STATUS', () => {
    it('should have all standard HTTP status codes', () => {
      expect(HTTP_STATUS.OK).toBe(200)
      expect(HTTP_STATUS.CREATED).toBe(201)
      expect(HTTP_STATUS.NO_CONTENT).toBe(204)
      expect(HTTP_STATUS.BAD_REQUEST).toBe(400)
      expect(HTTP_STATUS.UNAUTHORIZED).toBe(401)
      expect(HTTP_STATUS.FORBIDDEN).toBe(403)
      expect(HTTP_STATUS.NOT_FOUND).toBe(404)
      expect(HTTP_STATUS.CONFLICT).toBe(409)
      expect(HTTP_STATUS.TOO_MANY_REQUESTS).toBe(429)
      expect(HTTP_STATUS.INTERNAL_SERVER_ERROR).toBe(500)
    })
  })

  describe('MESSAGES', () => {
    it('should have all standard API messages', () => {
      expect(MESSAGES.SUCCESS).toBe('Operation completed successfully')
      expect(MESSAGES.CREATED).toBe('Resource created successfully')
      expect(MESSAGES.UPDATED).toBe('Resource updated successfully')
      expect(MESSAGES.DELETED).toBe('Resource deleted successfully')
      expect(MESSAGES.NOT_FOUND).toBe('Resource not found')
      expect(MESSAGES.UNAUTHORIZED).toBe('Authentication required')
      expect(MESSAGES.FORBIDDEN).toBe('Access denied')
      expect(MESSAGES.VALIDATION_ERROR).toBe('Validation failed')
      expect(MESSAGES.INTERNAL_ERROR).toBe('Internal server error')
      expect(MESSAGES.TOO_MANY_REQUESTS).toBe('Too many requests')
    })
  })

  describe('VALIDATION', () => {
    it('should have valid regex patterns', () => {
      expect(VALIDATION.EMAIL_REGEX).toBeInstanceOf(RegExp)
      expect(VALIDATION.UUID_REGEX).toBeInstanceOf(RegExp)
    })

    it('should have sensible length constraints', () => {
      expect(VALIDATION.PASSWORD_MIN_LENGTH).toBe(8)
      expect(VALIDATION.PASSWORD_MAX_LENGTH).toBe(128)
      expect(VALIDATION.NAME_MIN_LENGTH).toBe(2)
      expect(VALIDATION.NAME_MAX_LENGTH).toBe(100)
      expect(VALIDATION.DESCRIPTION_MAX_LENGTH).toBe(1000)
    })

    it('should validate email addresses correctly', () => {
      expect(VALIDATION.EMAIL_REGEX.test('test@example.com')).toBe(true)
      expect(VALIDATION.EMAIL_REGEX.test('invalid-email')).toBe(false)
    })

    it('should validate UUIDs correctly', () => {
      expect(VALIDATION.UUID_REGEX.test('123e4567-e89b-12d3-a456-426614174000')).toBe(true)
      expect(VALIDATION.UUID_REGEX.test('invalid-uuid')).toBe(false)
    })
  })

  describe('PAGINATION', () => {
    it('should have reasonable pagination defaults', () => {
      expect(PAGINATION.DEFAULT_PAGE).toBe(1)
      expect(PAGINATION.DEFAULT_LIMIT).toBe(10)
      expect(PAGINATION.MAX_LIMIT).toBe(100)
      expect(PAGINATION.MIN_LIMIT).toBe(1)
    })

    it('should have logical relationships between limits', () => {
      expect(PAGINATION.MIN_LIMIT).toBeLessThan(PAGINATION.DEFAULT_LIMIT)
      expect(PAGINATION.DEFAULT_LIMIT).toBeLessThan(PAGINATION.MAX_LIMIT)
    })
  })

  describe('RATE_LIMIT', () => {
    it('should have reasonable rate limiting defaults', () => {
      expect(RATE_LIMIT.DEFAULT_MAX).toBe(100)
      expect(RATE_LIMIT.DEFAULT_TIMEWINDOW).toBe(60000) // 1 minute
      expect(RATE_LIMIT.AUTH_MAX).toBe(5)
      expect(RATE_LIMIT.AUTH_TIMEWINDOW).toBe(900000) // 15 minutes
    })

    it('should have stricter auth limits', () => {
      expect(RATE_LIMIT.AUTH_MAX).toBeLessThan(RATE_LIMIT.DEFAULT_MAX)
      expect(RATE_LIMIT.AUTH_TIMEWINDOW).toBeGreaterThan(RATE_LIMIT.DEFAULT_TIMEWINDOW)
    })
  })

  describe('CONTENT_TYPES', () => {
    it('should have all necessary content types', () => {
      expect(CONTENT_TYPES.JSON).toBe('application/json')
      expect(CONTENT_TYPES.FORM_DATA).toBe('multipart/form-data')
      expect(CONTENT_TYPES.TEXT).toBe('text/plain')
      expect(CONTENT_TYPES.HTML).toBe('text/html')
      expect(CONTENT_TYPES.IMAGE_WEBP).toBe('image/webp')
      expect(CONTENT_TYPES.IMAGE_JPEG).toBe('image/jpeg')
      expect(CONTENT_TYPES.IMAGE_PNG).toBe('image/png')
    })
  })

  describe('IMAGE', () => {
    it('should have reasonable image constraints', () => {
      expect(IMAGE.MAX_WIDTH).toBe(350)
      expect(IMAGE.MAX_HEIGHT).toBe(450)
      expect(IMAGE.MAX_SIZE).toBe(5 * 1024 * 1024) // 5MB
      expect(IMAGE.OUTPUT_FORMAT).toBe('webp')
      expect(IMAGE.QUALITY).toBe(85)
    })

    it('should have valid allowed types', () => {
      expect(Array.isArray(IMAGE.ALLOWED_TYPES)).toBe(true)
      expect(IMAGE.ALLOWED_TYPES).toContain('image/jpeg')
      expect(IMAGE.ALLOWED_TYPES).toContain('image/png')
      expect(IMAGE.ALLOWED_TYPES).toContain('image/webp')
    })
  })

  describe('DATABASE', () => {
    it('should have reasonable timeout values', () => {
      expect(DATABASE.TRANSACTION_TIMEOUT).toBe(30000) // 30 seconds
      expect(DATABASE.CONNECTION_TIMEOUT).toBe(10000) // 10 seconds
    })
  })

  describe('SECURITY', () => {
    it('should have secure default values', () => {
      expect(SECURITY.BCRYPT_ROUNDS).toBe(12)
      expect(SECURITY.JWT_ALGORITHM).toBe('HS256')
      expect(SECURITY.SESSION_MAX_AGE).toBe(24 * 60 * 60 * 1000) // 24 hours
    })
  })

  describe('CACHE', () => {
    it('should have reasonable cache TTL values', () => {
      expect(CACHE.DEFAULT_TTL).toBe(300) // 5 minutes
      expect(CACHE.SHORT_TTL).toBe(60) // 1 minute
      expect(CACHE.LONG_TTL).toBe(3600) // 1 hour
    })

    it('should have logical TTL relationships', () => {
      expect(CACHE.SHORT_TTL).toBeLessThan(CACHE.DEFAULT_TTL)
      expect(CACHE.DEFAULT_TTL).toBeLessThan(CACHE.LONG_TTL)
    })
  })

  describe('ENVIRONMENTS', () => {
    it('should have all environment types', () => {
      expect(ENVIRONMENTS.DEVELOPMENT).toBe('development')
      expect(ENVIRONMENTS.PRODUCTION).toBe('production')
      expect(ENVIRONMENTS.TEST).toBe('test')
    })
  })

  describe('USER_ROLES', () => {
    it('should have all user roles', () => {
      expect(USER_ROLES.USER).toBe('USER')
      expect(USER_ROLES.ADMIN).toBe('ADMIN')
      expect(USER_ROLES.MODERATOR).toBe('MODERATOR')
    })
  })

  describe('ITEM_RARITY', () => {
    it('should have all rarity levels', () => {
      expect(ITEM_RARITY.COMMON).toBe('common')
      expect(ITEM_RARITY.UNCOMMON).toBe('uncommon')
      expect(ITEM_RARITY.RARE).toBe('rare')
      expect(ITEM_RARITY.EPIC).toBe('epic')
      expect(ITEM_RARITY.LEGENDARY).toBe('legendary')
    })
  })

  describe('EQUIPMENT_SLOTS', () => {
    it('should have all equipment slots', () => {
      expect(EQUIPMENT_SLOTS.NONE).toBe('none')
      expect(EQUIPMENT_SLOTS.HEAD).toBe('head')
      expect(EQUIPMENT_SLOTS.CHEST).toBe('chest')
      expect(EQUIPMENT_SLOTS.LEGS).toBe('legs')
      expect(EQUIPMENT_SLOTS.FEET).toBe('feet')
      expect(EQUIPMENT_SLOTS.HANDS).toBe('hands')
      expect(EQUIPMENT_SLOTS.MAIN_HAND).toBe('main_hand')
      expect(EQUIPMENT_SLOTS.OFF_HAND).toBe('off_hand')
      expect(EQUIPMENT_SLOTS.RING).toBe('ring')
      expect(EQUIPMENT_SLOTS.AMULET).toBe('amulet')
      expect(EQUIPMENT_SLOTS.BELT).toBe('belt')
      expect(EQUIPMENT_SLOTS.BACK).toBe('back')
    })
  })

  describe('CHARACTER_DEFAULTS', () => {
    it('should have reasonable default values', () => {
      expect(CHARACTER_DEFAULTS.LEVEL).toBe(1)
      expect(CHARACTER_DEFAULTS.EXPERIENCE).toBe(0)
      expect(CHARACTER_DEFAULTS.HEALTH).toBe(100)
      expect(CHARACTER_DEFAULTS.MANA).toBe(100)
      expect(CHARACTER_DEFAULTS.STAMINA).toBe(100)
      expect(CHARACTER_DEFAULTS.STRENGTH).toBe(10)
      expect(CHARACTER_DEFAULTS.CONSTITUTION).toBe(10)
      expect(CHARACTER_DEFAULTS.DEXTERITY).toBe(10)
      expect(CHARACTER_DEFAULTS.INTELLIGENCE).toBe(10)
      expect(CHARACTER_DEFAULTS.WISDOM).toBe(10)
      expect(CHARACTER_DEFAULTS.CHARISMA).toBe(10)
    })

    it('should have positive values', () => {
      Object.values(CHARACTER_DEFAULTS).forEach(value => {
        expect(value).toBeGreaterThanOrEqual(0)
      })
    })
  })

  describe('API_VERSIONS', () => {
    it('should have version definitions', () => {
      expect(API_VERSIONS.V1).toBe('v1')
    })
  })

  describe('LOG_LEVELS', () => {
    it('should have all log levels', () => {
      expect(LOG_LEVELS.FATAL).toBe('fatal')
      expect(LOG_LEVELS.ERROR).toBe('error')
      expect(LOG_LEVELS.WARN).toBe('warn')
      expect(LOG_LEVELS.INFO).toBe('info')
      expect(LOG_LEVELS.DEBUG).toBe('debug')
      expect(LOG_LEVELS.TRACE).toBe('trace')
    })
  })

  describe('Constant immutability', () => {
    it('should be frozen objects', () => {
      expect(Object.isFrozen(HTTP_STATUS)).toBe(true)
      expect(Object.isFrozen(MESSAGES)).toBe(true)
      expect(Object.isFrozen(VALIDATION)).toBe(true)
      expect(Object.isFrozen(PAGINATION)).toBe(true)
    })
  })
})
