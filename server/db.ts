import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

// Configure Neon for serverless WebSocket support
neonConfig.webSocketConstructor = ws;

// Production-grade database URL validation
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Validate DATABASE_URL format for Neon
const databaseUrl = process.env.DATABASE_URL.trim();
if (!databaseUrl.startsWith('postgresql://') && !databaseUrl.startsWith('postgres://')) {
  throw new Error(
    "Invalid DATABASE_URL format. Expected PostgreSQL connection string starting with 'postgresql://' or 'postgres://'"
  );
}

// Clean the DATABASE_URL by removing any surrounding quotes
const cleanDatabaseUrl = databaseUrl.replace(/^'|'$/g, '');

// Enhanced connection pool configuration for Neon
export const pool = new Pool({ 
  connectionString: cleanDatabaseUrl,
  // Neon-specific optimizations
  max: 20, // Maximum number of connections in the pool
  idleTimeoutMillis: 30000, // 30 seconds before idle connections are closed
  connectionTimeoutMillis: 10000, // 10 seconds to establish connection
  // Enable keep-alive for better connection stability
  keepAlive: true,
  keepAliveInitialDelayMillis: 0
});

export const db = drizzle({ client: pool, schema });

// Add connection health check
export async function testConnection() {
  try {
    const result = await pool.query('SELECT 1 as health_check');
    return result.rows[0].health_check === 1;
  } catch (error) {
    console.error('Database health check failed:', error);
    return false;
  }
}