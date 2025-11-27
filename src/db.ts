import { Pool, PoolConfig } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const poolConfig: PoolConfig = {
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  
  // Security & Performance settings
  ssl: process.env.DB_SSL === 'true' ? {
    rejectUnauthorized: false 
  } : false,
  
  // Connection pool settings
  max: 20, // max connections in pool
  idleTimeoutMillis: 30000, // close idle connections after 30s
  connectionTimeoutMillis: 2000, // timeout for new connection
};

// Singleton pattern - one pool instance for the entire app
const pool = new Pool(poolConfig);

// Event handlers for monitoring
pool.on('connect', () => {
  console.log('✅ Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('Unexpected database connection error:', err);
  process.exit(-1);
});

export const testConnection = async (): Promise<boolean> => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    client.release();
    console.log(' Connection test successful:', result.rows[0].now);
    return true;
  } catch (err) {
    console.error('Connection test failed:', err);
    return false;
  }
};

export default pool;
