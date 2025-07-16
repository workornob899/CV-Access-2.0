import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

// Configure Neon for serverless WebSocket support
neonConfig.webSocketConstructor = ws;

// Use the new Neon database URL directly
const newNeonUrl = 'postgresql://neondb_owner:npg_4yUoSEVAfsB5@ep-shiny-star-adbs72zc-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

// Override environment variable with new URL
process.env.DATABASE_URL = newNeonUrl;

// Production-grade database URL validation
if (!newNeonUrl) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Validate DATABASE_URL format for Neon
if (!newNeonUrl.startsWith('postgresql://') && !newNeonUrl.startsWith('postgres://')) {
  throw new Error(
    "Invalid DATABASE_URL format. Expected PostgreSQL connection string starting with 'postgresql://' or 'postgres://'"
  );
}

const cleanDatabaseUrl = newNeonUrl;

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