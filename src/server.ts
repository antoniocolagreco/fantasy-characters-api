import { startServer, stopServer } from './app'

/**
 * Main server entry point
 */
async function main() {
    const app = await startServer()

    // Graceful shutdown handlers
    const gracefulShutdown = async (signal: string) => {
        app.log.info(`Received ${signal}, starting graceful shutdown`)
        await stopServer(app)
        process.exit(0)
    }

    process.on('SIGTERM', () => {
        void gracefulShutdown('SIGTERM').catch((error: unknown) => {
            app.log.error({ error }, 'Error during graceful shutdown')
        })
    })
    process.on('SIGINT', () => {
        void gracefulShutdown('SIGINT').catch((error: unknown) => {
            app.log.error({ error }, 'Error during graceful shutdown')
        })
    })

    // Handle uncaught exceptions
    process.on('uncaughtException', error => {
        app.log.fatal({ error }, 'Uncaught exception')
        process.exit(1)
    })

    process.on('unhandledRejection', (reason, promise) => {
        app.log.fatal({ reason, promise }, 'Unhandled rejection')
        process.exit(1)
    })
}

main().catch((error: unknown) => {
    // eslint-disable-next-line no-console
    console.error('Failed to start server:', error)
    process.exit(1)
})
