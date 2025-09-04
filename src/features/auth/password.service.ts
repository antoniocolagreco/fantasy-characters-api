import * as argon2 from 'argon2'
import { err } from '../../shared/errors'

const ARGON2_OPTIONS: argon2.Options = {
    type: argon2.argon2id,
    memoryCost: 2 ** 16, // 64 MB
    timeCost: 3,
    parallelism: 1,
}

/**
 * Hash a password using Argon2id
 */
export async function hashPassword(password: string): Promise<string> {
    try {
        return await argon2.hash(password, ARGON2_OPTIONS)
    } catch {
        throw err('INTERNAL_SERVER_ERROR', 'Failed to hash password')
    }
}

/**
 * Verify a password against its hash
 */
export async function verifyPassword(hash: string, password: string): Promise<boolean> {
    try {
        return await argon2.verify(hash, password)
    } catch {
        // Don't leak information about why verification failed
        return false
    }
}

/**
 * Check if a hash needs to be rehashed (e.g., if options changed)
 */
export function needsRehash(hash: string): boolean {
    try {
        return argon2.needsRehash(hash, ARGON2_OPTIONS)
    } catch {
        // If we can't parse the hash, it definitely needs rehashing
        return true
    }
}
