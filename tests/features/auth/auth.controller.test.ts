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
import * as authController from '@/features/auth/v1/auth.controller'

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
})
