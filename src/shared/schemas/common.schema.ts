import { type Static, Type } from '@sinclair/typebox'

// Core entity schemas used across features

// Role Schema - used in auth and RBAC
export const RoleSchema = Type.String({
    $id: 'Role',
    title: 'User Role',
    description: 'The role that determines user permissions within the system',
    enum: ['ADMIN', 'MODERATOR', 'USER'],
})

export const RoleSchemaLiterals = Type.Union(
    [Type.Literal('ADMIN'), Type.Literal('MODERATOR'), Type.Literal('USER')],
    {
        $id: 'RoleLiterals',
        title: 'User Role',
        description: 'The role that determines user permissions within the system',
    }
)

// Visibility Schema - used for content visibility across features
export const VisibilitySchema = Type.String({
    $id: 'Visibility',
    title: 'Content Visibility',
    description: 'Controls who can view this content',
    enum: ['PUBLIC', 'PRIVATE', 'HIDDEN'],
})

export const VisibilitySchemaLiterals = Type.Union(
    [Type.Literal('PUBLIC'), Type.Literal('PRIVATE'), Type.Literal('HIDDEN')],
    {
        $id: 'VisibilityLiterals',
        title: 'Content Visibility',
        description: 'Controls who can view this content',
    }
)

// Sex/Gender Schema - used for characters
export const SexSchema = Type.String({
    $id: 'Sex',
    title: 'Character Sex',
    description: 'The biological sex of the character',
    enum: ['MALE', 'FEMALE'],
})

export const SexSchemaLiterals = Type.Union([Type.Literal('MALE'), Type.Literal('FEMALE')], {
    $id: 'SexLiterals',
    title: 'Character Sex Literals',
    description: 'Literal types for character sex, used in character creation and management',
})

// Rarity Schema - used for items
export const RaritySchema = Type.String({
    $id: 'Rarity',
    title: 'Item Rarity',
    description: 'The rarity classification of an item, affecting its value and power',
    enum: ['COMMON', 'UNCOMMON', 'RARE', 'EPIC', 'LEGENDARY'],
})

export const RaritySchemaLiterals = Type.Union(
    [
        Type.Literal('COMMON'),
        Type.Literal('UNCOMMON'),
        Type.Literal('RARE'),
        Type.Literal('EPIC'),
        Type.Literal('LEGENDARY'),
    ],
    {
        $id: 'RarityLiterals',
        title: 'Item Rarity Literals',
        description: 'Literal types for item rarity, used in item creation and management',
    }
)

// Equipment Slot Schema - used for items and equipment
export const SlotSchema = Type.String({
    $id: 'Slot',
    title: 'Equipment Slot',
    description: 'The equipment slot where an item can be equipped',
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

export const SlotSchemaLiterals = Type.Union(
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
    {
        $id: 'SlotLiterals',
        title: 'Equipment Slot Literals',
        description: 'Literal types for equipment slots, used in item creation and management',
    }
)

// Base Entity Schema - common fields for all entities
export const BaseEntitySchema = Type.Object(
    {
        id: Type.String({
            format: 'uuid',
            description: 'Unique identifier for the entity',
        }),
        createdAt: Type.String({
            format: 'date-time',
            description: 'Timestamp when the entity was created',
        }),
        updatedAt: Type.String({
            format: 'date-time',
            description: 'Timestamp when the entity was last updated',
        }),
    },
    {
        $id: 'BaseEntity',
        title: 'Base Entity',
        description: 'Common fields inherited by all entities',
    }
)

// Owned Entity Schema - entities that have an owner
export const OwnedEntitySchema = Type.Intersect(
    [
        BaseEntitySchema,
        Type.Object({
            ownerId: Type.Optional(
                Type.String({
                    format: 'uuid',
                    description: 'ID of the user who owns this entity',
                })
            ),
            visibility: VisibilitySchema,
        }),
    ],
    {
        $id: 'OwnedEntity',
        title: 'Owned Entity',
        description: 'Entity that can be owned by a user and has visibility settings',
    }
)

// Export TypeScript types derived from schemas
export type Role = Static<typeof RoleSchema>
export type Visibility = Static<typeof VisibilitySchema>
export type Sex = Static<typeof SexSchema>
export type Rarity = Static<typeof RaritySchema>
export type Slot = Static<typeof SlotSchema>
export type BaseEntity = Static<typeof BaseEntitySchema>
export type OwnedEntity = Static<typeof OwnedEntitySchema>

export type RoleLiterals = Static<typeof RoleSchemaLiterals>
export type VisibilityLiterals = Static<typeof VisibilitySchemaLiterals>
export type SexLiterals = Static<typeof SexSchemaLiterals>
export type RarityLiterals = Static<typeof RaritySchemaLiterals>
export type SlotLiterals = Static<typeof SlotSchemaLiterals>
