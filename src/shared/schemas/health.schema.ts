import { type Static, Type } from '@sinclair/typebox'

/**
 * Health check schemas
 */

export const HealthResponseSchema = Type.Object(
    {
        status: Type.String({
            enum: ['ok', 'error'],
            description: 'Overall health status of the application',
        }),
        timestamp: Type.String({
            format: 'date-time',
            description: 'When the health check was performed',
        }),
        uptime: Type.Number({
            description: 'Application uptime in seconds',
        }),
        error: Type.Optional(
            Type.String({
                description: 'Error message if status is error',
            })
        ),
    },
    {
        $id: 'HealthResponse',
        title: 'Health Response',
        description: 'Application health check response',
    }
)

export const ReadinessResponseSchema = Type.Object(
    {
        status: Type.String({
            enum: ['ready', 'not_ready'],
            description: 'Overall readiness status of the application',
        }),
        timestamp: Type.String({
            format: 'date-time',
            description: 'When the readiness check was performed',
        }),
        checks: Type.Object({
            database: Type.Object({
                status: Type.String({
                    enum: ['ready', 'not_ready'],
                    description: 'Database connection status',
                }),
                responseTime: Type.Number({
                    description: 'Database response time in milliseconds',
                }),
            }),
            migrations: Type.Object({
                status: Type.String({
                    enum: ['ready', 'not_ready'],
                    description: 'Database migrations status',
                }),
            }),
        }),
    },
    {
        $id: 'ReadinessResponse',
        title: 'Readiness Response',
        description: 'Application readiness check response with detailed component status',
    }
)

// Export TypeScript types
export type HealthResponse = Static<typeof HealthResponseSchema>
export type ReadinessResponse = Static<typeof ReadinessResponseSchema>
