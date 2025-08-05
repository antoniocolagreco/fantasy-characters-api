import { createApp } from './app.js';
import { config, serverConfig } from './config/environment.js';

// Global app instance for graceful shutdown
let app: any;

/**
 * Application entry point
 * Starts the Fastify server with all configured plugins and routes
 */
async function start(): Promise<void> {
  try {
    // Create application instance
    app = await createApp();

    // Start server
    const address = await app.listen({
      port: serverConfig.port,
      host: serverConfig.host,
    });

    app.log.info({
      message: 'Fantasy Character API Server started successfully',
      address,
      environment: serverConfig.nodeEnv,
      apiPrefix: config.API_PREFIX,
      docsUrl: `${address}/docs`,
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

/**
 * Graceful shutdown handler
 */
async function gracefulShutdown(signal: string): Promise<void> {
  console.log(`\nReceived ${signal}. Starting graceful shutdown...`);

  try {
    if (app) {
      await app.close();
      console.log('Server closed successfully');
    }
    process.exit(0);
  } catch (error) {
    console.error('Error during graceful shutdown:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Promise Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// Start the application
start();
