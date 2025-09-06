/**
 * Centralized test factory for consistent test creation across the codebase
 */

import type { FastifyInstance } from 'fastify'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { buildApp } from '@/app'
import { cleanupTestData, seedTestDatabase } from '@/tests/helpers/data.helper'
import {
    createTestRequest,
    expectErrorResponse,
    expectPaginatedResponse,
    expectSafeUserData,
    expectSuccessResponse,
    HTTP_STATUS,
    type TestResponse,
} from '@/tests/helpers/test.helper'

interface TestContext {
    app: FastifyInstance
    cleanup: () => Promise<void>
}

interface TestSuite {
    name: string
    setup?: () => Promise<void>
    teardown?: () => Promise<void>
    tests: TestCase[]
}

interface TestCase {
    name: string
    test: (ctx: TestContext) => Promise<void> | void
    skip?: boolean
    timeout?: number
}

/**
 * Creates a standardized integration test suite
 */
export function createIntegrationTestSuite(suite: TestSuite) {
    describe(suite.name, () => {
        let app: FastifyInstance
        let cleanup: () => Promise<void>

        beforeAll(async () => {
            app = await buildApp()
            await app.ready()
            if (suite.setup) {
                await suite.setup()
            }
        })

        afterAll(async () => {
            if (suite.teardown) {
                await suite.teardown()
            }
            await app.close()
        })

        beforeEach(async () => {
            await cleanupTestData()
            cleanup = async () => {
                await cleanupTestData()
            }
        })

        suite.tests.forEach(testCase => {
            const testFn = testCase.skip ? it.skip : it
            const testImpl = testCase.timeout ? { timeout: testCase.timeout } : undefined

            testFn(
                testCase.name,
                async () => {
                    await testCase.test({ app, cleanup })
                },
                testImpl
            )
        })
    })
}

/**
 * Creates a standardized unit test suite
 */
export function createUnitTestSuite(suite: TestSuite) {
    describe(suite.name, () => {
        beforeEach(async () => {
            if (suite.setup) {
                await suite.setup()
            }
        })

        afterEach(async () => {
            if (suite.teardown) {
                await suite.teardown()
            }
        })

        suite.tests.forEach(testCase => {
            const testFn = testCase.skip ? it.skip : it
            const testImpl = testCase.timeout ? { timeout: testCase.timeout } : undefined

            testFn(
                testCase.name,
                async () => {
                    await testCase.test({
                        app: null as unknown as FastifyInstance,
                        cleanup: async () => {},
                    })
                },
                testImpl
            )
        })
    })
}

/**
 * Standard test patterns for CRUD operations
 */
