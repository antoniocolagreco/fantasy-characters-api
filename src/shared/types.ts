// Shared TypeScript type definitions that are used across multiple features
export type { AuthUser } from '../auth/auth.types'

// Common shared types
export type ID = string

export type Visibility = 'PUBLIC' | 'PRIVATE' | 'HIDDEN'

export type Role = 'USER' | 'MODERATOR' | 'ADMIN'

export type Timestamp = {
  createdAt: Date
  updatedAt: Date
}

export type WithOwnership = {
  ownerId?: string | null
}

export type WithVisibility = {
  visibility: Visibility
}

export type BaseEntity = {
  id: ID
} & Timestamp &
  WithOwnership &
  WithVisibility
