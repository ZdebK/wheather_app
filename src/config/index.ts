import dotenv from 'dotenv';

dotenv.config();

/**
 * Application Configuration
 * Centralized env variables with defaults and validation
 */
export const config = {
  // Server
  port: Number(process.env.PORT) || 4000,
  nodeEnv: process.env.NODE_ENV || 'development',
  host: process.env.APP_HOST || 'localhost',
  protocol: (process.env.APP_PROTOCOL || 'http').replace(':', ''),

  // Database
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    name: process.env.DB_NAME || 'weather_app_db',
    user: process.env.DB_USER || '',
    password: process.env.DB_PASSWORD || '',
    schema: process.env.DB_SCHEMA || undefined,
    ssl: process.env.DB_SSL === 'true',
  },

  // External APIs
  weatherstack: {
    apiKey: process.env.WEATHERSTACK_API_KEY || '',
  },

  // Rate Limiting
  rateLimit: {
    max: Number(process.env.RATE_LIMIT_MAX) || 60,
    windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 60_000,
  },

  // Logging
  log: {
    level: process.env.LOG_LEVEL || 'info',
  },
} as const;

/**
 * Helper computed properties
 */
export const isDevelopment = config.nodeEnv === 'development';
export const isProduction = config.nodeEnv === 'production';
export const isTest = config.nodeEnv === 'test';
