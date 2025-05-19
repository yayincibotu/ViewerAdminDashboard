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

// Configure global connection pool with very conservative limits
// to prevent "too many connections" errors with serverless PostgreSQL
export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  max: 2,                   // Limit maximum connections to avoid overwhelming Neon
  idleTimeoutMillis: 15000, // Close idle connections faster (15s)
  connectionTimeoutMillis: 5000, // Maximum time to wait for a connection
  allowExitOnIdle: true     // Allow clients to exit if pool is empty
});

// Determine if we're in production environment (affects connection handling)
const isProduction = process.env.NODE_ENV === 'production';

// Track connection state
let connectionHealthy = true;
let lastConnectionAttempt = 0;
const connectionRetryDelay = 10000; // 10 seconds between connection attempts

// Handle pool errors
pool.on('error', (err) => {
  console.error('Database connection error:', err);
  connectionHealthy = false;
});

// Clean up connections when Node process ends
process.on('exit', () => {
  console.log('Closing database pool on exit');
  pool.end();
});

// Close pool on Ctrl+C
process.on('SIGINT', () => {
  console.log('Closing database pool on SIGINT');
  pool.end();
  process.exit(0);
});

// Create the drizzle connection
export const db = drizzle({ 
  client: pool, 
  schema: {
    ...schema,
    ...digitalProductsSchema,
    ...reviewsSchema
  } 
});

// Function to test database connection with retry logic
export async function testDatabaseConnection() {
  // Rate limit connection tests
  const now = Date.now();
  if (now - lastConnectionAttempt < connectionRetryDelay) {
    console.log('Skipping database connection test (rate limited)');
    return connectionHealthy;
  }
  
  lastConnectionAttempt = now;
  let client;
  
  try {
    client = await pool.connect();
    await client.query('SELECT 1');
    console.log('✓ Database connection successful');
    connectionHealthy = true;
    return true;
  } catch (error) {
    console.error('✗ Database connection failed:', error.message);
    connectionHealthy = false;
    return false;
  } finally {
    if (client) {
      try {
        client.release();
      } catch (e) {
        console.error('Error releasing client:', e.message);
      }
    }
  }
}

// Helper to execute a query with better error handling
export async function executeQuery(queryFn) {
  try {
    return await queryFn();
  } catch (error) {
    // Log error but preserve stack trace
    console.error(`Database query error: ${error.message}`);
    
    // Test connection after errors
    if (connectionHealthy) {
      testDatabaseConnection().catch(() => {});
    }
    
    // Rethrow for handling by caller
    throw error;
  }
}