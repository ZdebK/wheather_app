import winston from 'winston';
import path from 'path';
import { config } from '../config';

/**
 * Custom log format for structured logging
 */
const
  structuredFormat = winston.format.printf(({ timestamp, level, message, context, ...meta }) => {
    const
      contextStr = context ? `[${context}]` : '',
      metaStr = Object.keys(meta).length ? `\n${JSON.stringify(meta, null, 2)}` : '';

    return `${timestamp} [${level}]${contextStr}: ${message}${metaStr}`;
  }),
  logger = winston.createLogger({
    level: config.log.level,
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
  graphql: (operation: string, meta?: Record<string, unknown>) => {
    logger.info(operation, { context: 'GraphQL', ...meta });
  },

  /**
   * Log database operations
   */
  database: (operation: string, meta?: Record<string, unknown>) => {
    logger.debug(operation, { context: 'Database', ...meta });
  },

  /**
   * Log external API calls
   */
  api: (operation: string, meta?: Record<string, unknown>) => {
    logger.info(operation, { context: 'API', ...meta });
  },

  /**
   * Log service operations
   */
  service: (operation: string, meta?: Record<string, unknown>) => {
    logger.debug(operation, { context: 'Service', ...meta });
  },

  /**
   * Log repository operations
   */
  repository: (operation: string, meta?: Record<string, unknown>) => {
    logger.debug(operation, { context: 'Repository', ...meta });
  },

  /**
   * Log errors with full context
   */
  error: (message: string, error: Error | unknown, meta?: Record<string, unknown>) => {
    const err = error as Error;
    logger.error(message, {
      context: 'Error',
      error: err?.message,
      stack: err?.stack,
      ...meta,
    });
  },
};

export default logger;
