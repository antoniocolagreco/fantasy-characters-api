import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock the auth service module - hoisted to top level
vi.mock('@/features/auth/auth.service', () => ({
    authService: {
        login: vi.fn(),
        register: vi.fn(),
        refreshTokens: vi.fn(),
        logout: vi.fn(),
        logoutAll: vi.fn(),
        changePassword: vi.fn(),
    },
}))

import { authService, type LoginResult } from '@/features/auth/auth.service'
import { authController } from '@/features/auth/v1/auth.controller'

// Type assertion for mocked service
const mockAuthService = authService as any

describe('AuthController', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe('login', () => {
        it('should login successfully', async () => {
            const loginData = {
                email: 'test@example.com',
                password: 'password123',
            }

            const loginResult: LoginResult = {
                id: 'user-123',
                email: 'test@example.com',
                role: 'USER',
                accessToken: 'access-token-123',
                refreshToken: 'refresh-token-123',
            }

            mockAuthService.login.mockResolvedValue(loginResult)

            const request = {
                body: loginData,
                headers: { 'user-agent': 'test-browser' },
                id: 'test-request-id',
            } as any

            const reply = {
                code: vi.fn().mockReturnThis(),
                send: vi.fn(),
            } as any

            await authController.login(request, reply)

            expect(mockAuthService.login).toHaveBeenCalledWith(loginData, 'test-browser')
            expect(reply.code).toHaveBeenCalledWith(200)
            expect(reply.send).toHaveBeenCalledWith({
                data: loginResult,
                requestId: 'test-request-id',
                timestamp: expect.any(String),
            })
        })
    })

    describe('register', () => {
        it('should register successfully', async () => {
            const registerData = {
                email: 'newuser@example.com',
                password: 'password123',
                name: 'New User',
            }

            const createdUser = {
                id: 'user-456',
                email: 'newuser@example.com',
                name: 'New User',
                role: 'USER',
            }

            mockAuthService.register.mockResolvedValue(createdUser)

            const request = {
                body: registerData,
                id: 'test-request-id',
            } as any

            const reply = {
                code: vi.fn().mockReturnThis(),
                send: vi.fn(),
            } as any

            await authController.register(request, reply)

            expect(mockAuthService.register).toHaveBeenCalledWith(registerData)
            expect(reply.code).toHaveBeenCalledWith(201)
            expect(reply.send).toHaveBeenCalledWith({
                data: createdUser,
                requestId: 'test-request-id',
                timestamp: expect.any(String),
            })
        })
    })

    describe('refreshToken', () => {
        it('should refresh tokens successfully', async () => {
            const refreshTokenData = {
                refreshToken: 'old-refresh-token',
            }

            const newTokens = {
                accessToken: 'new-access-token',
                refreshToken: 'new-refresh-token',
            }

            mockAuthService.refreshTokens.mockResolvedValue(newTokens)

            const request = {
                body: refreshTokenData,
                headers: { 'user-agent': 'test-browser' },
                id: 'test-request-id',
            } as any

            const reply = {
                code: vi.fn().mockReturnThis(),
                send: vi.fn(),
            } as any

            await authController.refreshToken(request, reply)

            expect(mockAuthService.refreshTokens).toHaveBeenCalledWith(
                'old-refresh-token',
                'test-browser'
            )
            expect(reply.code).toHaveBeenCalledWith(200)
            expect(reply.send).toHaveBeenCalledWith({
                data: newTokens,
                requestId: 'test-request-id',
                timestamp: expect.any(String),
            })
        })
    })

    describe('logout', () => {
        it('should logout successfully', async () => {
            const logoutData = {
                refreshToken: 'token-to-logout',
            }

            mockAuthService.logout.mockResolvedValue(undefined)

            const request = {
                body: logoutData,
                id: 'test-request-id',
            } as any

            const reply = {
                code: vi.fn().mockReturnThis(),
                send: vi.fn(),
            } as any

            await authController.logout(request, reply)

            expect(mockAuthService.logout).toHaveBeenCalledWith('token-to-logout')
            expect(reply.code).toHaveBeenCalledWith(200)
            expect(reply.send).toHaveBeenCalledWith({
                message: 'Logged out successfully',
                requestId: 'test-request-id',
                timestamp: expect.any(String),
            })
        })
    })

    describe('logoutAll', () => {
        it('should logout from all devices successfully', async () => {
            mockAuthService.logoutAll.mockResolvedValue(undefined)

            const request = {
                user: { id: 'user-123' },
                id: 'test-request-id',
            } as any

            const reply = {
                code: vi.fn().mockReturnThis(),
                send: vi.fn(),
            } as any

            await authController.logoutAll(request, reply)

            expect(mockAuthService.logoutAll).toHaveBeenCalledWith('user-123')
            expect(reply.code).toHaveBeenCalledWith(200)
            expect(reply.send).toHaveBeenCalledWith({
                message: 'Logged out from all devices',
                requestId: 'test-request-id',
                timestamp: expect.any(String),
            })
        })

        it('should throw error when user is not authenticated', async () => {
            const request = {
                user: undefined,
                id: 'test-request-id',
            } as any

            const reply = {
                code: vi.fn().mockReturnThis(),
                send: vi.fn(),
            } as any

            await expect(authController.logoutAll(request, reply)).rejects.toThrow(
                'Authentication required'
            )

            expect(mockAuthService.logoutAll).not.toHaveBeenCalled()
        })
    })

    describe('changePassword', () => {
        it('should change password successfully', async () => {
            const changePasswordData = {
                currentPassword: 'old-password',
                newPassword: 'new-password',
            }

            mockAuthService.changePassword.mockResolvedValue(undefined)

            const request = {
                body: changePasswordData,
                user: { id: 'user-123' },
                id: 'test-request-id',
            } as any

            const reply = {
                code: vi.fn().mockReturnThis(),
                send: vi.fn(),
            } as any

            await authController.changePassword(request, reply)

            expect(mockAuthService.changePassword).toHaveBeenCalledWith(
                'user-123',
                'old-password',
                'new-password'
            )
            expect(reply.code).toHaveBeenCalledWith(200)
            expect(reply.send).toHaveBeenCalledWith({
                message: 'Password changed successfully',
                requestId: 'test-request-id',
                timestamp: expect.any(String),
            })
        })

        it('should throw error when user is not authenticated', async () => {
            const changePasswordData = {
                currentPassword: 'old-password',
                newPassword: 'new-password',
            }

            const request = {
                body: changePasswordData,
                user: undefined,
                id: 'test-request-id',
            } as any

            const reply = {
                code: vi.fn().mockReturnThis(),
                send: vi.fn(),
            } as any

            await expect(authController.changePassword(request, reply)).rejects.toThrow(
                'Authentication required'
            )
            expect(mockAuthService.changePassword).not.toHaveBeenCalled()
        })
    })
})
