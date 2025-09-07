/**
 * Centralized schema exports for the Fantasy Characters API
 * This file provides a single point of access to all schemas,
 * organized by category to prevent circular dependencies.
 */

// Base/Common schemas (foundation layer)
export {
    BaseEntitySchema,
    OwnedEntitySchema,
    RaritySchema,
    RoleSchema,
    SexSchema,
    SlotSchema,
    VisibilitySchema,
    type BaseEntity,
    type OwnedEntity,
    type Rarity,
    type Role,
    type Sex,
    type Slot,
    type Visibility,
} from './common.schema'

// Error schemas (foundation layer)
export {
    ErrorCodeSchema,
    ErrorDetailSchema,
    ErrorResponseSchema,
    type ErrorCode,
    type ErrorDetail,
    type ErrorResponse,
} from './error.schema'

// Query schemas (depends on common)
export {
    PaginationQuerySchema,
    SearchQuerySchema,
    SortQuerySchema,
    StandardQuerySchema,
    VisibilityQuerySchema,
    type PaginationQuery,
    type SearchQuery,
    type SortQuery,
    type StandardQuery,
    type VisibilityQuery,
} from './query.schema'

// Response schemas (depends on error and common)
export {
    BaseResponseSchema,
    PaginationSchema,
    createPaginatedResponseSchema,
    createPaginatedResultSchema,
    createSuccessResponseSchema,
    type BaseResponse,
    type Pagination,
    type PaginatedResultOf,
} from './response.schema'

// Configuration schemas (standalone)
export * from './config.schema'

// Health schemas (standalone)
export * from './health.schema'
