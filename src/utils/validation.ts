/**
 * Validation Utilities for Fantasy Character API
 *
 * This module provides common validation schemas and utilities
 * using TypeBox for runtime validation.
 */

import { Type, Static } from '@sinclair/typebox'

/**
 * Common validation schemas
 */

// UUID Schema
export const UuidSchema = Type.String({
    pattern: '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$',
    description: 'UUID format'
})

// Email Schema
export const EmailSchema = Type.String({
    format: 'email',
    description: 'Valid email address'
})

// Password Schema (for API input, not storage)
export const PasswordSchema = Type.String({
    minLength: 8,
    maxLength: 128,
    description: 'Password must be between 8 and 128 characters'
})

// Date Schema
export const DateSchema = Type.String({
    format: 'date-time',
    description: 'ISO 8601 date-time format'
})

// Pagination Query Schema
export const PaginationQuerySchema = Type.Object({
    page: Type.Optional(Type.Number({ minimum: 1, default: 1 })),
    limit: Type.Optional(Type.Number({ minimum: 1, maximum: 100, default: 10 }))
})

export type PaginationQuery = Static<typeof PaginationQuerySchema>

// Search Query Schema
export const SearchQuerySchema = Type.Object({
    q: Type.Optional(Type.String({ minLength: 1, maxLength: 100 })),
    type: Type.Optional(
        Type.Union([
            Type.Literal('all'),
            Type.Literal('characters'),
            Type.Literal('races'),
            Type.Literal('archetypes'),
            Type.Literal('skills'),
            Type.Literal('perks'),
            Type.Literal('items'),
            Type.Literal('tags')
        ])
    ),
    ...PaginationQuerySchema.properties
})

export type SearchQuery = Static<typeof SearchQuerySchema>

// Common field validations
export const NameSchema = Type.String({
    minLength: 1,
    maxLength: 100,
    pattern: "^[a-zA-Z0-9\\s\\-\\.\\']+$",
    description: 'Name must be 1-100 characters, alphanumeric with spaces, hyphens, dots, and apostrophes'
})

export const DescriptionSchema = Type.Optional(
    Type.String({
        maxLength: 1000,
        description: 'Description must be maximum 1000 characters'
    })
)

// Level Schema (for skills, perks, characters)
export const LevelSchema = Type.Number({
    minimum: 1,
    maximum: 100,
    description: 'Level must be between 1 and 100'
})

// Attribute value schema (for character stats)
export const AttributeValueSchema = Type.Number({
    minimum: 1,
    maximum: 100,
    description: 'Attribute value must be between 1 and 100'
})

// Modifier schema (for race modifiers)
export const ModifierSchema = Type.Number({
    minimum: -50,
    maximum: 200,
    description: 'Modifier value must be between -50 and 200'
})

// Health/Mana/Stamina schema
export const ResourceValueSchema = Type.Number({
    minimum: 1,
    maximum: 1000,
    description: 'Resource value must be between 1 and 1000'
})

// File upload schemas
export const ImageUploadSchema = Type.Object({
    filename: Type.String(),
    mimetype: Type.String({ pattern: '^image\\/(jpeg|jpg|png|gif|webp)$' }),
    size: Type.Number({ maximum: 5 * 1024 * 1024 }) // 5MB max
})

// Common response schemas for entities
export const IdParamSchema = Type.Object({
    id: UuidSchema
})

export type IdParam = Static<typeof IdParamSchema>

/**
 * Validation helper functions
 */

/**
 * Validates that a string is not empty after trimming
 */
export function validateNonEmptyString(value: string): boolean {
    return typeof value === 'string' && value.trim().length > 0
}

/**
 * Validates UUID format
 */
export function validateUuid(value: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    return uuidRegex.test(value)
}

/**
 * Validates email format (basic)
 */
export function validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
}

/**
 * Sanitizes string input by trimming and limiting length
 */
export function sanitizeString(input: string, maxLength = 1000): string {
    return input.trim().substring(0, maxLength)
}

/**
 * Validates and sanitizes pagination parameters
 */
export function validateAndSanitizePagination(page?: unknown, limit?: unknown) {
    const pageNum = typeof page === 'number' ? page : typeof page === 'string' ? parseInt(page, 10) : 1
    const limitNum = typeof limit === 'number' ? limit : typeof limit === 'string' ? parseInt(limit, 10) : 10

    return {
        page: Math.max(1, Math.min(1000, pageNum || 1)),
        limit: Math.max(1, Math.min(100, limitNum || 10))
    }
}

/**
 * Validates that a value is within a numeric range
 */
export function validateRange(value: number, min: number, max: number): boolean {
    return typeof value === 'number' && value >= min && value <= max
}
