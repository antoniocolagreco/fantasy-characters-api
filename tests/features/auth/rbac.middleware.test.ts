import type { FastifyReply, FastifyRequest } from 'fastify'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
    createRbacMiddleware,
    rbac,
    resolveOwnership,
} from '../../../src/features/auth/rbac.middleware'
import { can } from '../../../src/features/auth/rbac.policy'

// Mock the RBAC policy
vi.mock('../../../src/features/auth/rbac.policy')
const mockCan = vi.mocked(can)

// Define proper types for our mocks
interface MockRequest {
    params: { id?: string }
    body: any
    user: { id: string; role: string } | undefined
    prisma: any
    routeOptions: any
}

interface MockReply {
    code: (statusCode: number) => MockReply
    send: (payload: any) => MockReply
    header: (name: string, value: string) => MockReply
}

// Mock Prisma client
const mockPrismaClient = {
    character: { findUnique: vi.fn() },
    user: { findUnique: vi.fn() },
    image: { findUnique: vi.fn() },
    tag: { findUnique: vi.fn() },
    skill: { findUnique: vi.fn() },
    perk: { findUnique: vi.fn() },
    race: { findUnique: vi.fn() },
    archetype: { findUnique: vi.fn() },
    item: { findUnique: vi.fn() },
}

describe('RBAC Middleware', () => {
    let mockRequest: MockRequest
    let mockReply: MockReply

    beforeEach(() => {
        mockRequest = {
            params: { id: 'test-id' },
            body: {},
            user: { id: 'user-123', role: 'USER' },
            prisma: mockPrismaClient,
            routeOptions: {},
        }

        mockReply = {
            code: vi.fn().mockReturnThis(),
            send: vi.fn().mockReturnThis(),
            header: vi.fn().mockReturnThis(),
        }

        vi.clearAllMocks()
    })

    afterEach(() => {
        vi.clearAllMocks()
        delete process.env.RBAC_ENABLED
    })

    describe('resolveOwnership', () => {
        it('should resolve character ownership correctly', async () => {
            const mockCharacter = {
                ownerId: 'owner-123',
                visibility: 'PUBLIC',
                owner: { role: 'USER' },
            }

            mockPrismaClient.character.findUnique.mockResolvedValue(mockCharacter)

            const result = await resolveOwnership(mockRequest as FastifyRequest, 'characters')

            expect(result).toEqual({
                ownerId: 'owner-123',
                visibility: 'PUBLIC',
                ownerRole: 'USER',
            })
        })

        it('should resolve user ownership correctly', async () => {
            const mockUser = {
                id: 'user-456',
                role: 'MODERATOR',
            }

            mockPrismaClient.user.findUnique.mockResolvedValue(mockUser)

            const result = await resolveOwnership(mockRequest as FastifyRequest, 'users')

            expect(result).toEqual({
                ownerId: 'user-456',
                targetUserRole: 'MODERATOR',
            })
        })

        it('should handle database query errors gracefully', async () => {
            mockPrismaClient.character.findUnique.mockRejectedValue(new Error('Database error'))

            const result = await resolveOwnership(mockRequest as FastifyRequest, 'characters')

            expect(result).toEqual({})
        })

        it('should handle missing ID in params', async () => {
            mockRequest.params = {}

            const result = await resolveOwnership(mockRequest as FastifyRequest, 'characters')

            expect(result).toEqual({
                ownerId: null,
                visibility: null,
            })
        })

        it('should fallback to request body for creation routes', async () => {
            mockRequest.params = {}
            mockRequest.body = {
                ownerId: 'body-owner-123',
                visibility: 'PRIVATE',
            }

            const result = await resolveOwnership(mockRequest as FastifyRequest, 'characters')

            expect(result).toEqual({
                ownerId: 'body-owner-123',
                visibility: 'PRIVATE',
            })
        })

        it('should throw error when Prisma instance is not available', async () => {
            mockRequest.prisma = null

            await expect(
                resolveOwnership(mockRequest as FastifyRequest, 'characters')
            ).rejects.toThrow('Prisma instance not available')
        })

        it('should handle invalid visibility values', async () => {
            const mockCharacter = {
                ownerId: 'owner-123',
                visibility: 'INVALID_VISIBILITY',
                owner: { role: 'USER' },
            }

            mockPrismaClient.character.findUnique.mockResolvedValue(mockCharacter)

            const result = await resolveOwnership(mockRequest as FastifyRequest, 'characters')

            expect(result).toEqual({
                ownerId: 'owner-123',
                visibility: null,
                ownerRole: 'USER',
            })
        })

        it('should handle invalid role values', async () => {
            const mockCharacter = {
                ownerId: 'owner-123',
                visibility: 'PUBLIC',
                owner: { role: 'INVALID_ROLE' },
            }

            mockPrismaClient.character.findUnique.mockResolvedValue(mockCharacter)

            const result = await resolveOwnership(mockRequest as FastifyRequest, 'characters')

            expect(result).toEqual({
                ownerId: 'owner-123',
                visibility: 'PUBLIC',
                ownerRole: null,
            })
        })
    })

    describe('createRbacMiddleware', () => {
        it('should allow when RBAC is disabled', async () => {
            process.env.RBAC_ENABLED = 'false'
            mockCan.mockReturnValue(false) // Even if policy denies, should pass

            const middleware = createRbacMiddleware('characters', 'read')

            await expect(
                middleware(mockRequest as FastifyRequest, mockReply as FastifyReply)
            ).resolves.toBeUndefined()

            expect(mockCan).not.toHaveBeenCalled()
        })

        it('should throw UNAUTHORIZED for non-read actions without user', async () => {
            mockRequest.user = undefined

            const middleware = createRbacMiddleware('characters', 'create')

            await expect(
                middleware(mockRequest as FastifyRequest, mockReply as FastifyReply)
            ).rejects.toThrow('UNAUTHORIZED')
        })

        it('should allow read actions without user (anonymous)', async () => {
            mockRequest.user = undefined
            mockCan.mockReturnValue(true)

            const middleware = createRbacMiddleware('characters', 'read')

            await expect(
                middleware(mockRequest as FastifyRequest, mockReply as FastifyReply)
            ).resolves.toBeUndefined()

            expect(mockCan).toHaveBeenCalledWith({
                user: undefined,
                resource: 'characters',
                action: 'read',
                ownerId: 'owner-123',
                visibility: 'PUBLIC',
                ownerRole: undefined,
                targetUserRole: undefined,
            })
        })

        it('should use route config when available', async () => {
            const routeConfig = {
                ownerId: 'route-owner-123',
                visibility: 'PUBLIC',
            }

            mockRequest.routeOptions = {
                config: {
                    rbac: routeConfig,
                },
            }

            mockCan.mockReturnValue(true)

            const middleware = createRbacMiddleware('characters', 'update')

            await expect(
                middleware(mockRequest as FastifyRequest, mockReply as FastifyReply)
            ).resolves.toBeUndefined()

            expect(mockCan).toHaveBeenCalledWith({
                user: { id: 'user-123', role: 'USER' },
                resource: 'characters',
                action: 'update',
                ownerId: 'route-owner-123',
                visibility: 'PUBLIC',
                ownerRole: undefined,
                targetUserRole: undefined,
            })
        })

        it('should resolve ownership when route config not available', async () => {
            const mockCharacter = {
                ownerId: 'resolved-owner-123',
                visibility: 'PRIVATE',
                owner: { role: 'USER' },
            }

            mockPrismaClient.character.findUnique.mockResolvedValue(mockCharacter)
            mockCan.mockReturnValue(true)

            const middleware = createRbacMiddleware('characters', 'update')

            await expect(
                middleware(mockRequest as FastifyRequest, mockReply as FastifyReply)
            ).resolves.toBeUndefined()

            expect(mockCan).toHaveBeenCalledWith({
                user: { id: 'user-123', role: 'USER' },
                resource: 'characters',
                action: 'update',
                ownerId: 'resolved-owner-123',
                visibility: 'PRIVATE',
                ownerRole: 'USER',
                targetUserRole: undefined,
            })
        })

        it('should throw FORBIDDEN when policy denies access', async () => {
            mockCan.mockReturnValue(false)

            const middleware = createRbacMiddleware('characters', 'delete')

            await expect(
                middleware(mockRequest as FastifyRequest, mockReply as FastifyReply)
            ).rejects.toThrow('FORBIDDEN')
        })

        it('should handle empty route config correctly', async () => {
            mockRequest.routeOptions = {
                config: {},
            }

            const mockCharacter = {
                ownerId: 'resolved-owner-456',
                visibility: 'PUBLIC',
                owner: { role: 'MODERATOR' },
            }

            mockPrismaClient.character.findUnique.mockResolvedValue(mockCharacter)
            mockCan.mockReturnValue(true)

            const middleware = createRbacMiddleware('characters', 'read')

            await expect(
                middleware(mockRequest as FastifyRequest, mockReply as FastifyReply)
            ).resolves.toBeUndefined()

            expect(mockCan).toHaveBeenCalledWith({
                user: { id: 'user-123', role: 'USER' },
                resource: 'characters',
                action: 'read',
                ownerId: 'resolved-owner-456',
                visibility: 'PUBLIC',
                ownerRole: 'MODERATOR',
                targetUserRole: undefined,
            })
        })

        it('should handle different resource types', async () => {
            const resources = [
                'image',
                'tag',
                'skill',
                'perk',
                'race',
                'archetype',
                'item',
            ] as const

            for (const resource of resources) {
                const mockData = {
                    ownerId: `owner-${resource}`,
                    owner: { role: 'USER' },
                }

                // Reset mocks and set up fresh for each resource
                vi.clearAllMocks()
                mockCan.mockReturnValue(true)

                mockPrismaClient[resource].findUnique.mockResolvedValue(mockData)

                const middleware = createRbacMiddleware(`${resource}s`, 'read')

                await expect(
                    middleware(mockRequest as FastifyRequest, mockReply as FastifyReply)
                ).resolves.toBeUndefined()

                expect(mockCan).toHaveBeenCalledWith({
                    user: { id: 'user-123', role: 'USER' },
                    resource: `${resource}s`,
                    action: 'read',
                    ownerId: `owner-${resource}`,
                    visibility: undefined,
                    ownerRole: 'USER',
                    targetUserRole: undefined,
                })
            }
        })
    })

    describe('rbac convenience helpers', () => {
        it('should create read middleware correctly', () => {
            const middleware = rbac.read('characters')
            expect(typeof middleware).toBe('function')
        })

        it('should create create middleware correctly', () => {
            const middleware = rbac.create('users')
            expect(typeof middleware).toBe('function')
        })

        it('should create update middleware correctly', () => {
            const middleware = rbac.update('items')
            expect(typeof middleware).toBe('function')
        })

        it('should create delete middleware correctly', () => {
            const middleware = rbac.delete('images')
            expect(typeof middleware).toBe('function')
        })

        it('should create manage middleware correctly', () => {
            const middleware = rbac.manage('users')
            expect(typeof middleware).toBe('function')
        })
    })
})
