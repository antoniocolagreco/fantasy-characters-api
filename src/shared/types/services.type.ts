/**
 * Generic CRUD function types for service layers
 */

import type { PaginatedResult } from './pagination.type'

/**
 * Get entity by ID
 */
export type GetByIdService<T, Q = string> = (id: Q) => Promise<T | null>

/**
 * List entities with optional filters and pagination (matches existing findMany pattern)
 */
export type ListService<T, Q = unknown> = (query?: Q) => Promise<PaginatedResult<T>>

/**
 * Create a new entity
 */
export type CreateService<T, Q = Partial<T>> = (data: Q) => Promise<T>

/**
 * Update (replace) an entity by ID
 */
export type UpdateService<T> = (date: T) => Promise<T>

/**
 * Patch (partial update) an entity by ID
 */
export type PatchService<T, Q = Partial<T>> = (data: Q) => Promise<T>

/**
 * Delete an entity by ID
 */
export type DeleteService<Q = string> = (id: Q) => Promise<void>
