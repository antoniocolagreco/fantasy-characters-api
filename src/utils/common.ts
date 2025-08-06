/**
 * Common Utilities for Fantasy Character API
 *
 * This module provides general-purpose utility functions
 */

/**
 * Generate a random string of specified length
 */
export function generateRandomString(length: number): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let result = ''
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
}

/**
 * Check if value is null or undefined
 */
export function isNullOrUndefined(value: unknown): value is null | undefined {
    return value === null || value === undefined
}

/**
 * Check if value is a valid object (not null, not array)
 */
export function isValidObject(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/**
 * Capitalize first letter of a string
 */
export function capitalize(str: string): string {
    if (!str) return str
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

/**
 * Convert string to kebab-case
 */
export function toKebabCase(str: string): string {
    return str.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2').toLowerCase()
}

/**
 * Convert string to camelCase
 */
export function toCamelCase(str: string): string {
    return str.replace(/-([a-z])/g, (g) => g[1].toUpperCase())
}

/**
 * Remove undefined properties from an object
 */
export function removeUndefined<T extends Record<string, unknown>>(obj: T): Partial<T> {
    const result: Partial<T> = {}
    for (const key in obj) {
        if (obj[key] !== undefined) {
            result[key] = obj[key]
        }
    }
    return result
}

/**
 * Pick specific properties from an object
 */
export function pick<T extends Record<string, unknown>, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> {
    const result: Partial<Pick<T, K>> = {}
    for (const key of keys) {
        if (key in obj) {
            result[key] = obj[key]
        }
    }
    return result as Pick<T, K>
}

/**
 * Omit specific properties from an object
 */
export function omit<T extends Record<string, unknown>, K extends keyof T>(obj: T, keys: K[]): Omit<T, K> {
    const result = { ...obj }
    for (const key of keys) {
        delete result[key]
    }
    return result
}
