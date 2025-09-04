// Auth feature barrel exports
export * from './auth.schema'
export * from './auth.middleware'
export * from './jwt.service'
export * from './password.service'
export * from './rbac.policy'
export * from './rbac.middleware'

// Re-export RBAC types with aliases to avoid conflicts
export type {
    Action,
    Resource,
    OwnershipData,
    RbacContext,
    RouteRbacConfig,
    RbacUser,
    UserCanOptions,
} from './rbac.schema'

// Re-export common types
export type { Role as RbacRole, Visibility } from '../../shared/schemas/common.schemas'
