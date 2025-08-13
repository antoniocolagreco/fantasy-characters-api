import { db } from './database/index.js'
import { hashPassword } from '../auth/auth.service.js'
import { Role } from '@prisma/client'

/**
 * Test helper utilities for database cleanup and test data creation
 */

export type TestUserData = {
  email?: string
  password?: string
  displayName?: string
  bio?: string
  role?: Role
  isActive?: boolean
  isEmailVerified?: boolean
}

export type CreateTestUserResult = {
  user: {
    id: string
    email: string
    displayName: string | null
    bio: string | null
    role: Role
    isActive: boolean
    isEmailVerified: boolean
    lastLogin: string
    createdAt: string
    updatedAt: string
  }
  password: string
}

/**
 * Clean up test data from database
 */
export const cleanupTestData = async (): Promise<void> => {
  // Delete in reverse order of dependencies
  await db.user.deleteMany({
    where: {
      OR: [
        { email: { contains: 'test' } },
        { email: { contains: 'example.com' } },
        { email: 'newuser@example.com' },
      ],
    },
  })
}

/**
 * Create a test user with optional custom data
 */
export const createTestUser = async (
  userData: TestUserData = {},
): Promise<CreateTestUserResult> => {
  const defaultPassword = 'TestPassword123!'
  const password = userData.password || defaultPassword

  const user = await db.user.create({
    data: {
      email: userData.email || `test-${Date.now()}@example.com`,
      passwordHash: await hashPassword(password),
      displayName: userData.displayName || 'Test User',
      bio: userData.bio || 'Test user bio',
      role: userData.role || Role.USER,
      isActive: userData.isActive !== undefined ? userData.isActive : true,
      isEmailVerified: userData.isEmailVerified !== undefined ? userData.isEmailVerified : false,
      lastLogin: new Date(),
    },
  })

  return {
    user: {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      bio: user.bio,
      role: user.role,
      isActive: user.isActive,
      isEmailVerified: user.isEmailVerified,
      lastLogin: user.lastLogin.toISOString(),
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    },
    password,
  }
}

/**
 * Create a test admin user
 */
export const createTestAdminUser = async (
  userData: TestUserData = {},
): Promise<CreateTestUserResult> => {
  return createTestUser({
    ...userData,
    role: Role.ADMIN,
    email: userData.email || `admin-${Date.now()}@example.com`,
    displayName: userData.displayName || 'Test Admin',
  })
}

/**
 * Create multiple test users
 */
export const createTestUsers = async (
  count: number,
  userData: TestUserData = {},
): Promise<CreateTestUserResult[]> => {
  const users: CreateTestUserResult[] = []

  for (let i = 0; i < count; i++) {
    const user = await createTestUser({
      ...userData,
      email: userData.email || `test-${Date.now()}-${i}@example.com`,
      displayName: userData.displayName || `Test User ${i + 1}`,
    })
    users.push(user)
  }

  return users
}
