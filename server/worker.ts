import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { prettyJSON } from 'hono/pretty-json';
import { serveStatic } from 'hono/cloudflare-workers';
import { handle } from 'hono/vercel';

// Types
interface Env {
  VIEWER_KV: KVNamespace;
  DB: D1Database;
}

// Create Hono app
const app = new Hono<{ Bindings: Env }>();

// Middleware
app.use('*', logger());
app.use('*', prettyJSON());
app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  exposeHeaders: ['Content-Length', 'X-Kuma-Revision'],
  maxAge: 600,
  credentials: true,
}));

// Static files
app.get('/assets/*', serveStatic({ root: './' }));

// Health check
app.get('/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.get('/api/products', async (c) => {
  try {
    const { results } = await c.env.DB.prepare(
      'SELECT * FROM products ORDER BY created_at DESC'
    ).all();
    return c.json(results);
  } catch (error) {
    console.error('Error fetching products:', error);
    return c.json({ error: 'Internal Server Error' }, 500);
  }
});

app.get('/api/products/:id', async (c) => {
  const id = c.req.param('id');
  try {
    const product = await c.env.DB.prepare(
      'SELECT * FROM products WHERE id = ?'
    ).bind(id).first();
    
    if (!product) {
      return c.json({ error: 'Product not found' }, 404);
    }
    
    return c.json(product);
  } catch (error) {
    console.error('Error fetching product:', error);
    return c.json({ error: 'Internal Server Error' }, 500);
  }
});

// Auth routes
app.post('/api/auth/login', async (c) => {
  const { username, password } = await c.req.json();
  
  try {
    const user = await c.env.DB.prepare(
      'SELECT * FROM users WHERE username = ?'
    ).bind(username).first();
    
    if (!user) {
      return c.json({ error: 'Invalid credentials' }, 401);
    }
    
    // In production, use proper password hashing
    if (user.password !== password) {
      return c.json({ error: 'Invalid credentials' }, 401);
    }
    
    // Generate session token
    const token = crypto.randomUUID();
    await c.env.VIEWER_KV.put(`session:${token}`, JSON.stringify({
      userId: user.id,
      expiresAt: Date.now() + 24 * 60 * 60 * 1000 // 24 hours
    }));
    
    return c.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return c.json({ error: 'Internal Server Error' }, 500);
  }
});

// Error handling
app.onError((err, c) => {
  console.error(`${err}`);
  return c.json({ error: 'Internal Server Error' }, 500);
});

// 404 handler
app.notFound((c) => {
  return c.json({ error: 'Not Found' }, 404);
});

// Export for Cloudflare Workers
export default app;

// Export for Vercel
export const handle = app.handle; 