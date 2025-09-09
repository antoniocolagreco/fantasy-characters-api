/**
 * UUID v7 Generation Utility
 *
 * Provides time-ordered UUIDs for better database performance and
 * cursor pagination stability.
 */

import { randomBytes as nodeRandomBytes } from 'node:crypto'

let lastTimestampMs = 0
let sequence = 0 // 12-bit monotonic counter for same-ms generations

/**
 * Generate a UUID v7 (time-ordered, monotonic within the same millisecond)
 * UUIDv7 embeds a 48-bit timestamp for better DB performance. We also use a
 * 12-bit sequence as the high random nibble block (rand_a) to guarantee
 * lexicographic monotonicity when multiple UUIDs are generated within the
 * same millisecond.
 */
export function generateUUIDv7(): string {
    const timestamp = Date.now()
    if (timestamp === lastTimestampMs) {
        sequence = (sequence + 1) & 0xfff // 12-bit wraparound
    } else {
        lastTimestampMs = timestamp
        sequence = 0
    }

    // 48-bit timestamp to hex (12 chars)
    const tsHex = timestamp.toString(16).padStart(12, '0')

    // Random payload: we need 10.5 bytes after the version nibble and variant nibble
    // Easiest: generate 12 bytes and then splice as needed.
    const rnd = nodeRandomBytes(12)
    const rndHex = Array.from(rnd)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('')

    // Build the 3 hex chars for rand_a from the sequence
    const randA = sequence.toString(16).padStart(3, '0')

    // Variant nibble (10xx binary) -> 8..b
    const variantNibble = ((parseInt(rndHex.slice(3, 4), 16) & 0x3) | 0x8).toString(16)

    // Assemble: time_hi (8) - time_mid (4) - version(1)+rand_a(3) - variant(1)+rand_b(3) - rand_c(12)
    const uuid = [
        tsHex.slice(0, 8),
        tsHex.slice(8, 12),
        `7${randA}`,
        `${variantNibble}${rndHex.slice(4, 7)}`,
        rndHex.slice(7, 19),
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
