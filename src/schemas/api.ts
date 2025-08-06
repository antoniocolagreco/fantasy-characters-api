import { Static, Type, type TSchema } from '@sinclair/typebox'

// Health Check Response Schema
export const HealthCheckResponseSchema = Type.Object({
    status: Type.Union([Type.Literal('healthy'), Type.Literal('unhealthy')]),
    timestamp: Type.String({ format: 'date-time' }),
    version: Type.String(),
    environment: Type.String(),
    uptime: Type.Number({ description: 'Server uptime in seconds' }),
    memory: Type.Object({
        used: Type.Number({ description: 'Memory used in MB' }),
        total: Type.Number({ description: 'Total memory in MB' }),
        percentage: Type.Number({ description: 'Memory usage percentage' })
    }),
    system: Type.Object({
        platform: Type.String(),
        nodeVersion: Type.String(),
        pid: Type.Number()
    }),
    database: Type.Optional(
        Type.Object({
            status: Type.Union([Type.Literal('healthy'), Type.Literal('unhealthy')]),
            message: Type.String(),
            migrations: Type.Object({
                applied: Type.Boolean(),
                pending: Type.Number()
            })
        })
    )
})

export type HealthCheckResponse = Static<typeof HealthCheckResponseSchema>

// Enhanced Error Response Schema
export const ErrorResponseSchema = Type.Object({
    success: Type.Literal(false),
    error: Type.Object({
        code: Type.String(),
        message: Type.String(),
        details: Type.Optional(Type.Unknown()),
        timestamp: Type.String({ format: 'date-time' }),
        path: Type.Optional(Type.String()),
        requestId: Type.Optional(Type.String())
    })
})

export type ErrorResponse = Static<typeof ErrorResponseSchema>

// Enhanced Success Response Schema
export const SuccessResponseSchema = <T extends TSchema>(dataSchema: T) =>
    Type.Object({
        success: Type.Literal(true),
        data: dataSchema,
        timestamp: Type.String({ format: 'date-time' }),
        meta: Type.Optional(
            Type.Object({
                pagination: Type.Optional(
                    Type.Object({
                        page: Type.Number({ minimum: 1 }),
                        limit: Type.Number({ minimum: 1, maximum: 100 }),
                        total: Type.Number({ minimum: 0 }),
                        totalPages: Type.Number({ minimum: 0 })
                    })
                ),
                version: Type.Optional(Type.String()),
                requestId: Type.Optional(Type.String())
            })
        )
    })

// Pagination Schema
export const PaginationSchema = Type.Object({
    page: Type.Number({ minimum: 1, default: 1 }),
    limit: Type.Number({ minimum: 1, maximum: 100, default: 10 }),
    total: Type.Number({ minimum: 0 }),
    totalPages: Type.Number({ minimum: 0 })
})

export type Pagination = Static<typeof PaginationSchema>
