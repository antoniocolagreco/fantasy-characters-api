/**
 * Type guards for safe type checking
 * Replaces dangerous type assertions with proper runtime validation
 */

export type Visibility = 'PUBLIC' | 'PRIVATE' | 'HIDDEN'

export type Role = 'USER' | 'MODERATOR' | 'ADMIN'

/**
 * Type guard for Role enum
 */
export const isRole = (value: unknown): value is Role => {
  return typeof value === 'string' && ['USER', 'MODERATOR', 'ADMIN'].includes(value)
}

/**
 * Type guard for Visibility enum
 */
export const isVisibility = (value: unknown): value is Visibility => {
  return typeof value === 'string' && ['PUBLIC', 'PRIVATE', 'HIDDEN'].includes(value)
}

/**
 * Safe role conversion with default fallback
 */
export const toRole = (value: unknown, defaultRole: Role = 'USER'): Role => {
  return isRole(value) ? value : defaultRole
}

/**
 * Safe visibility conversion with default fallback
 */
export const toVisibility = (
  value: unknown,
  defaultVisibility: Visibility = 'PUBLIC',
): Visibility => {
  return isVisibility(value) ? value : defaultVisibility
}

/**
 * Type guard for Error objects with additional properties
 */
export const isErrorWithStatusCode = (error: unknown): error is Error & { statusCode: number } => {
  return (
    error instanceof Error &&
    'statusCode' in error &&
    typeof (error as Record<string, unknown>).statusCode === 'number'
  )
}

/**
 * Type guard for Error objects with code property
 */
export const isErrorWithCode = (error: unknown): error is Error & { code: string } => {
  return (
    error instanceof Error &&
    'code' in error &&
    typeof (error as Record<string, unknown>).code === 'string'
  )
}

/**
 * Type guard for checking if value is non-null
 */
export const isNonNull = <T>(value: T | null | undefined): value is T => {
  return value !== null && value !== undefined
}

/**
 * Type guard for checking if value is a string
 */
export const isString = (value: unknown): value is string => {
  return typeof value === 'string'
}

/**
 * Type guard for checking if value is a number
 */
export const isNumber = (value: unknown): value is number => {
  return typeof value === 'number' && !isNaN(value)
}

/**
 * Type guard for checking if value is a boolean
 */
export const isBoolean = (value: unknown): value is boolean => {
  return typeof value === 'boolean'
}

/**
 * Type guard for checking if object has a specific property
 */
export const hasProperty = <T extends PropertyKey>(
  obj: unknown,
  prop: T,
): obj is Record<T, unknown> => {
  return typeof obj === 'object' && obj !== null && prop in obj
}

/**
 * Safe assertion with runtime validation
 */
export const assertRole = (value: unknown, context = 'Role validation'): Role => {
  if (!isRole(value)) {
    throw new TypeError(`${context}: Expected Role but got ${typeof value}`)
  }
  return value
}

/**
 * Safe assertion with runtime validation for visibility
 */
export const assertVisibility = (value: unknown, context = 'Visibility validation'): Visibility => {
  if (!isVisibility(value)) {
    throw new TypeError(`${context}: Expected Visibility but got ${typeof value}`)
  }
  return value
}

/**
 * Safe error type conversion for controller error handling
 */
export const toErrorWithStatusCode = (
  error: unknown,
  defaultMessage = 'Internal server error',
): Error & { statusCode: number; code?: string; details?: unknown } => {
  if (isErrorWithStatusCode(error)) {
    return error
  }

  const baseError = error instanceof Error ? error : new Error(defaultMessage)
  return Object.assign(baseError, {
    statusCode: 500,
    code: 'INTERNAL_SERVER_ERROR',
    details: error instanceof Error ? undefined : error,
  })
}
