/**
 * Application entry point
 * Starts the Fastify server with all configured plugins and routes
 */

import { app } from './app.js'
import { environment } from './config/environment.js'

const start = async (): Promise<void> => {
  try {
    const address = await app.listen({
      port: environment.PORT,
      host: environment.HOST,
    })

    app.log.info(`Server listening at ${address}`)
    app.log.info(`Health check: ${address}/api/health`)
    app.log.info(`API docs: ${address}/docs`)
  } catch (error) {
    // Enhanced error handling with specific error types
    if (error instanceof Error) {
      // Handle specific error types
      if (error.message.includes('EADDRINUSE')) {
        app.log.error(`Failed to start server: Port ${environment.PORT} is already in use`)
        app.log.error('Please check if another instance is running or use a different port')
        app.log.error(`You can set a different port with: PORT=3001 pnpm run dev`)
      } else if (error.message.includes('EACCES')) {
        app.log.error(`Failed to start server: Permission denied for port ${environment.PORT}`)
        app.log.error('Try using a port number above 1024 or run with administrator privileges')
      } else if (error.message.includes('ENOTFOUND')) {
        app.log.error(`Failed to start server: Cannot bind to host ${environment.HOST}`)
        app.log.error('Please check if the host address is valid')
      } else {
        app.log.error('Failed to start server with unexpected error:')
        app.log.error(`Error name: ${error.name}`)
        app.log.error(`Error message: ${error.message}`)
        if (error.stack) {
          app.log.error(`Stack trace: ${error.stack}`)
        }
      }
    } else {
      app.log.error('Failed to start server with unknown error:', error)
    }

    app.log.error('Server startup failed - exiting process')
    process.exit(1)
  }
}

// Handle graceful shutdown
const gracefulShutdown = async (signal: string): Promise<void> => {
  app.log.info(`Received ${signal}, shutting down gracefully...`)

  try {
    await app.close()
    app.log.info('Server closed successfully')
    process.exit(0)
  } catch (error) {
    if (error instanceof Error) {
      app.log.error(`Error during graceful shutdown: ${error.message}`)
      if (error.stack) {
        app.log.error(`Stack trace: ${error.stack}`)
      }
    } else {
      app.log.error('Unknown error during shutdown:', error)
    }
    app.log.error('Forcing process exit due to shutdown error')
    process.exit(1)
  }
}

// Register shutdown handlers
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))
process.on('SIGINT', () => gracefulShutdown('SIGINT'))

// Start the server
start()
