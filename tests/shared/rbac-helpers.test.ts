import { describe, expect, it } from 'vitest'

import {
    applySecurityFilters,
    canCreateResource,
    canModifyResource,
    canViewResource,
} from '@/shared/utils/rbac.helpers'

describe('RBAC Helpers', () => {
    const mockUser = { id: 'user-1', role: 'USER' as const, email: 'user@test.com' }
    const mockModerator = { id: 'mod-1', role: 'MODERATOR' as const, email: 'mod@test.com' }
    const mockAdmin = { id: 'admin-1', role: 'ADMIN' as const, email: 'admin@test.com' }

    const mockResource = {
        id: 'resource-1',
        ownerId: 'user-1',
        ownerRole: 'USER' as const,
        visibility: 'PUBLIC' as const,
    }

    describe('applySecurityFilters', () => {
        it('allows anonymous users only PUBLIC content', () => {
            const filters = { category: 'test' }
            const result = applySecurityFilters(filters)

            expect(result).toEqual({
                category: 'test',
                visibility: 'PUBLIC',
            })
        })

        it('allows admin users to see everything', () => {
            const filters = { category: 'test' }
            const result = applySecurityFilters(filters, mockAdmin)

            expect(result).toEqual({ category: 'test' })
        })

        it('allows moderators to see PUBLIC, HIDDEN, and own content', () => {
            const filters = { category: 'test' }
            const result = applySecurityFilters(filters, mockModerator)

            expect(result).toMatchObject({
                category: 'test',
                OR: [{ visibility: 'PUBLIC' }, { visibility: 'HIDDEN' }, { ownerId: 'mod-1' }],
            })
        })

        it('allows regular users to see PUBLIC and own content', () => {
            const filters = { category: 'test' }
            const result = applySecurityFilters(filters, mockUser)

            expect(result).toMatchObject({
                category: 'test',
                OR: [{ visibility: 'PUBLIC' }, { ownerId: 'user-1' }],
            })
        })
    })

    describe('canViewResource', () => {
        it('allows anonymous users to view PUBLIC content only', () => {
            expect(canViewResource(undefined, mockResource)).toBe(true)
            expect(canViewResource(undefined, { ...mockResource, visibility: 'PRIVATE' })).toBe(
                false
            )
        })

        it('allows admin to view everything', () => {
            expect(canViewResource(mockAdmin, mockResource)).toBe(true)
            expect(canViewResource(mockAdmin, { ...mockResource, visibility: 'PRIVATE' })).toBe(
                true
            )
        })

        it('allows users to view own content regardless of visibility', () => {
            expect(canViewResource(mockUser, { ...mockResource, visibility: 'PRIVATE' })).toBe(true)
        })
    })

    describe('canModifyResource', () => {
        it('allows owners to modify their own content', () => {
            expect(canModifyResource(mockUser, mockResource)).toBe(true)
        })

        it('allows admin to modify non-admin content', () => {
            expect(canModifyResource(mockAdmin, mockResource)).toBe(true)
            expect(
                canModifyResource(mockAdmin, {
                    ...mockResource,
                    ownerRole: 'ADMIN',
                })
            ).toBe(false)
        })

        it('allows moderators to modify USER content', () => {
            expect(canModifyResource(mockModerator, mockResource)).toBe(true)
            expect(
                canModifyResource(mockModerator, {
                    ...mockResource,
                    ownerRole: 'ADMIN',
                })
            ).toBe(false)
        })
    })

    describe('canCreateResource', () => {
        it('allows authenticated users to create resources', () => {
            expect(canCreateResource(mockUser)).toBe(true)
            expect(canCreateResource(mockModerator)).toBe(true)
            expect(canCreateResource(mockAdmin)).toBe(true)
        })

        it('denies anonymous users from creating resources', () => {
            expect(canCreateResource(undefined)).toBe(false)
        })
    })
})
