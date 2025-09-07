import { type Static, Type } from '@sinclair/typebox'

import { RoleSchema, VisibilitySchema } from '@/shared/schemas'

// RBAC Types

export const ActionSchema = Type.String({
    $id: 'Action',
    title: 'RBAC Action',
    description: 'Type of action being performed on a resource',
    enum: ['read', 'create', 'update', 'delete', 'manage'],
})

export const ResourceSchema = Type.String({
    $id: 'Resource',
    title: 'RBAC Resource',
    description: 'Type of resource being accessed',
    enum: [
        'users',
        'characters',
        'images',
        'tags',
        'items',
        'races',
        'archetypes',
        'skills',
        'perks',
        'equipment',
    ],
})

export const OwnershipDataSchema = Type.Object(
    {
        ownerId: Type.Optional(
            Type.Union([
                Type.String({
                    format: 'uuid',
                    description: 'ID of the resource owner',
                }),
                Type.Null(),
            ])
        ),
        visibility: Type.Optional(Type.Union([VisibilitySchema, Type.Null()])),
        ownerRole: Type.Optional(Type.Union([RoleSchema, Type.Null()])),
        targetUserRole: Type.Optional(Type.Union([RoleSchema, Type.Null()])),
    },
    {
        $id: 'OwnershipData',
        title: 'Ownership Data',
        description: 'Data used for ownership-based access control',
    }
)

export const RbacContextSchema = Type.Object(
    {
        user: Type.Optional(
            Type.Union([
                Type.Object({
                    id: Type.String({
                        format: 'uuid',
                        description: 'User ID',
                    }),
                    role: RoleSchema,
                }),
                Type.Undefined(),
            ])
        ),
        resource: ResourceSchema,
        action: ActionSchema,
        ownerId: Type.Optional(
            Type.Union([
                Type.String({
                    format: 'uuid',
                    description: 'ID of the resource owner',
                }),
                Type.Null(),
                Type.Undefined(),
            ])
        ),
        visibility: Type.Optional(Type.Union([VisibilitySchema, Type.Undefined()])),
        ownerRole: Type.Optional(Type.Union([RoleSchema, Type.Undefined()])),
        targetUserRole: Type.Optional(Type.Union([RoleSchema, Type.Undefined()])),
    },
    {
        $id: 'RbacContext',
        title: 'RBAC Context',
        description: 'Context information for role-based access control evaluation',
    }
)

// Route RBAC Config
export const RouteRbacConfigSchema = Type.Object(
    {
        resource: ResourceSchema,
        action: ActionSchema,
        ownership: Type.Optional(
            Type.String({
                enum: ['own', 'any', 'public'],
                description: 'Ownership requirement for accessing the resource',
            })
        ),
    },
    {
        $id: 'RouteRbacConfig',
        title: 'Route RBAC Config',
        description: 'RBAC configuration for API routes',
    }
)

// User for RBAC checks
export const RbacUserSchema = Type.Object(
    {
        id: Type.String({
            format: 'uuid',
            description: 'User ID',
        }),
        role: RoleSchema,
    },
    {
        $id: 'RbacUser',
        title: 'RBAC User',
        description: 'User information for RBAC evaluation',
    }
)

// Options for userCan convenience function
export const UserCanOptionsSchema = Type.Object(
    {
        ownerId: Type.Optional(
            Type.Union([
                Type.String({
                    format: 'uuid',
                    description: 'ID of the resource owner',
                }),
                Type.Null(),
            ])
        ),
        visibility: Type.Optional(VisibilitySchema),
        ownerRole: Type.Optional(RoleSchema),
        targetUserRole: Type.Optional(RoleSchema),
    },
    {
        $id: 'UserCanOptions',
        title: 'User Can Options',
        description: 'Optional parameters for user permission checks',
    }
)

// Derive TypeScript types
export type Action = Static<typeof ActionSchema>
export type Resource = Static<typeof ResourceSchema>
export type OwnershipData = Static<typeof OwnershipDataSchema>
export type RbacContext = Static<typeof RbacContextSchema>
export type RouteRbacConfig = Static<typeof RouteRbacConfigSchema>
export type RbacUser = Static<typeof RbacUserSchema>
export type UserCanOptions = Static<typeof UserCanOptionsSchema>
