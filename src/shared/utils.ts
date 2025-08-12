/**
 * Shared utility functions
 * Pure functions for common operations
 */

import { VALIDATION, PAGINATION } from './constants.js'

// Type helpers
export type Nullable<T> = T | null
export type Optional<T> = T | undefined

// String utilities
export const isValidEmail = (email: string): boolean => {
  return VALIDATION.EMAIL_REGEX.test(email)
}

export const isValidUuid = (uuid: string): boolean => {
  return VALIDATION.UUID_REGEX.test(uuid)
}

export const sanitizeString = (input: string): string => {
  return input.trim().replace(/\s+/g, ' ')
}

export const truncateString = (input: string, maxLength: number): string => {
  return input.length > maxLength ? `${input.slice(0, maxLength - 3)}...` : input
}

export const slugify = (input: string): string => {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

// Number utilities
export const clamp = (value: number, min: number, max: number): number => {
  return Math.min(Math.max(value, min), max)
}

export const isPositiveInteger = (value: number): boolean => {
  return Number.isInteger(value) && value > 0
}

export const roundToDecimals = (value: number, decimals: number): number => {
  return parseFloat(value.toFixed(decimals))
}

// Array utilities
export const removeDuplicates = <T>(array: T[]): T[] => {
  return [...new Set(array)]
}

export const chunk = <T>(array: T[], size: number): T[][] => {
  return array.reduce<T[][]>((chunks, item, index) => {
    const chunkIndex = Math.floor(index / size)
    if (!chunks[chunkIndex]) {
      chunks[chunkIndex] = []
    }
    chunks[chunkIndex].push(item)
    return chunks
  }, [])
}

export const shuffle = <T>(array: T[]): T[] => {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

// Object utilities
export const pick = <T extends Record<string, unknown>, K extends keyof T>(
  object: T,
  keys: K[],
): Pick<T, K> => {
  const result = {} as Pick<T, K>
  for (const key of keys) {
    if (key in object) {
      result[key] = object[key]
    }
  }
  return result
}

export const omit = <T, K extends keyof T>(object: T, keys: K[]): Omit<T, K> => {
  const result = { ...object }
  for (const key of keys) {
    delete result[key]
  }
  return result
}

export const isEmpty = (value: unknown): boolean => {
  if (value === null || value === undefined) return true
  if (typeof value === 'string') return value.length === 0
  if (Array.isArray(value)) return value.length === 0
  if (typeof value === 'object') return Object.keys(value).length === 0
  return false
}

// Date utilities
export const formatDate = (date: Date): string => {
  return date.toISOString()
}

export const addDays = (date: Date, days: number): Date => {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

export const getDaysBetween = (date1: Date, date2: Date): number => {
  const diffTime = Math.abs(date2.getTime() - date1.getTime())
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

// Pagination utilities
export const validatePagination = (page?: number, limit?: number) => {
  const validatedPage = Math.max(page || PAGINATION.DEFAULT_PAGE, PAGINATION.DEFAULT_PAGE)
  const validatedLimit = clamp(
    limit || PAGINATION.DEFAULT_LIMIT,
    PAGINATION.MIN_LIMIT,
    PAGINATION.MAX_LIMIT,
  )

  return {
    page: validatedPage,
    limit: validatedLimit,
    offset: (validatedPage - 1) * validatedLimit,
  }
}

export const calculateTotalPages = (totalCount: number, limit: number): number => {
  return Math.ceil(totalCount / limit)
}

// Async utilities
export const delay = (ms: number): Promise<void> => {
  return new Promise(resolve => globalThis.setTimeout(resolve, ms))
}

export const timeout = <T>(promise: Promise<T>, ms: number): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      globalThis.setTimeout(() => reject(new Error('Timeout')), ms),
    ),
  ])
}

// Retry function with exponential backoff
export const retry = async <T>(
  fn: () => Promise<T>,
  maxAttempts = 3,
  baseDelay = 1000,
): Promise<T> => {
  let lastError: Error | undefined

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error as Error
      if (attempt === maxAttempts) break

      const delayMs = baseDelay * Math.pow(2, attempt - 1)
      await delay(delayMs)
    }
  }

  throw lastError || new Error('Retry failed with unknown error')
}

// Environment utilities
export const isDevelopment = (): boolean => {
  return process.env.NODE_ENV === 'development'
}

export const isProduction = (): boolean => {
  return process.env.NODE_ENV === 'production'
}

export const isTest = (): boolean => {
  return process.env.NODE_ENV === 'test'
}

// Random utilities
export const generateRandomString = (length: number): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

export const generateUuid = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

// Password utilities (for future authentication chapter)
export const isValidPassword = (password: string): boolean => {
  return (
    password.length >= VALIDATION.PASSWORD_MIN_LENGTH &&
    password.length <= VALIDATION.PASSWORD_MAX_LENGTH
  )
}

// Type assertion utilities
export const assertNever = (value: never): never => {
  throw new Error(`Unexpected value: ${value}`)
}

export const isString = (value: unknown): value is string => {
  return typeof value === 'string'
}

export const isNumber = (value: unknown): value is number => {
  return typeof value === 'number' && !isNaN(value)
}

export const isBoolean = (value: unknown): value is boolean => {
  return typeof value === 'boolean'
}

export const isObject = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
