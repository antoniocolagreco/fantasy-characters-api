/**
 * User service - business logic for user operations
 * Functional approach following project principles
 */

import { User, Role, Prisma } from '@prisma/client'
import { db } from '../shared/database/index.js'
import {
  createNotFoundError,
  createConflictError,
  createValidationError,
  createInternalServerError,
  isAppError,
} from '../shared/errors.js'
import { VALIDATION, PAGINATION } from '../shared/constants.js'
import type {
  CreateUserRequest,
  UpdateUserRequest,
  UserListQuery,
  UserResponse,
  UserListResponse,
} from './user.schema.js'

/**
 * Transform database user to API response format
 */
const transformUserToResponse = (user: User): UserResponse => ({
  id: user.id,
  email: user.email,
  displayName: user.displayName,
  bio: user.bio,
  role: user.role,
  isEmailVerified: user.isEmailVerified,
  isActive: user.isActive,
  profilePictureId: user.profilePictureId,
  lastLogin: user.lastLogin.toISOString(),
  createdAt: user.createdAt.toISOString(),
  updatedAt: user.updatedAt.toISOString(),
})

/**
 * Validate email format
 */
const validateEmail = (email: string): boolean => {
  return VALIDATION.EMAIL_REGEX.test(email)
}

/**
 * Validate password strength
 */
const validatePassword = (password: string): boolean => {
  return (
    password.length >= VALIDATION.PASSWORD_MIN_LENGTH &&
    password.length <= VALIDATION.PASSWORD_MAX_LENGTH
  )
}

/**
 * Check if email already exists
 */
const checkEmailExists = async (email: string, excludeUserId?: string): Promise<boolean> => {
  const existingUser = await db.user.findUnique({
    where: { email },
    select: { id: true },
  })

  return existingUser !== null && existingUser.id !== excludeUserId
}

/**
 * Create a new user
 */
export const createUser = async (userData: CreateUserRequest): Promise<UserResponse> => {
  // Validate email format
  if (!validateEmail(userData.email)) {
    throw createValidationError('Invalid email format')
  }

  // Validate password
  if (!validatePassword(userData.passwordHash)) {
    throw createValidationError(
      `Password must be between ${VALIDATION.PASSWORD_MIN_LENGTH} and ${VALIDATION.PASSWORD_MAX_LENGTH} characters`,
    )
  }

  // Check if email already exists
  if (await checkEmailExists(userData.email)) {
    throw createConflictError('Email already exists')
  }

  // Validate display name if provided
  if (userData.displayName) {
    if (
      userData.displayName.length < VALIDATION.NAME_MIN_LENGTH ||
      userData.displayName.length > VALIDATION.NAME_MAX_LENGTH
    ) {
      throw createValidationError(
        `Display name must be between ${VALIDATION.NAME_MIN_LENGTH} and ${VALIDATION.NAME_MAX_LENGTH} characters`,
      )
    }
  }

  // Validate bio if provided
  if (userData.bio && userData.bio.length > VALIDATION.DESCRIPTION_MAX_LENGTH) {
    throw createValidationError(
      `Bio must not exceed ${VALIDATION.DESCRIPTION_MAX_LENGTH} characters`,
    )
  }

  try {
    const newUser = await db.user.create({
      data: {
        email: userData.email.toLowerCase().trim(),
        passwordHash: userData.passwordHash,
        displayName: userData.displayName?.trim() || null,
        bio: userData.bio?.trim() || null,
        role: (userData.role as Role) || 'USER',
      },
    })

    return transformUserToResponse(newUser)
  } catch (error) {
    throw createInternalServerError('Failed to create user', error)
  }
}

/**
 * Get user by ID
 */
export const getUserById = async (id: string): Promise<UserResponse> => {
  // Validate UUID format
  if (!VALIDATION.UUID_REGEX.test(id)) {
    throw createValidationError('Invalid user ID format')
  }

  try {
    const user = await db.user.findUnique({
      where: { id },
    })

    if (!user) {
      throw createNotFoundError('User', id)
    }

    return transformUserToResponse(user)
  } catch (error) {
    if (isAppError(error) && error.name === 'NotFoundError') {
      throw error
    }
    throw createInternalServerError('Failed to retrieve user', error)
  }
}

/**
 * Get users list with pagination and filtering
 */
