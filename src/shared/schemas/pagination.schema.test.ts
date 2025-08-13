/**
 * Pagination schema tests
 * Tests for pagination-related schemas and types
 */

import { describe, it, expect } from 'vitest'
import { ListPaginationQuerySchema, type ListPagination } from './pagination.schema.js'

// Helper type for schema property access
type SchemaProperty = {
  type?: string
  format?: string
  minimum?: number
  maximum?: number
  const?: string
  items?: unknown
  properties?: Record<string, unknown>
  anyOf?: unknown[]
  enum?: string[]
  default?: unknown
  required?: string[]
  minLength?: number
  description?: string
}

describe('Pagination Schemas', () => {
  describe('ListPaginationQuerySchema', () => {
    it('should be a valid TypeBox schema', () => {
      expect(ListPaginationQuerySchema).toBeDefined()
      expect(ListPaginationQuerySchema.type).toBe('object')
      expect(ListPaginationQuerySchema.properties).toBeDefined()
    })

    it('should have all pagination properties', () => {
      const properties = ListPaginationQuerySchema.properties as Record<string, SchemaProperty>

      expect(properties.page).toBeDefined()
      expect(properties.pageSize).toBeDefined()
      expect(properties.sortBy).toBeDefined()
      expect(properties.sortOrder).toBeDefined()
    })

    it('should have correct property types', () => {
      const properties = ListPaginationQuerySchema.properties as Record<string, SchemaProperty>

      expect(properties.page.type).toBe('integer')
      expect(properties.pageSize.type).toBe('integer')
      expect(properties.sortBy.type).toBe('string')
    })

    it('should have proper constraints for page', () => {
      const properties = ListPaginationQuerySchema.properties as Record<string, SchemaProperty>
      const pageSchema = properties.page

      expect(pageSchema.minimum).toBe(1)
      expect(pageSchema.default).toBe(1)
    })

    it('should have proper constraints for pageSize', () => {
      const properties = ListPaginationQuerySchema.properties as Record<string, SchemaProperty>
      const pageSizeSchema = properties.pageSize

      expect(pageSizeSchema.minimum).toBe(1)
      expect(pageSizeSchema.maximum).toBe(100)
      expect(pageSizeSchema.default).toBe(10)
    })

    it('should have sortOrder as enum type', () => {
      const properties = ListPaginationQuerySchema.properties as Record<string, SchemaProperty>
      const sortOrderSchema = properties.sortOrder

      expect(sortOrderSchema.enum).toBeDefined()
      expect(sortOrderSchema.enum).toHaveLength(2)
      expect(sortOrderSchema.enum).toContain('asc')
      expect(sortOrderSchema.enum).toContain('desc')
    })

    it('should have sortBy with minimum length', () => {
      const properties = ListPaginationQuerySchema.properties as Record<string, SchemaProperty>
      const sortBySchema = properties.sortBy

      expect(sortBySchema.type).toBe('string')
      expect(sortBySchema.minLength).toBe(1)
    })

    it('should make all properties optional', () => {
      const required = ListPaginationQuerySchema.required || []

      expect(required).not.toContain('page')
      expect(required).not.toContain('pageSize')
      expect(required).not.toContain('sortBy')
      expect(required).not.toContain('sortOrder')
    })

    it('should not allow additional properties', () => {
      expect(ListPaginationQuerySchema.additionalProperties).toBe(false)
    })

    it('should have description', () => {
      expect(ListPaginationQuerySchema.description).toBeDefined()
      expect(typeof ListPaginationQuerySchema.description).toBe('string')
    })
  })

  describe('Schema validation behavior', () => {
    it('should validate acceptable page values', () => {
      const properties = ListPaginationQuerySchema.properties as Record<string, SchemaProperty>

      // Page should start from 1
      expect(properties.page.minimum).toBe(1)
    })

    it('should validate pageSize constraints', () => {
      const properties = ListPaginationQuerySchema.properties as Record<string, SchemaProperty>

      // Page size should be between 1 and 100
      expect(properties.pageSize.minimum).toBe(1)
      expect(properties.pageSize.maximum).toBe(100)
    })

    it('should validate sortOrder values', () => {
      const properties = ListPaginationQuerySchema.properties as Record<string, SchemaProperty>
      const sortOrderOptions = properties.sortOrder.enum

      expect(sortOrderOptions).toContain('asc')
      expect(sortOrderOptions).toContain('desc')
      expect(sortOrderOptions).toHaveLength(2)
    })
  })

  describe('TypeScript type integration', () => {
    it('should export proper TypeScript type', () => {
      // Test that ListPagination type is properly exported
      const validPagination: ListPagination = {
        page: 1,
        pageSize: 20,
        sortBy: 'name',
        sortOrder: 'asc',
      }

      expect(validPagination.page).toBe(1)
      expect(validPagination.pageSize).toBe(20)
      expect(validPagination.sortBy).toBe('name')
      expect(validPagination.sortOrder).toBe('asc')
    })

    it('should allow partial pagination objects', () => {
      // All properties are optional
      const partialPagination: ListPagination = {}
      expect(partialPagination).toBeDefined()

      const pageOnlyPagination: ListPagination = { page: 2 }
      expect(pageOnlyPagination.page).toBe(2)
    })
  })

  describe('Default values', () => {
    it('should have sensible defaults', () => {
      const properties = ListPaginationQuerySchema.properties as Record<string, SchemaProperty>

      expect(properties.page.default).toBe(1)
      expect(properties.pageSize.default).toBe(10)
    })

    it('should not have default for sortBy', () => {
      const properties = ListPaginationQuerySchema.properties as Record<string, SchemaProperty>

      expect(properties.sortBy.default).toBeUndefined()
    })
  })

  describe('Documentation', () => {
    it('should have descriptions for all properties', () => {
      const properties = ListPaginationQuerySchema.properties as Record<string, SchemaProperty>

      expect(properties.page.description).toBeDefined()
      expect(properties.pageSize.description).toBeDefined()
      expect(properties.sortBy.description).toBeDefined()
      expect(properties.sortOrder.description).toBeDefined()
    })

    it('should have meaningful descriptions', () => {
      const properties = ListPaginationQuerySchema.properties as Record<string, SchemaProperty>

      expect(properties.page.description).toContain('page')
      expect(properties.pageSize.description).toContain('per page')
      expect(properties.sortBy.description).toContain('sort')
      expect(properties.sortOrder.description).toContain('order')
    })
  })
})
