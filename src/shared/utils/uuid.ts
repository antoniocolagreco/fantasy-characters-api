/**
 * UUID v7 Generation Utility
 *
 * Provides time-ordered UUIDs for better database performance and
 * cursor pagination stability.
 */

import { uuidv7 } from 'uuidv7'

/**
 * Generate a new UUID v7
 *
 * UUID v7 benefits:
 * - Time-ordered (monotonic) for better index locality
 * - Stable cursor pagination
 * - Better database performance than random UUIDs
 *
 * @returns A new UUID v7 string
 */
export function generateUUIDv7(): string {
    return uuidv7()
}

/**
 * Validate if a string is a valid UUID format
 *
 * @param value - String to validate
 * @returns True if valid UUID format
 */
export function isValidUUID(value: string): boolean {
    const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    return uuidRegex.test(value)
}

/**
 * Extract timestamp from UUID v7
 *
 * @param uuid - UUID v7 string
 * @returns Date object or null if invalid
 */
export function extractTimestampFromUUIDv7(uuid: string): Date | null {
    if (!isValidUUID(uuid)) return null

    try {
        // Extract first 48 bits (timestamp in milliseconds)
        const hex = uuid.replace(/-/g, '').substring(0, 12)
        const timestamp = parseInt(hex, 16)
        return new Date(timestamp)
    } catch {
        return null
    }
}