export const getUsersList = async (query: UserListQuery): Promise<UserListResponse> => {
  try {
    const page = Math.max(1, query.page || PAGINATION.DEFAULT_PAGE)
    const pageSize = Math.min(
      Math.max(1, query.pageSize || PAGINATION.DEFAULT_LIMIT),
      PAGINATION.MAX_LIMIT,
    )
    const skip = (page - 1) * pageSize

    // Build where clause for filtering
    const where: Prisma.UserWhereInput = {}

    // Filter by role
    if (query.role) {
      where.role = query.role as Role
    }

    // Filter by active status
    if (query.isActive !== undefined) {
      where.isActive = query.isActive
    }

    // Filter by email verification status
    if (query.isEmailVerified !== undefined) {
      where.isEmailVerified = query.isEmailVerified
    }

    // Search in email and display name
    if (query.search) {
      const searchTerm = query.search.trim()
      where.OR = [{ email: { contains: searchTerm } }, { displayName: { contains: searchTerm } }]
    }

    // Build orderBy clause
    let orderBy: Prisma.UserOrderByWithRelationInput = { createdAt: 'desc' } // Default sorting

    if (query.sortBy) {
      const sortField = query.sortBy
      const sortOrder = query.sortOrder || 'asc'

      // Validate sort field (only allow safe fields)
      const allowedSortFields = [
        'email',
        'displayName',
        'role',
        'isActive',
        'isEmailVerified',
        'lastLogin',
        'createdAt',
        'updatedAt',
      ] as const

      if (allowedSortFields.includes(sortField as (typeof allowedSortFields)[number])) {
        orderBy = { [sortField]: sortOrder }
      }
    }

    // Get total count and users in parallel
    const [total, users] = await Promise.all([
      db.user.count({ where }),
      db.user.findMany({
        where,
        orderBy,
        skip,
        take: pageSize,
      }),
    ])

    const totalPages = Math.ceil(total / pageSize)

    return {
      data: users.map(transformUserToResponse),
      pagination: {
        page,
        pageSize,
        total,
        totalPages,
      },
    }
  } catch (error) {
    throw createInternalServerError('Failed to retrieve users list', error)
  }
}

/**
 * Update user by ID
 */
export const updateUser = async (
  id: string,
  updateData: UpdateUserRequest,
): Promise<UserResponse> => {
  // Validate UUID format
  if (!VALIDATION.UUID_REGEX.test(id)) {
    throw createValidationError('Invalid user ID format')
  }

  // Validate email format if provided
  if (updateData.email && !validateEmail(updateData.email)) {
    throw createValidationError('Invalid email format')
  }

  // Check if email already exists (exclude current user)
  if (updateData.email && (await checkEmailExists(updateData.email, id))) {
    throw createConflictError('Email already exists')
  }

  // Validate display name if provided
  if (updateData.displayName !== undefined) {
    if (updateData.displayName !== null) {
      if (
        updateData.displayName.length < VALIDATION.NAME_MIN_LENGTH ||
        updateData.displayName.length > VALIDATION.NAME_MAX_LENGTH
      ) {
        throw createValidationError(
          `Display name must be between ${VALIDATION.NAME_MIN_LENGTH} and ${VALIDATION.NAME_MAX_LENGTH} characters`,
        )
      }
    }
  }

  // Validate bio if provided
  if (updateData.bio !== undefined) {
    if (updateData.bio !== null && updateData.bio.length > VALIDATION.DESCRIPTION_MAX_LENGTH) {
      throw createValidationError(
        `Bio must not exceed ${VALIDATION.DESCRIPTION_MAX_LENGTH} characters`,
      )
    }
  }

  try {
    // First check if user exists
    const existingUser = await db.user.findUnique({
      where: { id },
      select: { id: true },
    })

    if (!existingUser) {
      throw createNotFoundError('User', id)
    }

    // Prepare update data
    const updatePayload: Prisma.UserUpdateInput = {}

    if (updateData.email !== undefined) {
      updatePayload.email = updateData.email.toLowerCase().trim()
    }

    if (updateData.displayName !== undefined) {
      updatePayload.displayName = updateData.displayName?.trim() || null
    }

    if (updateData.bio !== undefined) {
      updatePayload.bio = updateData.bio?.trim() || null
    }

    if (updateData.role !== undefined) {
      updatePayload.role = updateData.role as Role
    }

    if (updateData.isActive !== undefined) {
      updatePayload.isActive = updateData.isActive
    }

    if (updateData.isEmailVerified !== undefined) {
      updatePayload.isEmailVerified = updateData.isEmailVerified
    }

    // Update user
    const updatedUser = await db.user.update({
      where: { id },
      data: updatePayload,
    })

    return transformUserToResponse(updatedUser)
  } catch (error) {
    if (isAppError(error) && error.name === 'NotFoundError') {
      throw error
    }
    throw createInternalServerError('Failed to update user', error)
  }
}

/**
 * Delete user by ID
 */
export const deleteUser = async (id: string): Promise<void> => {
  // Validate UUID format
  if (!VALIDATION.UUID_REGEX.test(id)) {
    throw createValidationError('Invalid user ID format')
  }

  try {
    // Check if user exists
    const existingUser = await db.user.findUnique({
      where: { id },
      select: { id: true },
    })

    if (!existingUser) {
      throw createNotFoundError('User', id)
    }

    // Delete user (CASCADE will handle related records)
    await db.user.delete({
      where: { id },
    })
  } catch (error) {
    if (isAppError(error) && error.name === 'NotFoundError') {
      throw error
    }
    throw createInternalServerError('Failed to delete user', error)
  }
}

/**
 * Check if user exists
 */
export const userExists = async (id: string): Promise<boolean> => {
  try {
    const user = await db.user.findUnique({
      where: { id },
      select: { id: true },
    })
    return user !== null
  } catch (_error) {
    return false
  }
}

/**
 * Get user by email
 */
export const getUserByEmail = async (email: string): Promise<UserResponse | null> => {
  try {
    const user = await db.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    })

    return user ? transformUserToResponse(user) : null
  } catch (error) {
    throw createInternalServerError('Failed to retrieve user by email', error)
  }
}
