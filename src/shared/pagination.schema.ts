import { Type } from '@sinclair/typebox'

export const ListPaginationQuerySchema = Type.Object(
  {
    page: Type.Optional(
      Type.Integer({
        minimum: 1,
        default: 1,
        description: 'Current page number (starts from 1)',
      }),
    ),
    pageSize: Type.Optional(
      Type.Integer({
        minimum: 1,
        maximum: 100,
        default: 10,
        description: 'Items per page (1-100)',
      }),
    ),
    sortBy: Type.Optional(
      Type.String({
        minLength: 1,
        description: 'Field to sort by (entity-specific)',
      }),
    ),
    sortOrder: Type.Optional(
      Type.String({
        enum: ['asc', 'desc'],
        description: 'Sort order: ascending or descending',
      }),
    ),
  },
  {
    additionalProperties: false,
    description: 'Base pagination and sorting parameters for list operations',
  },
)
