import { describe, expect, it } from 'vitest'

import { generateUUIDv7, getTimestampFromUUIDv7, isValidUUIDv7 } from '@/shared/utils/uuid'

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

    describe('isValidUUIDv7', () => {
        it('should validate UUID v7 format', () => {
            const uuid = generateUUIDv7()
            expect(isValidUUIDv7(uuid)).toBe(true)
        })

        it('should validate standard UUID formats', () => {
            // These are not UUID v7 format, so they should return false
            expect(isValidUUIDv7('123e4567-e89b-12d3-a456-426614174000')).toBe(false) // UUID v1
            expect(isValidUUIDv7('01234567-89ab-1def-8123-456789abcdef')).toBe(false) // UUID v1

            // But these UUID v7 examples should return true
            expect(isValidUUIDv7('01890a5d-ac96-774b-b5eb-63b79d4b5c1a')).toBe(true) // Valid UUID v7
            expect(isValidUUIDv7('01890a5d-ac96-7000-8000-000000000000')).toBe(true) // Valid UUID v7
        })

        it('should reject invalid formats', () => {
            expect(isValidUUIDv7('')).toBe(false)
            expect(isValidUUIDv7('invalid')).toBe(false)
            expect(isValidUUIDv7('123e4567-e89b-12d3-a456')).toBe(false)
            expect(isValidUUIDv7('123e4567-e89b-12d3-a456-426614174000-extra')).toBe(false)
        })
    })

    describe('getTimestampFromUUIDv7', () => {
        it('should extract timestamp from UUID v7', () => {
            const beforeGeneration = new Date()
            const uuid = generateUUIDv7()
            const afterGeneration = new Date()

            const extractedTimestamp = getTimestampFromUUIDv7(uuid)
            expect(extractedTimestamp).toBeInstanceOf(Date)
            expect(extractedTimestamp.getTime()).toBeGreaterThanOrEqual(beforeGeneration.getTime())
            expect(extractedTimestamp.getTime()).toBeLessThanOrEqual(afterGeneration.getTime())
        })

        it('should handle invalid UUIDs gracefully', () => {
            // These should return a Date object even for invalid input
            // (the actual validation should be done with isValidUUIDv7)
            expect(getTimestampFromUUIDv7('00000000-0000-0000-8000-000000000000')).toBeInstanceOf(
                Date
            )
        })
    })
})
