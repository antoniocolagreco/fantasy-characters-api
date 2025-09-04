/**
 * UUID v7 Generation Utility
 *
 * Provides time-ordered UUIDs for better database performance and
 * cursor pagination stability.
 */

/**
 * Generate a UUID v7 (time-ordered)
 * UUIDv7 embeds a 48-bit timestamp for better database performance
 */
export function generateUUIDv7(): string {
    // Get current timestamp in milliseconds
    const timestamp = Date.now()

    // Convert timestamp to 48-bit hex string
    const timestampHex = timestamp.toString(16).padStart(12, '0')

    // Generate 12 random bytes (96 bits)
    const randomBytes: number[] = []
    for (let i = 0; i < 12; i++) {
        randomBytes[i] = Math.floor(Math.random() * 256)
    }

    // Convert random bytes to hex
    const randomHex = randomBytes.map(byte => byte.toString(16).padStart(2, '0')).join('')

    // Construct UUID v7 format: xxxxxxxx-xxxx-7xxx-xxxx-xxxxxxxxxxxx
    // Where the first 48 bits are timestamp, version 7, and variant bits
    const uuid = [
        timestampHex.slice(0, 8),
        timestampHex.slice(8, 12),
        `7${randomHex.slice(0, 3)}`, // Version 7
        ((parseInt(randomHex.slice(3, 4), 16) & 0x3) | 0x8).toString(16) + randomHex.slice(4, 7), // Variant bits
        randomHex.slice(7, 19),
    ].join('-')

    return uuid
}

/**
 * Extract timestamp from UUID v7
 */
export function getTimestampFromUUIDv7(uuid: string): Date {
    // Remove hyphens and extract first 12 hex characters (48 bits)
    const timestampHex = uuid.replace(/-/g, '').slice(0, 12)
    const timestamp = parseInt(timestampHex, 16)
    return new Date(timestamp)
}

/**
 * Validate if string is a valid UUID v7
 */
export function isValidUUIDv7(uuid: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    return uuidRegex.test(uuid)
}
