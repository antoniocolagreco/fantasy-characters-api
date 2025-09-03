import { describe, it, expect } from 'vitest'
import { can, userCan } from '../../../src/features/auth/rbac.policy'
import type { RbacContext } from '../../../src/features/auth/rbac.schema'

describe('RBAC Policy', () => {
    describe('Anonymous users', () => {
        it('should allow reading PUBLIC content', () => {
            const context: RbacContext = {
                resource: 'characters',
                action: 'read',
                visibility: 'PUBLIC',
            }

            expect(can(context)).toBe(true)
        })

        it('should deny reading PRIVATE content', () => {
            const context: RbacContext = {
                resource: 'characters',
                action: 'read',
                visibility: 'PRIVATE',
            }

            expect(can(context)).toBe(false)
        })

        it('should deny reading HIDDEN content', () => {
            const context: RbacContext = {
                resource: 'characters',
                action: 'read',
                visibility: 'HIDDEN',
            }

            expect(can(context)).toBe(false)
        })

        it('should deny all non-read actions', () => {
            const actions = ['create', 'update', 'delete', 'manage'] as const

            actions.forEach(action => {
                const context: RbacContext = {
                    resource: 'characters',
                    action,
                    visibility: 'PUBLIC',
                }

                expect(can(context)).toBe(false)
            })
        })
    })

    describe('ADMIN users', () => {
        const admin = { id: 'admin-1', role: 'ADMIN' as const }

        it('should allow all actions on all resources', () => {
            const actions = ['read', 'create', 'update', 'delete'] as const
            const resources = ['characters', 'users', 'images'] as const

            actions.forEach(action => {
                resources.forEach(resource => {
                    const context: RbacContext = {
                        user: admin,
                        resource,
                        action,
                        visibility: 'PRIVATE',
                        ownerId: 'other-user',
                        ownerRole: 'USER',
                    }

                    expect(can(context)).toBe(true)
                })
            })
        })

        it('should not allow modifying other ADMIN accounts', () => {
            const actions = ['update', 'delete', 'manage'] as const

            actions.forEach(action => {
                const context: RbacContext = {
                    user: admin,
                    resource: 'users',
                    action,
                    ownerId: 'other-admin',
                    targetUserRole: 'ADMIN',
                }

                expect(can(context)).toBe(false)
            })
        })

        it('should allow modifying own ADMIN account', () => {
            const actions = ['update', 'delete'] as const

            actions.forEach(action => {
                const context: RbacContext = {
                    user: admin,
                    resource: 'users',
                    action,
                    ownerId: admin.id,
                    targetUserRole: 'ADMIN',
                }

                expect(can(context)).toBe(true)
            })
        })

        it('should not allow managing own role', () => {
            const context: RbacContext = {
                user: admin,
                resource: 'users',
                action: 'manage',
                ownerId: admin.id,
                targetUserRole: 'ADMIN',
            }

            // According to the RBAC spec, even admins cannot manage their own role
            // The system prevents role escalation and self-role modification
            expect(can(context)).toBe(false) // No role changes allowed, even on own account
        })

        it('should allow managing USER and MODERATOR accounts', () => {
            const targetRoles = ['USER', 'MODERATOR'] as const

            targetRoles.forEach(targetUserRole => {
                const context: RbacContext = {
                    user: admin,
                    resource: 'users',
                    action: 'manage',
                    ownerId: 'other-user',
                    targetUserRole,
                }

                expect(can(context)).toBe(true)
            })
        })
    })

    describe('MODERATOR users', () => {
        const moderator = { id: 'mod-1', role: 'MODERATOR' as const }

        it('should allow reading any content', () => {
            const visibilities = ['PUBLIC', 'PRIVATE', 'HIDDEN'] as const

            visibilities.forEach(visibility => {
                const context: RbacContext = {
                    user: moderator,
                    resource: 'characters',
                    action: 'read',
                    visibility,
                    ownerId: 'other-user',
                }

                expect(can(context)).toBe(true)
            })
        })

        it('should allow updating/deleting USER-owned content', () => {
            const actions = ['update', 'delete'] as const

            actions.forEach(action => {
                const context: RbacContext = {
                    user: moderator,
                    resource: 'characters',
                    action,
                    ownerId: 'user-1',
                    ownerRole: 'USER',
                }

                expect(can(context)).toBe(true)
            })
        })

        it('should allow updating/deleting orphaned content', () => {
            const actions = ['update', 'delete'] as const

            actions.forEach(action => {
                const context: RbacContext = {
                    user: moderator,
                    resource: 'characters',
                    action,
                    ownerId: null,
                }

                expect(can(context)).toBe(true)
            })
        })

        it('should not allow updating/deleting MODERATOR-owned content', () => {
            const actions = ['update', 'delete'] as const

            actions.forEach(action => {
                const context: RbacContext = {
                    user: moderator,
                    resource: 'characters',
                    action,
                    ownerId: 'other-mod',
                    ownerRole: 'MODERATOR',
                }

                expect(can(context)).toBe(false)
            })
        })

        it('should not allow updating/deleting ADMIN-owned content', () => {
            const actions = ['update', 'delete'] as const

            actions.forEach(action => {
                const context: RbacContext = {
                    user: moderator,
                    resource: 'characters',
                    action,
                    ownerId: 'admin-1',
                    ownerRole: 'ADMIN',
                }

                expect(can(context)).toBe(false)
            })
        })

        it('should allow managing USER accounts only', () => {
            const context: RbacContext = {
                user: moderator,
                resource: 'users',
                action: 'manage',
                ownerId: 'user-1',
                targetUserRole: 'USER',
            }

            expect(can(context)).toBe(true)
        })

        it('should not allow managing MODERATOR accounts', () => {
            const context: RbacContext = {
                user: moderator,
                resource: 'users',
                action: 'manage',
                ownerId: 'other-mod',
                targetUserRole: 'MODERATOR',
            }

            expect(can(context)).toBe(false)
        })

        it('should not allow managing ADMIN accounts', () => {
            const context: RbacContext = {
                user: moderator,
                resource: 'users',
                action: 'manage',
                ownerId: 'admin-1',
                targetUserRole: 'ADMIN',
            }

            expect(can(context)).toBe(false)
        })
    })

    describe('USER permissions', () => {
        const user = { id: 'user-1', role: 'USER' as const }

        it('should allow reading PUBLIC content', () => {
            const context: RbacContext = {
                user,
                resource: 'characters',
                action: 'read',
                visibility: 'PUBLIC',
                ownerId: 'other-user',
            }

            expect(can(context)).toBe(true)
        })

        it('should not allow reading PRIVATE content of others', () => {
            const context: RbacContext = {
                user,
                resource: 'characters',
                action: 'read',
                visibility: 'PRIVATE',
                ownerId: 'other-user',
            }

            expect(can(context)).toBe(false)
        })

        it('should allow all actions on own content', () => {
            const actions = ['read', 'create', 'update', 'delete'] as const

            actions.forEach(action => {
                const context: RbacContext = {
                    user,
                    resource: 'characters',
                    action,
                    ownerId: user.id,
                    visibility: 'PRIVATE',
                }

                expect(can(context)).toBe(true)
            })
        })

        it('should not allow manage action on own user account', () => {
            const context: RbacContext = {
                user,
                resource: 'users',
                action: 'manage',
                ownerId: user.id,
            }

            expect(can(context)).toBe(false)
        })

        it('should not allow modifying others content', () => {
            const actions = ['create', 'update', 'delete'] as const

            actions.forEach(action => {
                const context: RbacContext = {
                    user,
                    resource: 'characters',
                    action,
                    ownerId: 'other-user',
                    visibility: 'PUBLIC',
                }

                expect(can(context)).toBe(false)
            })
        })
    })

    describe('Ownership rules', () => {
        const user = { id: 'user-1', role: 'USER' as const }

        it('should recognize user as owner when IDs match', () => {
            const context: RbacContext = {
                user,
                resource: 'characters',
                action: 'update',
                ownerId: user.id,
            }

            expect(can(context)).toBe(true)
        })

        it('should not recognize user as owner when IDs differ', () => {
            const context: RbacContext = {
                user,
                resource: 'characters',
                action: 'update',
                ownerId: 'other-user',
            }

            expect(can(context)).toBe(false)
        })

        it('should handle null ownerId (orphaned content)', () => {
            const context: RbacContext = {
                user,
                resource: 'characters',
                action: 'update',
                ownerId: null,
            }

            expect(can(context)).toBe(false) // Regular users cannot modify orphaned content
        })
    })

    describe('userCan convenience function', () => {
        it('should work with basic parameters', () => {
            const user = { id: 'user-1', role: 'USER' as const }

            const result = userCan(user, 'read', 'characters', {
                visibility: 'PUBLIC',
            })

            expect(result).toBe(true)
        })

        it('should work with undefined user', () => {
            const result = userCan(undefined, 'read', 'characters', {
                visibility: 'PUBLIC',
            })

            expect(result).toBe(true)
        })

        it('should handle undefined ownerId correctly', () => {
            const user = { id: 'user-1', role: 'USER' as const }

            const result = userCan(user, 'update', 'characters', {
                visibility: 'PUBLIC',
            })

            expect(result).toBe(false) // Should treat as no owner
        })
    })
})
