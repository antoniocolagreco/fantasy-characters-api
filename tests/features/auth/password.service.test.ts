import { describe, expect, it } from 'vitest'

import { passwordService } from '@/features/auth/password.service'

describe('Password Service', () => {
    describe('hashPassword', () => {
        it('should hash a password', async () => {
            const password = 'test-password-123'
            const hash = await passwordService.hashPassword(password)

            expect(hash).toBeTruthy()
            expect(typeof hash).toBe('string')
            expect(hash).toMatch(/^\$argon2id\$/) // Argon2id format
            expect(hash).not.toBe(password) // Should not be plain text
        })

        it('should generate different hashes for the same password', async () => {
            const password = 'test-password-123'
            const hash1 = await passwordService.hashPassword(password)
            const hash2 = await passwordService.hashPassword(password)

            expect(hash1).not.toBe(hash2) // Hashes should be different due to salt
        })

        it('should handle empty password', async () => {
            const hash = await passwordService.hashPassword('')

            expect(hash).toBeTruthy()
            expect(typeof hash).toBe('string')
            expect(hash).toMatch(/^\$argon2id\$/)
        })
    })

    describe('verifyPassword', () => {
        it('should verify correct password', async () => {
            const password = 'test-password-123'
            const hash = await passwordService.hashPassword(password)
            const isValid = await passwordService.verifyPassword(hash, password)

            expect(isValid).toBe(true)
        })

        it('should reject incorrect password', async () => {
            const password = 'test-password-123'
            const wrongPassword = 'wrong-password'
            const hash = await passwordService.hashPassword(password)
            const isValid = await passwordService.verifyPassword(hash, wrongPassword)

            expect(isValid).toBe(false)
        })

        it('should reject empty password', async () => {
            const password = 'test-password-123'
            const hash = await passwordService.hashPassword(password)
            const isValid = await passwordService.verifyPassword(hash, '')

            expect(isValid).toBe(false)
        })

        it('should handle invalid hash gracefully', async () => {
            const password = 'test-password-123'
            const invalidHash = 'invalid-hash'
            const isValid = await passwordService.verifyPassword(invalidHash, password)

            expect(isValid).toBe(false)
        })

        it('should handle empty hash gracefully', async () => {
            const password = 'test-password-123'
            const isValid = await passwordService.verifyPassword('', password)

            expect(isValid).toBe(false)
        })
    })

    describe('needsRehash', () => {
        it('should not need rehash for fresh hash', async () => {
            const password = 'test-password-123'
            const hash = await passwordService.hashPassword(password)
            const shouldRehash = passwordService.needsRehash(hash)

            expect(shouldRehash).toBe(false)
        })

        it('should need rehash for invalid hash', () => {
            const invalidHash = 'invalid-hash'
            const shouldRehash = passwordService.needsRehash(invalidHash)

            expect(shouldRehash).toBe(true)
        })

        it('should need rehash for empty hash', () => {
            const shouldRehash = passwordService.needsRehash('')

            expect(shouldRehash).toBe(true)
        })

        it('should need rehash for malformed hash', () => {
            const malformedHash = 'definitely-not-argon2'
            const shouldRehash = passwordService.needsRehash(malformedHash)

            expect(shouldRehash).toBe(true)
        })
    })
})
