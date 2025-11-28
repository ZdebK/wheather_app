import 'reflect-metadata';
import { DataSource } from 'typeorm';
import dotenv from 'dotenv';
import { Property } from './entities/property.entity';
import { logContext } from './utils/logger';

dotenv.config();

/**
 * TypeORM DataSource configuration
 * Singleton pattern for database connection
 */
export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: process.env.DB_SSL === 'true' ? {
    rejectUnauthorized: false,
  } : false,
  synchronize: process.env.NODE_ENV === 'development', // Auto-create tables in dev
  logging: process.env.NODE_ENV === 'development',
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
