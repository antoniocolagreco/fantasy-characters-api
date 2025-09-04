import { Type, type Static } from '@sinclair/typebox'

/**
 * Health check schemas
 */

export const HealthResponseSchema = Type.Object(
    {
        status: Type.Union([Type.Literal('ok'), Type.Literal('error')]),
        timestamp: Type.String({ format: 'date-time' }),
        uptime: Type.Number(),
        error: Type.Optional(Type.String()),
    },
    { $id: 'HealthResponse' }
)

export const ReadinessResponseSchema = Type.Object(
    {
        status: Type.Union([Type.Literal('ready'), Type.Literal('not_ready')]),
        timestamp: Type.String({ format: 'date-time' }),
        checks: Type.Object({
            database: Type.Object({
                status: Type.Union([Type.Literal('ready'), Type.Literal('not_ready')]),
                responseTime: Type.Number(),
            }),
            migrations: Type.Object({
                status: Type.Union([Type.Literal('ready'), Type.Literal('not_ready')]),
            }),
        }),
    },
    { $id: 'ReadinessResponse' }
)

// Export TypeScript types
export type HealthResponse = Static<typeof HealthResponseSchema>
export type ReadinessResponse = Static<typeof ReadinessResponseSchema>
