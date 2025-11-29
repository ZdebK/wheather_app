import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { Property } from './entities/property.entity';
import { logContext } from './utils/logger';
import { config, isDevelopment } from './config';

/**
 * TypeORM DataSource configuration
 * Singleton pattern for database connection
 */
export const AppDataSource = new DataSource({
  type: 'postgres',
  host: config.db.host,
  port: config.db.port,
  username: config.db.user,
  password: config.db.password,
  database: config.db.name,
  schema: config.db.schema,
  ssl: config.db.ssl ? {
    rejectUnauthorized: false,
  } : false,
  synchronize: isDevelopment, // Auto-create tables in dev
  logging: isDevelopment,
  entities: [Property],
  migrations: [],
  subscribers: [],
});

/**
 * Initialize database connection
 */
export const initializeDatabase = async (): Promise<void> => {
  await AppDataSource.initialize();
  logContext.database('Database connection initialized');
};
