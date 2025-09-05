import { type Static, Type } from '@sinclair/typebox'

import { RoleSchema, VisibilitySchema } from '../../shared/schemas'

// RBAC Types

export const ActionSchema = Type.Union(
    [
        Type.Literal('read'),
        Type.Literal('create'),
        Type.Literal('update'),
        Type.Literal('delete'),
        Type.Literal('manage'),
    ],
    { $id: 'Action' }
)

export const ResourceSchema = Type.Union(
    [
        Type.Literal('users'),
        Type.Literal('characters'),
        Type.Literal('images'),
        Type.Literal('tags'),
        Type.Literal('items'),
        Type.Literal('races'),
        Type.Literal('archetypes'),
        Type.Literal('skills'),
        Type.Literal('perks'),
        Type.Literal('equipment'),
    ],
    { $id: 'Resource' }
)

export const OwnershipDataSchema = Type.Object(
    {
        ownerId: Type.Optional(Type.Union([Type.String({ format: 'uuid' }), Type.Null()])),
        visibility: Type.Optional(Type.Union([VisibilitySchema, Type.Null()])),
        ownerRole: Type.Optional(Type.Union([RoleSchema, Type.Null()])),
        targetUserRole: Type.Optional(Type.Union([RoleSchema, Type.Null()])),
    },
    { $id: 'OwnershipData' }
)

export const RbacContextSchema = Type.Object(
    {
        user: Type.Optional(
            Type.Union([
                Type.Object({
                    id: Type.String({ format: 'uuid' }),
                    role: RoleSchema,
                }),
                Type.Undefined(),
            ])
        ),
        resource: ResourceSchema,
        action: ActionSchema,
        ownerId: Type.Optional(
            Type.Union([Type.String({ format: 'uuid' }), Type.Null(), Type.Undefined()])
        ),
        visibility: Type.Optional(Type.Union([VisibilitySchema, Type.Undefined()])),
        ownerRole: Type.Optional(Type.Union([RoleSchema, Type.Undefined()])),
        targetUserRole: Type.Optional(Type.Union([RoleSchema, Type.Undefined()])),
    },
    { $id: 'RbacContext' }
)

// Route RBAC Config
export const RouteRbacConfigSchema = Type.Object(
    {
        resource: ResourceSchema,
        action: ActionSchema,
        ownership: Type.Optional(
            Type.Union([Type.Literal('own'), Type.Literal('any'), Type.Literal('public')])
        ),
    },
    { $id: 'RouteRbacConfig' }
)

// User for RBAC checks
export const RbacUserSchema = Type.Object(
    {
        id: Type.String({ format: 'uuid' }),
        role: RoleSchema,
    },
    { $id: 'RbacUser' }
)

// Options for userCan convenience function
export const UserCanOptionsSchema = Type.Object(
    {
        ownerId: Type.Optional(Type.Union([Type.String({ format: 'uuid' }), Type.Null()])),
        visibility: Type.Optional(VisibilitySchema),
        ownerRole: Type.Optional(RoleSchema),
        targetUserRole: Type.Optional(RoleSchema),
    },
    { $id: 'UserCanOptions' }
)

// Derive TypeScript types
export type Action = Static<typeof ActionSchema>
export type Resource = Static<typeof ResourceSchema>
export type OwnershipData = Static<typeof OwnershipDataSchema>
export type RbacContext = Static<typeof RbacContextSchema>
export type RouteRbacConfig = Static<typeof RouteRbacConfigSchema>
export type RbacUser = Static<typeof RbacUserSchema>
export type UserCanOptions = Static<typeof UserCanOptionsSchema>
