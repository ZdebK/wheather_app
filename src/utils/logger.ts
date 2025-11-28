import winston from 'winston';
import path from 'path';

const NODE_ENV = process.env.NODE_ENV || 'development',
  LOG_LEVEL = process.env.LOG_LEVEL || (NODE_ENV === 'production' ? 'info' : 'debug'),

  /**
 * Custom log format for structured logging
 */
  structuredFormat = winston.format.printf(({ timestamp, level, message, context, ...meta }) => {
    const contextStr = context ? `[${context}]` : '',
      metaStr = Object.keys(meta).length ? `\n${JSON.stringify(meta, null, 2)}` : '';
    return `${timestamp} [${level}]${contextStr}: ${message}${metaStr}`;
  }),

  /**
 * Winston logger configuration with structured logging
 * Supports console and file transports with contextual information
 */
  logger = winston.createLogger({
    level: LOG_LEVEL,
    format: winston.format.combine(
      winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      winston.format.errors({ stack: true }),
      winston.format.json(),
    ),
    defaultMeta: { service: 'weather-app' },
    transports: [
    // Console transport - colored output for development
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
          structuredFormat,
        ),
      }),

      // File transport - all logs
      new winston.transports.File({
        filename: path.join('logs', 'combined.log'),
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.json(),
        ),
      }),

      // File transport - errors only
      new winston.transports.File({
        filename: path.join('logs', 'error.log'),
        level: 'error',
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.json(),
        ),
      }),
    ],
  });

/**
 * Contextual logging helpers for structured logs
 */
export const logContext = {
  /**
   * Log GraphQL operations
   */
  graphql: (operation: string, meta?: any) => {
    logger.info(operation, { context: 'GraphQL', ...meta });
  },

  /**
   * Log database operations
   */
  database: (operation: string, meta?: any) => {
    logger.debug(operation, { context: 'Database', ...meta });
  },

  /**
   * Log external API calls
   */
  api: (operation: string, meta?: any) => {
    logger.info(operation, { context: 'API', ...meta });
  },

  /**
   * Log service operations
   */
  service: (operation: string, meta?: any) => {
    logger.debug(operation, { context: 'Service', ...meta });
  },

  /**
   * Log repository operations
   */
  repository: (operation: string, meta?: any) => {
    logger.debug(operation, { context: 'Repository', ...meta });
  },

  /**
   * Log errors with full context
   */
  error: (message: string, error: any, meta?: any) => {
    logger.error(message, {
      context: 'Error',
      error: error?.message,
      stack: error?.stack,
      ...meta,
    });
  },
};

export default logger;