export const testPatterns = {
    /**
     * Tests for GET /{resource}/:id endpoints
     */
    getById: {
        success: (
            resource: string,
            testData: { validId: string; expectedData: Record<string, unknown> }
        ) => ({
            name: `should return ${resource} data for valid ID`,
            test: async ({ app }: TestContext) => {
                await seedTestDatabase()

                const response = await app.inject(
                    createTestRequest('GET', `/api/v1/${resource}/${testData.validId}`, {
                        auth: { role: 'ADMIN' },
                    })
                )

                const body = expectSuccessResponse(response as unknown as TestResponse)
                expect(body.data).toMatchObject(testData.expectedData)
                if (body.data && typeof body.data === 'object') {
                    expectSafeUserData(body.data as Record<string, unknown>)
                }
            },
        }),

        notFound: (resource: string) => ({
            name: `should return 404 for non-existent ${resource}`,
            test: async ({ app }: TestContext) => {
                const nonExistentId = '01234567-89ab-cdef-0123-456789abcdef'

                const response = await app.inject(
                    createTestRequest('GET', `/api/v1/${resource}/${nonExistentId}`, {
                        auth: { role: 'ADMIN' },
                    })
                )

                expectErrorResponse(response as unknown as TestResponse, HTTP_STATUS.NOT_FOUND)
            },
        }),

        unauthorized: (resource: string, validId: string) => ({
            name: `should return 403 for unauthorized access to ${resource}`,
            test: async ({ app }: TestContext) => {
                const response = await app.inject(
                    createTestRequest('GET', `/api/v1/${resource}/${validId}`, {
                        auth: false,
                    })
                )

                expectErrorResponse(response as unknown as TestResponse, HTTP_STATUS.FORBIDDEN)
            },
        }),

        invalidUuid: (resource: string) => ({
            name: `should return 400 for invalid UUID format in ${resource} ID`,
            test: async ({ app }: TestContext) => {
                const response = await app.inject(
                    createTestRequest('GET', `/api/v1/${resource}/invalid-uuid`, {
                        auth: { role: 'ADMIN' },
                    })
                )

                expectErrorResponse(response as unknown as TestResponse, HTTP_STATUS.BAD_REQUEST)
            },
        }),
    },

    /**
     * Tests for GET /{resource} endpoints (lists)
     */
    list: {
        success: (resource: string) => ({
            name: `should return paginated list of ${resource}`,
            test: async ({ app }: TestContext) => {
                await seedTestDatabase()

                const response = await app.inject(
                    createTestRequest('GET', `/api/v1/${resource}?limit=10`, {
                        auth: { role: 'ADMIN' },
                    })
                )

                const body = expectPaginatedResponse(response as unknown as TestResponse)
                expect(Array.isArray(body.data)).toBe(true)
                if (Array.isArray(body.data) && body.data.length > 0) {
                    expect(body.data.length).toBeGreaterThan(0)
                    body.data.forEach((item: unknown) => {
                        if (item && typeof item === 'object') {
                            expectSafeUserData(item as Record<string, unknown>)
                        }
                    })
                }
            },
        }),

        unauthorized: (resource: string) => ({
            name: `should return 403 for non-admin access to ${resource} list`,
            test: async ({ app }: TestContext) => {
                const response = await app.inject(
                    createTestRequest('GET', `/api/v1/${resource}`, {
                        auth: { role: 'USER' },
                    })
                )

                expectErrorResponse(response as unknown as TestResponse, HTTP_STATUS.FORBIDDEN)
            },
        }),
    },

    /**
     * Tests for POST /{resource} endpoints
     */
    create: {
        success: (resource: string, validPayload: Record<string, unknown>) => ({
            name: `should create ${resource} with valid data`,
            test: async ({ app }: TestContext) => {
                const response = await app.inject(
                    createTestRequest('POST', `/api/v1/${resource}`, {
                        auth: { role: 'ADMIN' },
                        payload: validPayload,
                    })
                )

                const body = expectSuccessResponse(response as unknown as TestResponse, 201)
                expect(body.data).toMatchObject(validPayload)
                if (body.data && typeof body.data === 'object') {
                    expectSafeUserData(body.data as Record<string, unknown>)
                }
            },
        }),

        validation: (resource: string, invalidPayload: Record<string, unknown>) => ({
            name: `should return 400 for invalid ${resource} data`,
            test: async ({ app }: TestContext) => {
                const response = await app.inject(
                    createTestRequest('POST', `/api/v1/${resource}`, {
                        auth: { role: 'ADMIN' },
                        payload: invalidPayload,
                    })
                )

                expectErrorResponse(response as unknown as TestResponse, HTTP_STATUS.BAD_REQUEST)
            },
        }),

        unauthorized: (resource: string, validPayload: Record<string, unknown>) => ({
            name: `should return 403 for non-admin ${resource} creation`,
            test: async ({ app }: TestContext) => {
                const response = await app.inject(
                    createTestRequest('POST', `/api/v1/${resource}`, {
                        auth: { role: 'USER' },
                        payload: validPayload,
                    })
                )

                expectErrorResponse(response as unknown as TestResponse, HTTP_STATUS.FORBIDDEN)
            },
        }),
    },

    /**
     * Tests for PUT /{resource}/:id endpoints
     */
    update: {
        success: (
            resource: string,
            testData: { id: string; updatePayload: Record<string, unknown> }
        ) => ({
            name: `should update ${resource} with valid data`,
            test: async ({ app }: TestContext) => {
                const response = await app.inject(
                    createTestRequest('PUT', `/api/v1/${resource}/${testData.id}`, {
                        auth: { role: 'ADMIN' },
                        payload: testData.updatePayload,
                    })
                )

                const body = expectSuccessResponse(response as unknown as TestResponse)
                expect(body.data).toMatchObject(testData.updatePayload)
                if (body.data && typeof body.data === 'object') {
                    expectSafeUserData(body.data as Record<string, unknown>)
                }
            },
        }),

        notFound: (resource: string, updatePayload: Record<string, unknown>) => ({
            name: `should return 404 for non-existent ${resource} update`,
            test: async ({ app }: TestContext) => {
                const nonExistentId = '01234567-89ab-cdef-0123-456789abcdef'

                const response = await app.inject(
                    createTestRequest('PUT', `/api/v1/${resource}/${nonExistentId}`, {
                        auth: { role: 'ADMIN' },
                        payload: updatePayload,
                    })
                )

                expectErrorResponse(response as unknown as TestResponse, HTTP_STATUS.NOT_FOUND)
            },
        }),
    },

    /**
     * Tests for DELETE /{resource}/:id endpoints
     */
    delete: {
        success: (resource: string, validId: string) => ({
            name: `should delete ${resource} successfully`,
            test: async ({ app }: TestContext) => {
                const response = await app.inject(
                    createTestRequest('DELETE', `/api/v1/${resource}/${validId}`, {
                        auth: { role: 'ADMIN' },
                    })
                )

                expect(response.statusCode).toBe(HTTP_STATUS.NO_CONTENT)
            },
        }),

        notFound: (resource: string) => ({
            name: `should return 404 for non-existent ${resource} deletion`,
            test: async ({ app }: TestContext) => {
                const nonExistentId = '01234567-89ab-cdef-0123-456789abcdef'

                const response = await app.inject(
                    createTestRequest('DELETE', `/api/v1/${resource}/${nonExistentId}`, {
                        auth: { role: 'ADMIN' },
                    })
                )

                expectErrorResponse(response as unknown as TestResponse, HTTP_STATUS.NOT_FOUND)
            },
        }),
    },
}

export type { TestCase, TestContext, TestSuite }
