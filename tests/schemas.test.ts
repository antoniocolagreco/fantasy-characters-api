import {
    HealthCheckResponseSchema,
    ErrorResponseSchema,
    SuccessResponseSchema,
    PaginationSchema
} from '../src/schemas/api.js'
import { Type } from '@sinclair/typebox'

describe('API Schemas', () => {
    test('should export HealthCheckResponseSchema', () => {
        expect(HealthCheckResponseSchema).toBeDefined()
        expect(typeof HealthCheckResponseSchema).toBe('object')
        expect(HealthCheckResponseSchema.type).toBe('object')
    })

    test('should export ErrorResponseSchema', () => {
        expect(ErrorResponseSchema).toBeDefined()
        expect(typeof ErrorResponseSchema).toBe('object')
        expect(ErrorResponseSchema.type).toBe('object')
    })

    test('should export PaginationSchema', () => {
        expect(PaginationSchema).toBeDefined()
        expect(typeof PaginationSchema).toBe('object')
        expect(PaginationSchema.type).toBe('object')
    })

    test('should create SuccessResponseSchema function', () => {
        const testSchema = Type.String()
        const successSchema = SuccessResponseSchema(testSchema)

        expect(successSchema).toBeDefined()
        expect(typeof successSchema).toBe('object')
        expect(successSchema.type).toBe('object')
    })

    test('should have required properties in HealthCheckResponseSchema', () => {
        expect(HealthCheckResponseSchema.properties).toBeDefined()
        expect(HealthCheckResponseSchema.properties?.status).toBeDefined()
        expect(HealthCheckResponseSchema.properties?.timestamp).toBeDefined()
        expect(HealthCheckResponseSchema.properties?.version).toBeDefined()
        expect(HealthCheckResponseSchema.properties?.environment).toBeDefined()
        expect(HealthCheckResponseSchema.properties?.uptime).toBeDefined()
        expect(HealthCheckResponseSchema.properties?.memory).toBeDefined()
        expect(HealthCheckResponseSchema.properties?.system).toBeDefined()
        expect(HealthCheckResponseSchema.properties?.database).toBeDefined()
    })

    test('should have required properties in ErrorResponseSchema', () => {
        expect(ErrorResponseSchema.properties).toBeDefined()
        expect(ErrorResponseSchema.properties?.error).toBeDefined()
    })

    test('should have required properties in PaginationSchema', () => {
        expect(PaginationSchema.properties).toBeDefined()
        expect(PaginationSchema.properties?.page).toBeDefined()
        expect(PaginationSchema.properties?.limit).toBeDefined()
        expect(PaginationSchema.properties?.total).toBeDefined()
        expect(PaginationSchema.properties?.totalPages).toBeDefined()
    })

    test('should have proper defaults in PaginationSchema', () => {
        expect(PaginationSchema.properties?.page?.default).toBe(1)
        expect(PaginationSchema.properties?.limit?.default).toBe(10)
    })

    test('should have proper constraints in PaginationSchema', () => {
        expect(PaginationSchema.properties?.page?.minimum).toBe(1)
        expect(PaginationSchema.properties?.limit?.minimum).toBe(1)
        expect(PaginationSchema.properties?.limit?.maximum).toBe(100)
        expect(PaginationSchema.properties?.total?.minimum).toBe(0)
        expect(PaginationSchema.properties?.totalPages?.minimum).toBe(0)
    })
})
