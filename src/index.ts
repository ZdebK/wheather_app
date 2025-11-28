import 'reflect-metadata';
import express, { Application } from 'express';
import { graphqlHTTP } from 'express-graphql';
import dotenv from 'dotenv';
import { AppDataSource, initializeDatabase } from './data-source';
import { schema } from './graphql/schema';
import { PropertyResolvers } from './resolvers/PropertyResolvers';
import logger, { logContext } from './utils/logger';

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 4000,
  NODE_ENV = process.env.NODE_ENV || 'development',

  /**
 * Create Express application with GraphQL endpoint
 */
  createApp = (): Application => {
    const app = express(),

      // Initialize resolvers
      propertyResolvers = new PropertyResolvers();

    // GraphQL endpoint
    app.use(
      '/graphql',
      graphqlHTTP({
        schema,
        rootValue: propertyResolvers.getRootValue(),
        graphiql: NODE_ENV === 'development',
        customFormatErrorFn: (error) => {
          logContext.error('GraphQL Error', error, {
            locations: error.locations,
            path: error.path,
          });
          return {
            message: error.message,
            locations: error.locations,
            path: error.path,
          };
        },
      }),
    );

    // Health check endpoint
    app.get('/health', async (req, res) => {
      const dbHealthy = AppDataSource.isInitialized;
      res.status(dbHealthy ? 200 : 503).json({
        status: dbHealthy ? 'healthy' : 'unhealthy',
        database: dbHealthy ? 'connected' : 'disconnected',
        timestamp: new Date().toISOString(),
      });
    });

    return app;
  },

  /**
 * Start the server with database initialization
 */
  startServer = async (): Promise<void> => {
  // Initialize database connection
    await initializeDatabase();

    // Create and start Express app
    const app = createApp();

    app.listen(PORT, () => {
      logger.info(`🚀 Server running in ${NODE_ENV} mode`);
      logger.info(`📍 GraphQL endpoint: http://localhost:${PORT}/graphql`);
      logger.info(`🏥 Health check: http://localhost:${PORT}/health`);
      if (NODE_ENV === 'development') {
        logger.info('🎮 GraphQL Playground available at /graphql');
      }
    });
  },

  /**
 * Graceful shutdown handler
 */
  gracefulShutdown = async (signal: string): Promise<void> => {
    logger.info(`${signal} received, closing gracefully...`);

    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
      logger.info('✅ Database connections closed');
    }
    process.exit(0);
  };

// Register shutdown handlers
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Global error handlers
process.on('uncaughtException', (error: Error) => {
  logContext.error('Uncaught Exception', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason: any) => {
  logContext.error('Unhandled Rejection', reason);
  process.exit(1);
});

// Start the server
startServer().catch((error) => {
  logContext.error('Failed to start server', error);
  process.exit(1);
});
