import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";
import * as digitalProductsSchema from "./schema/digital-products";
import * as reviewsSchema from "./schema/reviews";

// Configure Neon to use websockets
neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Configure connection pool with explicit limits to prevent "too many connections" errors
export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  max: 5,                  // Maximum number of connections in the pool
  idleTimeoutMillis: 30000, // How long a client is allowed to remain idle before being closed
  connectionTimeoutMillis: 5000, // Maximum time to wait for a connection
  allowExitOnIdle: true    // Allow clients to exit if pool is empty
});

// Handle pool errors
pool.on('error', (err) => {
  console.error('Unexpected error on idle database client', err);
});

export const db = drizzle({ 
  client: pool, 
  schema: {
    ...schema,
    ...digitalProductsSchema,
    ...reviewsSchema
  } 
});

// Simple function to test database connection
export async function testDatabaseConnection() {
  let client;
  try {
    client = await pool.connect();
    await client.query('SELECT 1');
    console.log('Database connection successful');
    return true;
  } catch (error) {
    console.error('Database connection error:', error);
    return false;
  } finally {
    if (client) client.release();
  }
}