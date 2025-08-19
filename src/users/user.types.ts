// User-specific TypeScript type definitions
export type UserProfile = {
  id: string
  email: string
  name?: string
  bio?: string
  role: string
  isEmailVerified: boolean
  isActive: boolean
  profilePictureId?: string
  createdAt: Date
  updatedAt: Date
}

export type CreateUserData = {
  email: string
  passwordHash: string
  name?: string
  bio?: string
  role?: string
}

export type UpdateUserData = {
  name?: string
  bio?: string
  isEmailVerified?: boolean
  isActive?: boolean
  profilePictureId?: string
}

export type UserFilterOptions = {
  email?: string
  role?: string
  isActive?: boolean
  isEmailVerified?: boolean
}

export type UserStatsData = {
  totalUsers: number
  activeUsers: number
  verifiedUsers: number
  usersByRole: Record<string, number>
}
