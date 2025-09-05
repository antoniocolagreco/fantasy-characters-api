// Auth feature barrel exports
export * from '@/features/auth/auth.middleware'
export * from '@/features/auth/auth.schema'
export * from '@/features/auth/jwt.service'
export * from '@/features/auth/password.service'
export * from '@/features/auth/rbac.middleware'
export * from '@/features/auth/rbac.policy'

// Re-export RBAC types with aliases to avoid conflicts
export type {
    Action,
    OwnershipData,
    RbacContext,
    RbacUser,
    Resource,
    RouteRbacConfig,
    UserCanOptions,
} from '@/features/auth/rbac.schema'

// Re-export common types
export type { Role as RbacRole, Visibility } from '@/shared/schemas/common.schema'
