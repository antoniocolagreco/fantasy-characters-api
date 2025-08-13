/**
 * Application constants and enums
 * Centralized place for all application constants
 */

// HTTP status codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
} as const

// API response messages
export const MESSAGES = {
  SUCCESS: 'Operation completed successfully',
  CREATED: 'Resource created successfully',
  UPDATED: 'Resource updated successfully',
  DELETED: 'Resource deleted successfully',
  NOT_FOUND: 'Resource not found',
  UNAUTHORIZED: 'Authentication required',
  FORBIDDEN: 'Access denied',
  VALIDATION_ERROR: 'Validation failed',
  INTERNAL_ERROR: 'Internal server error',
  TOO_MANY_REQUESTS: 'Too many requests',
} as const

// Validation constants
export const VALIDATION = {
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_MAX_LENGTH: 128,
  NAME_MIN_LENGTH: 2,
  NAME_MAX_LENGTH: 100,
  DESCRIPTION_MAX_LENGTH: 1000,
  UUID_REGEX: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
} as const

// Pagination constants
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
  MIN_LIMIT: 1,
} as const

// Rate limiting constants
export const RATE_LIMIT = {
  DEFAULT_MAX: 100,
  DEFAULT_TIMEWINDOW: 60000, // 1 minute
  AUTH_MAX: 5,
  AUTH_TIMEWINDOW: 900000, // 15 minutes
} as const

// Content types
export const CONTENT_TYPES = {
  JSON: 'application/json',
  FORM_DATA: 'multipart/form-data',
  TEXT: 'text/plain',
  HTML: 'text/html',
  IMAGE_WEBP: 'image/webp',
  IMAGE_JPEG: 'image/jpeg',
  IMAGE_PNG: 'image/png',
} as const

// Image processing constants
export const IMAGE = {
  MAX_WIDTH: 350,
  MAX_HEIGHT: 450,
  MAX_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
  OUTPUT_FORMAT: 'webp',
  QUALITY: 85,
} as const

// Database constants
export const DATABASE = {
  TRANSACTION_TIMEOUT: 30000, // 30 seconds
  CONNECTION_TIMEOUT: 10000, // 10 seconds
} as const

// Security constants
export const SECURITY = {
  BCRYPT_ROUNDS: 12,
  JWT_ALGORITHM: 'HS256',
  SESSION_MAX_AGE: 24 * 60 * 60 * 1000, // 24 hours
} as const

// Cache constants (for future use)
export const CACHE = {
  DEFAULT_TTL: 300, // 5 minutes
  SHORT_TTL: 60, // 1 minute
  LONG_TTL: 3600, // 1 hour
} as const

// Environment types
export const ENVIRONMENTS = {
  DEVELOPMENT: 'development',
  PRODUCTION: 'production',
  TEST: 'test',
} as const

// User roles (from database schema)
export const USER_ROLES = {
  USER: 'USER',
  ADMIN: 'ADMIN',
  MODERATOR: 'MODERATOR',
} as const

// Item rarity (from database schema)
export const ITEM_RARITY = {
  COMMON: 'common',
  UNCOMMON: 'uncommon',
  RARE: 'rare',
  EPIC: 'epic',
  LEGENDARY: 'legendary',
} as const

// Equipment slots (from database schema)
export const EQUIPMENT_SLOTS = {
  NONE: 'none',
  HEAD: 'head',
  CHEST: 'chest',
  LEGS: 'legs',
  FEET: 'feet',
  HANDS: 'hands',
  MAIN_HAND: 'main_hand',
  OFF_HAND: 'off_hand',
  RING: 'ring',
  AMULET: 'amulet',
  BELT: 'belt',
  BACK: 'back',
} as const

// Default character stats
export const CHARACTER_DEFAULTS = {
  LEVEL: 1,
  EXPERIENCE: 0,
  HEALTH: 100,
  MANA: 100,
  STAMINA: 100,
  STRENGTH: 10,
  CONSTITUTION: 10,
  DEXTERITY: 10,
  INTELLIGENCE: 10,
  WISDOM: 10,
  CHARISMA: 10,
} as const

// API versioning
export const API_VERSIONS = {
  V1: 'v1',
} as const

// Log levels
export const LOG_LEVELS = {
  FATAL: 'fatal',
  ERROR: 'error',
  WARN: 'warn',
  INFO: 'info',
  DEBUG: 'debug',
  TRACE: 'trace',
} as const

// Freeze all constant objects for immutability
Object.freeze(HTTP_STATUS)
Object.freeze(MESSAGES)
Object.freeze(VALIDATION)
Object.freeze(PAGINATION)
Object.freeze(RATE_LIMIT)
Object.freeze(CONTENT_TYPES)
Object.freeze(IMAGE)
Object.freeze(DATABASE)
Object.freeze(SECURITY)
Object.freeze(CACHE)
Object.freeze(ENVIRONMENTS)
Object.freeze(USER_ROLES)
Object.freeze(ITEM_RARITY)
Object.freeze(EQUIPMENT_SLOTS)
Object.freeze(CHARACTER_DEFAULTS)
Object.freeze(API_VERSIONS)
Object.freeze(LOG_LEVELS)
