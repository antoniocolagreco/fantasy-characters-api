import { type Static, Type } from '@sinclair/typebox'

// Core entity schemas used across features

// Role Schema - used in auth and RBAC
export const RoleSchema = Type.Union(
    [Type.Literal('ADMIN'), Type.Literal('MODERATOR'), Type.Literal('USER')],
    { $id: 'Role' }
)

// Visibility Schema - used for content visibility across features
export const VisibilitySchema = Type.Union(
    [Type.Literal('PUBLIC'), Type.Literal('PRIVATE'), Type.Literal('HIDDEN')],
    { $id: 'Visibility' }
)

// Sex/Gender Schema - used for characters
export const SexSchema = Type.Union([Type.Literal('MALE'), Type.Literal('FEMALE')], { $id: 'Sex' })

// Rarity Schema - used for items
export const RaritySchema = Type.Union(
    [
        Type.Literal('COMMON'),
        Type.Literal('UNCOMMON'),
        Type.Literal('RARE'),
        Type.Literal('EPIC'),
        Type.Literal('LEGENDARY'),
    ],
    { $id: 'Rarity' }
)

// Equipment Slot Schema - used for items and equipment
export const SlotSchema = Type.Union(
    [
        Type.Literal('NONE'),
        Type.Literal('HEAD'),
        Type.Literal('FACE'),
        Type.Literal('CHEST'),
        Type.Literal('LEGS'),
        Type.Literal('FEET'),
        Type.Literal('HANDS'),
        Type.Literal('ONE_HAND'),
        Type.Literal('TWO_HANDS'),
        Type.Literal('RING'),
        Type.Literal('AMULET'),
        Type.Literal('BELT'),
        Type.Literal('BACKPACK'),
        Type.Literal('CLOAK'),
    ],
    { $id: 'Slot' }
)

// Base Entity Schema - common fields for all entities
export const BaseEntitySchema = Type.Object(
    {
        id: Type.String({ format: 'uuid' }),
        createdAt: Type.String({ format: 'date-time' }),
        updatedAt: Type.String({ format: 'date-time' }),
    },
    { $id: 'BaseEntity' }
)

// Owned Entity Schema - entities that have an owner
export const OwnedEntitySchema = Type.Intersect(
    [
        BaseEntitySchema,
        Type.Object({
            ownerId: Type.Optional(Type.String({ format: 'uuid' })),
            visibility: VisibilitySchema,
        }),
    ],
    { $id: 'OwnedEntity' }
)

// Export TypeScript types derived from schemas
export type Role = Static<typeof RoleSchema>
export type Visibility = Static<typeof VisibilitySchema>
export type Sex = Static<typeof SexSchema>
export type Rarity = Static<typeof RaritySchema>
export type Slot = Static<typeof SlotSchema>
export type BaseEntity = Static<typeof BaseEntitySchema>
export type OwnedEntity = Static<typeof OwnedEntitySchema>
