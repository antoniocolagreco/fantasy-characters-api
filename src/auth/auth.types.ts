// Auth-specific TypeScript type definitions
export type AuthUser = {
  id: string
  email: string
  role: string
  isEmailVerified: boolean
  isActive: boolean
}

export type LoginCredentials = {
  email: string
  password: string
}

export type RegisterData = {
  email: string
  password: string
  name?: string
}

export type TokenPair = {
  accessToken: string
  refreshToken: string
}

export type RefreshTokenData = {
  refreshToken: string
}

export type PasswordChangeData = {
  currentPassword: string
  newPassword: string
}
