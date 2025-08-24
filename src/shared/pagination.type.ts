/**
 * Pagination-related TypeScript type definitions
 * All pagination types including schema-derived types
 */

import { Static } from '@sinclair/typebox'
import type { ListPaginationQuerySchema } from './pagination.schema'

// ============================================================================
// SCHEMA-DERIVED TYPES
// ============================================================================

export type ListPagination = Static<typeof ListPaginationQuerySchema>

// ============================================================================
// BUSINESS LOGIC TYPES
// ============================================================================

export type PaginationQuery = {
  page: number
  pageSize: number
}

export type PaginationResponse = PaginationQuery & {
  total: number
  totalPages: number
}

export type PaginatedQuery<T> = {
  filter?: Partial<T>
  pagination: PaginationQuery
}

export type PaginatedResult<T> = {
  data: T[]
  pagination: PaginationResponse
}
