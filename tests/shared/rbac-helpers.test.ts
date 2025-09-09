import { describe, expect, it } from 'vitest'

import { generateUUIDv7 } from '@/shared/utils'
import {
    applySecurityFilters,
    applyUserSecurityFilters,
    canCreateResource,
    canManageUser,
    canModifyResource,
    canViewResource,
} from '@/shared/utils/rbac.helpers'

describe('RBAC Helpers', () => {
    const mockUserId = generateUUIDv7()
    const mockModeratorId = generateUUIDv7()
    const mockAdminId = generateUUIDv7()
    const mockResourceId = generateUUIDv7()

    const mockUser = { id: mockUserId, role: 'USER' as const, email: 'user@test.com' }
    const mockModerator = { id: mockModeratorId, role: 'MODERATOR' as const, email: 'mod@test.com' }
    const mockAdmin = { id: mockAdminId, role: 'ADMIN' as const, email: 'admin@test.com' }

    const mockResource = {
        id: mockResourceId,
        ownerId: mockUserId,
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

        it('allows moderators to see PUBLIC, PRIVATE, HIDDEN, and own content', () => {
            const filters = { category: 'test' }
            const result = applySecurityFilters(filters, mockModerator)

            expect(result).toMatchObject({
                category: 'test',
                OR: [
                    { visibility: 'PUBLIC' },
                    { visibility: 'PRIVATE' },
                    { visibility: 'HIDDEN' },
                    { ownerId: mockModeratorId },
                ],
            })
        })

        it('allows regular users to see PUBLIC and own content', () => {
            const filters = { category: 'test' }
            const result = applySecurityFilters(filters, mockUser)

            expect(result).toMatchObject({
                category: 'test',
                OR: [{ visibility: 'PUBLIC' }, { ownerId: mockUserId }],
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

        it('allows users to create resources for themselves', () => {
            expect(canCreateResource(mockUser, mockUser.id)).toBe(true)
            expect(canCreateResource(mockModerator, mockModerator.id)).toBe(true)
            expect(canCreateResource(mockAdmin, mockAdmin.id)).toBe(true)
        })

        it('allows admin to create resources for anyone', () => {
            expect(canCreateResource(mockAdmin, 'other-user-id')).toBe(true)
        })

        it('denies regular users from creating resources for others', () => {
            expect(canCreateResource(mockUser, 'other-user-id')).toBe(false)
        })

        it('allows moderator to create orphaned resources', () => {
            expect(canCreateResource(mockModerator, undefined)).toBe(true)
        })
    })

    describe('applySecurityFilters edge cases', () => {
        it('handles existing OR conditions for anonymous users', () => {
            const filters = { OR: [{ category: 'test1' }, { category: 'test2' }] }
            const result = applySecurityFilters(filters)

            expect(result).toEqual({
                AND: [
                    { OR: [{ category: 'test1' }, { category: 'test2' }] },
                    { visibility: 'PUBLIC' },
                ],
            })
        })

        it('handles existing OR conditions for moderators (including PRIVATE)', () => {
            const filters = { OR: [{ category: 'test1' }, { category: 'test2' }] }
            const result = applySecurityFilters(filters, mockModerator)

            expect(result).toEqual({
                AND: [
                    { OR: [{ category: 'test1' }, { category: 'test2' }] },
                    {
                        OR: [
                            { visibility: 'PUBLIC' },
                            { visibility: 'PRIVATE' },
                            { visibility: 'HIDDEN' },
                            { ownerId: mockModeratorId },
                        ],
                    },
                ],
            })
        })

        it('handles existing OR conditions for regular users', () => {
            const filters = { OR: [{ category: 'test1' }, { category: 'test2' }] }
            const result = applySecurityFilters(filters, mockUser)

            expect(result).toEqual({
                AND: [
                    { OR: [{ category: 'test1' }, { category: 'test2' }] },
                    { OR: [{ visibility: 'PUBLIC' }, { ownerId: mockUserId }] },
                ],
            })
        })
    })

    describe('canModifyResource edge cases', () => {
        it('allows admin to modify own admin content', () => {
            const adminResource = {
                ownerId: mockAdmin.id,
                ownerRole: 'ADMIN' as const,
            }
            expect(canModifyResource(mockAdmin, adminResource)).toBe(true)
        })

        it('denies admin from modifying other admin content', () => {
            const otherAdminResource = {
                ownerId: 'other-admin-id',
                ownerRole: 'ADMIN' as const,
            }
            expect(canModifyResource(mockAdmin, otherAdminResource)).toBe(false)
        })

        it('allows moderator to modify orphaned content', () => {
            const orphanedResource = {
                ownerId: null,
                ownerRole: null,
            }
            expect(canModifyResource(mockModerator, orphanedResource)).toBe(true)
        })

        it('denies modification for undefined user', () => {
            expect(canModifyResource(undefined, mockResource)).toBe(false)
        })
    })

    describe('canViewResource edge cases', () => {
        it('allows moderator to view HIDDEN content', () => {
            const hiddenResource = { ...mockResource, visibility: 'HIDDEN' }
            expect(canViewResource(mockModerator, hiddenResource)).toBe(true)
        })

        it('denies regular user access to PRIVATE content', () => {
            const privateResource = {
                ...mockResource,
                visibility: 'PRIVATE',
                ownerId: 'other-user',
            }
            expect(canViewResource(mockUser, privateResource)).toBe(false)
        })

        it('denies regular user access to HIDDEN content', () => {
            const hiddenResource = { ...mockResource, visibility: 'HIDDEN', ownerId: 'other-user' }
            expect(canViewResource(mockUser, hiddenResource)).toBe(false)
        })
    })

    describe('applyUserSecurityFilters', () => {
        it('denies anonymous users access to any users', () => {
            const filters = { role: 'USER' }
            const result = applyUserSecurityFilters(filters)

            expect(result).toEqual({
                role: 'USER',
                id: '00000000-0000-0000-0000-000000000000',
            })
        })

        it('allows admin to see all users', () => {
            const filters = { role: 'USER' }
            const result = applyUserSecurityFilters(filters, mockAdmin)

            expect(result).toEqual({ role: 'USER' })
        })

        it('allows moderator to see USERs and themselves', () => {
            const filters = { isActive: true }
            const result = applyUserSecurityFilters(filters, mockModerator)

            expect(result).toEqual({
                isActive: true,
                OR: [{ role: 'USER' }, { id: mockModeratorId }],
            })
        })

        it('allows regular user to see only themselves', () => {
            const filters = { isActive: true }
            const result = applyUserSecurityFilters(filters, mockUser)

            expect(result).toEqual({
                isActive: true,
                id: mockUserId,
            })
        })
    })

    describe('canManageUser', () => {
        const targetUserId = generateUUIDv7()
        const targetModeratorId = generateUUIDv7()
        const targetAdminId = generateUUIDv7()

        const targetUser = { id: targetUserId, role: 'USER' as const }
        const targetModerator = { id: targetModeratorId, role: 'MODERATOR' as const }
        const targetAdmin = { id: targetAdminId, role: 'ADMIN' as const }

        it('denies anonymous users from managing anyone', () => {
            expect(canManageUser(undefined, targetUser)).toBe(false)
        })

        it('denies users from managing themselves', () => {
            expect(canManageUser(mockUser, { id: mockUser.id, role: 'USER' })).toBe(false)
            expect(canManageUser(mockModerator, { id: mockModerator.id, role: 'MODERATOR' })).toBe(
                false
            )
            expect(canManageUser(mockAdmin, { id: mockAdmin.id, role: 'ADMIN' })).toBe(false)
        })

        it('allows admin to manage non-admin users', () => {
            expect(canManageUser(mockAdmin, targetUser)).toBe(true)
            expect(canManageUser(mockAdmin, targetModerator)).toBe(true)
        })

        it('denies admin from managing other admins', () => {
            expect(canManageUser(mockAdmin, targetAdmin)).toBe(false)
        })

        it('allows moderator to manage only regular users', () => {
            expect(canManageUser(mockModerator, targetUser)).toBe(true)
        })

        it('denies moderator from managing other moderators', () => {
            expect(canManageUser(mockModerator, targetModerator)).toBe(false)
        })

        it('denies moderator from managing admins', () => {
            expect(canManageUser(mockModerator, targetAdmin)).toBe(false)
        })

        it('denies regular users from managing anyone', () => {
            expect(canManageUser(mockUser, targetUser)).toBe(false)
            expect(canManageUser(mockUser, targetModerator)).toBe(false)
            expect(canManageUser(mockUser, targetAdmin)).toBe(false)
        })
    })
})
