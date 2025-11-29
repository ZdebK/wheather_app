import 'reflect-metadata';
import express, { Application, Request, Response, NextFunction } from 'express';
import { graphqlHTTP } from 'express-graphql';
import { AppDataSource, initializeDatabase } from './data-source';
import { schema } from './graphql/schema';
import { PropertyResolvers } from './resolvers/property.resolvers';
import logger, { logContext } from './utils/logger';
import { config, isDevelopment, isTest } from './config';

const 
  // Simple in-memory rate limiter (per-IP) for recruitment task
  createInMemoryRateLimiter = (maxRequests: number, windowMs: number) => {
    type HitRecord = { count: number; reset: number };
    const hits = new Map<string, HitRecord>();

    return (req: Request, res: Response, next: NextFunction): void => {
      if (isTest) {
        return next();
      }

      const 
        key = (req.ip || (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown') as string,
        now = Date.now(),
        current = hits.get(key),
        record: HitRecord = current && now <= current.reset
          ? { count: current.count + 1, reset: current.reset }
          : { count: 1, reset: now + windowMs };

      hits.set(key, record);

      if (record.count > maxRequests) {
        res.status(429).json({ error: 'Too many requests' });
        return;
      }
      next();
    };
  },
  createApp = (): Application => {
    const app = express(),

      // Initialize resolvers
      propertyResolvers = new PropertyResolvers();

    // Basic rate limiting for GraphQL endpoint (per IP)
    app.set('trust proxy', 1);
    app.use('/graphql', createInMemoryRateLimiter(config.rateLimit.max, config.rateLimit.windowMs));

    // GraphQL endpoint
    app.use(
      '/graphql',
      graphqlHTTP({
        schema,
        rootValue: propertyResolvers.getRootValue(),
        graphiql: isDevelopment,
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
  startServer = async (): Promise<void> => {
  // Initialize database connection
    await initializeDatabase();

    // Create and start Express app
    const app = createApp();

    app.listen(config.port, () => {
      logger.info(`🚀 Server running in ${config.nodeEnv} mode`);
      logger.info(`📍 GraphQL endpoint: ${config.protocol}://${config.host}:${config.port}/graphql`);
      logger.info(`🏥 Health check: ${config.protocol}://${config.host}:${config.port}/health`);
      if (isDevelopment) {
        logger.info('🎮 GraphQL Playground available at /graphql');
      }
    });
  },
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
