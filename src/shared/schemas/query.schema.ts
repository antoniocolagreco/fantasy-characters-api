import { type Static, Type } from '@sinclair/typebox'

import { VisibilitySchema } from './common.schema'

/**
 * Standard pagination query parameters
 */
export const PaginationQuerySchema = Type.Object(
    {
        limit: Type.Optional(
            Type.Integer({
                minimum: 1,
                maximum: 100,
                default: 20,
                description: 'Number of items to return (1-100)',
            })
        ),
        cursor: Type.Optional(
            Type.String({
                description: 'Cursor for pagination - use the next_cursor from previous response',
            })
        ),
    },
    {
        $id: 'PaginationQuery',
        title: 'Pagination Query',
        description: 'Standard pagination parameters for listing endpoints',
    }
)

/**
 * Standard sorting query parameters
 */
export const SortQuerySchema = Type.Object(
    {
        sortBy: Type.Optional(
            Type.String({
                enum: ['createdAt', 'updatedAt', 'name'],
                description: 'Field to sort by',
            })
        ),
        sortDir: Type.Optional(
            Type.String({
                enum: ['asc', 'desc'],
                default: 'desc',
                description: 'Sort direction',
            })
        ),
    },
    {
        $id: 'SortQuery',
        title: 'Sort Query',
        description: 'Standard sorting parameters for listing endpoints',
    }
)

/**
 * Visibility filter query parameters
 */
export const VisibilityQuerySchema = Type.Object(
    {
        visibility: Type.Optional(VisibilitySchema),
    },
    {
        $id: 'VisibilityQuery',
        title: 'Visibility Query',
        description: 'Filter by content visibility level',
    }
)

/**
 * Standard search query parameters
 */
export const SearchQuerySchema = Type.Object(
    {
        search: Type.Optional(
            Type.String({
                minLength: 1,
                maxLength: 100,
                description: 'Search term to filter results',
            })
        ),
    },
    {
        $id: 'SearchQuery',
        title: 'Search Query',
        description: 'Text search parameter',
    }
)

/**
 * Combined query schema with all standard parameters
 */
export const StandardQuerySchema = Type.Intersect(
    [PaginationQuerySchema, SortQuerySchema, VisibilityQuerySchema, SearchQuerySchema],
    {
        $id: 'StandardQuery',
        title: 'Standard Query',
        description: 'Combined standard query parameters for listing endpoints',
    }
)

// Export TypeScript types
export type PaginationQuery = Static<typeof PaginationQuerySchema>
export type SortQuery = Static<typeof SortQuerySchema>
export type VisibilityQuery = Static<typeof VisibilityQuerySchema>
export type SearchQuery = Static<typeof SearchQuerySchema>
export type StandardQuery = Static<typeof StandardQuerySchema>
