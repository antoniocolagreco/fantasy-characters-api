import { describe, it, expect } from 'vitest'
import {
    generateUUIDv7,
    isValidUUID,
    extractTimestampFromUUIDv7,
} from '../../../src/shared/utils/uuid'

describe('UUID v7 Utility', () => {
    describe('generateUUIDv7', () => {
        it('should generate a valid UUID v7', () => {
            const uuid = generateUUIDv7()
            expect(uuid).toMatch(
                /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
            )
        })

        it('should generate unique UUIDs', () => {
            const uuid1 = generateUUIDv7()
            const uuid2 = generateUUIDv7()
            expect(uuid1).not.toBe(uuid2)
        })

        it('should generate time-ordered UUIDs', async () => {
            const uuid1 = generateUUIDv7()
            // Wait a bit to ensure different timestamps
            await new Promise<void>(resolve => globalThis.setTimeout(resolve, 1))
            const uuid2 = generateUUIDv7()

            // UUIDs should be lexicographically ordered by time
            expect(uuid1 < uuid2).toBe(true)
        })
    })

    describe('isValidUUID', () => {
        it('should validate UUID v7 format', () => {
            const uuid = generateUUIDv7()
            expect(isValidUUID(uuid)).toBe(true)
        })

        it('should validate standard UUID formats', () => {
            expect(isValidUUID('123e4567-e89b-12d3-a456-426614174000')).toBe(true)
            expect(isValidUUID('01234567-89ab-1def-8123-456789abcdef')).toBe(true)
        })

        it('should reject invalid formats', () => {
            expect(isValidUUID('')).toBe(false)
            expect(isValidUUID('invalid')).toBe(false)
            expect(isValidUUID('123e4567-e89b-12d3-a456')).toBe(false)
            expect(isValidUUID('123e4567-e89b-12d3-a456-426614174000-extra')).toBe(false)
        })
    })

    describe('extractTimestampFromUUIDv7', () => {
        it('should extract timestamp from UUID v7', () => {
            const beforeGeneration = new Date()
            const uuid = generateUUIDv7()
            const afterGeneration = new Date()

            const extractedTimestamp = extractTimestampFromUUIDv7(uuid)
            expect(extractedTimestamp).toBeInstanceOf(Date)
            expect(extractedTimestamp!.getTime()).toBeGreaterThanOrEqual(beforeGeneration.getTime())
            expect(extractedTimestamp!.getTime()).toBeLessThanOrEqual(afterGeneration.getTime())
        })

        it('should return null for invalid UUIDs', () => {
            expect(extractTimestampFromUUIDv7('')).toBeNull()
            expect(extractTimestampFromUUIDv7('invalid')).toBeNull()
            expect(extractTimestampFromUUIDv7('not-a-uuid')).toBeNull()
        })

        it('should handle edge cases gracefully', () => {
            // This UUID has version 0, which should still be valid format-wise
            // but may not extract a meaningful timestamp
            expect(
                extractTimestampFromUUIDv7('00000000-0000-0000-8000-000000000000')
            ).toBeInstanceOf(Date)
        })
    })
})
