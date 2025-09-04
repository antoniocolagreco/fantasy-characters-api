import { Type, type Static } from '@sinclair/typebox'

/**
 * Health check schemas
 */

export const HealthResponseSchema = Type.Object(
    {
        status: Type.Literal('healthy'),
        timestamp: Type.String({ format: 'date-time' }),
        version: Type.String(),
        uptime: Type.Number(),
        environment: Type.String(),
        database: Type.Object({
            status: Type.Union([Type.Literal('connected'), Type.Literal('disconnected')]),
            responseTime: Type.Number(),
        }),
    },
    { $id: 'HealthResponse' }
)

// Export TypeScript types
export type HealthResponse = Static<typeof HealthResponseSchema>
