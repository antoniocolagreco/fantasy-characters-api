// CURRENTLY UNUSED
/**
 * Generic CRUD function types for service layers
 */

import type { PaginatedQuery, PaginatedResult } from './pagination.type'

/**
 * Get entity by a single field
 */
export type GetOneService<T> = (value: string | number | boolean) => Promise<T | null>

/**
 * List entities with optional filters and pagination (matches existing findMany pattern)
 */
export type ListService<T> = (data?: PaginatedQuery<T>) => Promise<PaginatedResult<T>>

/**
 * Create a new entity
 */
export type CreateService<T> = (data: { id: string } & Partial<T>) => Promise<T>

/**
 * Update (replace) an entity by ID
 */
export type UpdateService<T> = (data: { id: string } & T) => Promise<T>

/**
 * Patch (partial update) an entity by ID
 */
export type PatchService<T> = (data: { id: string } & Partial<T>) => Promise<T>

/**
 * Delete an entity by ID
 */
export type DeleteService = (id: string) => Promise<void>
