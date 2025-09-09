import { Type, type Static } from '@sinclair/typebox'

import { ItemSchema } from '@/features/items/items.domain.schema'
import {
    PaginationQuerySchema,
    SearchQuerySchema,
    VisibilityQuerySchema,
    createPaginatedResponseSchema,
    createSuccessResponseSchema,
} from '@/shared/schemas'

// Sort
const ItemSortQuerySchema = Type.Object(
    {
        sortBy: Type.Optional(
            Type.String({
                enum: ['createdAt', 'updatedAt', 'name', 'rarity', 'requiredLevel'],
            })
        ),
        sortDir: Type.Optional(Type.String({ enum: ['asc', 'desc'], default: 'desc' })),
    },
    { $id: 'ItemSortQuery' }
)

export const CreateItemSchema = Type.Object(
    {
        name: Type.String({ minLength: 1, maxLength: 120, transform: ['trim'] }),
        description: Type.Optional(Type.String({ maxLength: 4000, transform: ['trim'] })),
        rarity: Type.Optional(
            Type.String({ enum: ['COMMON', 'UNCOMMON', 'RARE', 'EPIC', 'LEGENDARY'] })
        ),
        slot: Type.Optional(
            Type.String({
                enum: [
                    'NONE',
                    'HEAD',
                    'FACE',
                    'CHEST',
                    'LEGS',
                    'FEET',
                    'HANDS',
                    'ONE_HAND',
                    'TWO_HANDS',
                    'RING',
                    'AMULET',
                    'BELT',
                    'BACKPACK',
                    'CLOAK',
                ],
            })
        ),
        requiredLevel: Type.Optional(Type.Integer({ minimum: 1 })),
        weight: Type.Optional(Type.Number({ minimum: 0 })),
        durability: Type.Optional(Type.Integer({ minimum: 0 })),
        maxDurability: Type.Optional(Type.Integer({ minimum: 0 })),
        value: Type.Optional(Type.Integer({ minimum: 0 })),
        imageId: Type.Optional(Type.String({ format: 'uuid' })),
        // Flags
        is2Handed: Type.Optional(Type.Boolean()),
        isThrowable: Type.Optional(Type.Boolean()),
        isConsumable: Type.Optional(Type.Boolean()),
        isQuestItem: Type.Optional(Type.Boolean()),
        isTradeable: Type.Optional(Type.Boolean()),
        visibility: Type.Optional(Type.String({ enum: ['PUBLIC', 'PRIVATE', 'HIDDEN'] })),
    },
    { $id: 'CreateItem' }
)

export const UpdateItemSchema = Type.Partial(CreateItemSchema, { $id: 'UpdateItem' })

export const ItemParamsSchema = Type.Object(
    { id: Type.String({ format: 'uuid' }) },
    { $id: 'ItemParams' }
)

export const ItemListQuerySchema = Type.Intersect(
    [SearchQuerySchema, VisibilityQuerySchema, PaginationQuerySchema, ItemSortQuerySchema],
    { $id: 'ItemListQuery' }
)

// Placeholder stats (to be implemented in later tasks)
export const ItemStatsSchema = Type.Object(
    {
        totalItems: Type.Number(),
        publicItems: Type.Number(),
        rareItems: Type.Number(),
        legendaryItems: Type.Number(),
        newItemsLast30Days: Type.Number(),
    },
    { $id: 'ItemStats' }
)

export const ItemResponseSchema = createSuccessResponseSchema(ItemSchema, 'ItemResponse')
export const ItemListResponseSchema = createPaginatedResponseSchema(ItemSchema, 'ItemListResponse')
export const ItemStatsResponseSchema = createSuccessResponseSchema(
    ItemStatsSchema,
    'ItemStatsResponse'
)

export type Item = Static<typeof ItemSchema>
export type CreateItem = Static<typeof CreateItemSchema>
export type UpdateItem = Static<typeof UpdateItemSchema>
export type ItemParams = Static<typeof ItemParamsSchema>
export type ItemListQuery = Static<typeof ItemListQuerySchema>
export type ItemStats = Static<typeof ItemStatsSchema>
