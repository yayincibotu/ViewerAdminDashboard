/**
 * Performance Optimization Middleware
 * This middleware applies various performance optimizations based on system configuration
 */
import { Request, Response, NextFunction } from 'express';
import { db } from '../db';
import { systemConfigs } from '@shared/schema';
import { eq } from 'drizzle-orm';

// Cache configuration in memory to avoid database queries on every request
let configCache: Record<string, string> = {};
let lastCacheUpdate = 0;
const CACHE_TTL = 60 * 1000; // 1 minute

/**
 * Get performance configuration values
 */
async function getPerformanceConfigs() {
  const now = Date.now();
  
  // Refresh cache if it's older than TTL
  if (now - lastCacheUpdate > CACHE_TTL || Object.keys(configCache).length === 0) {
    const configs = await db.select().from(systemConfigs).where(eq(systemConfigs.category, 'performance'));
    
    // Reset cache
    configCache = {};
    
    // Update cache
    for (const config of configs) {
      if (config.key && config.value) {
        configCache[config.key] = config.value;
      }
    }
    
    lastCacheUpdate = now;
  }
  
  return configCache;
}

/**
 * Apply performance optimizations based on system configuration
 */
export async function performanceMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    const configs = await getPerformanceConfigs();
    
    // Skip for API routes to avoid unnecessary overhead
    if (req.path.startsWith('/api/')) {
      // Only apply cache headers for API routes if configured
      if (configs['cache_max_age_api']) {
        const maxAge = parseInt(configs['cache_max_age_api']);
        if (!isNaN(maxAge) && maxAge > 0) {
          res.setHeader('Cache-Control', `private, max-age=${maxAge}`);
        }
      }
      
      return next();
    }
    
    // Apply performance optimizations based on configuration
    
    // 1. Browser Caching
    // Apply cache headers based on content type
    res.on('finish', () => {
      const contentType = res.getHeader('Content-Type') as string || '';
      
      if (contentType.includes('image')) {
        if (configs['cache_max_age_images']) {
          const maxAge = parseInt(configs['cache_max_age_images']);
          if (!isNaN(maxAge) && maxAge > 0) {
            res.setHeader('Cache-Control', `public, max-age=${maxAge}, stale-while-revalidate=604800`);
          }
        }
      } else if (contentType.includes('javascript') || contentType.includes('css')) {
        if (configs['cache_max_age_static']) {
          const maxAge = parseInt(configs['cache_max_age_static']);
          if (!isNaN(maxAge) && maxAge > 0) {
            res.setHeader('Cache-Control', `public, max-age=${maxAge}, immutable`);
          }
        }
      }
    });
    
    // 2. Preconnect and preload directives
    if (configs['optimize_preconnect'] === 'true') {
      // Add preconnect for common third-party domains
      res.setHeader('Link', [
        '<https://fonts.googleapis.com>; rel=preconnect; crossorigin',
        '<https://fonts.gstatic.com>; rel=preconnect; crossorigin',
        '<https://cdnjs.cloudflare.com>; rel=preconnect; crossorigin'
      ].join(', '));
    }
    
    // 3. Compression
    // This is handled by Express compression middleware
    
    next();
  } catch (error) {
    console.error('Error in performance middleware:', error);
    next();
  }
}

/**
 * Get HTML transformation function based on active performance optimizations
 */
export function getHtmlTransformer(html: string): string {
  // We'll apply HTML transformations based on active performance optimizations
  try {
    // Apply optimizations that don't require database access
    // For more complex optimizations, use the middleware
    
    // 1. Add viewport meta tag if missing
    if (!html.includes('<meta name="viewport"')) {
      html = html.replace('<head>', '<head><meta name="viewport" content="width=device-width, initial-scale=1.0">');
    }
    
    // 2. Add defer attribute to non-critical scripts
    if (configCache['optimize_defer_js'] === 'true') {
      html = html.replace(/<script((?!defer|async).)*src=["']([^"']+)["'][^>]*>/g, (match) => {
        // Skip if already has defer or async
        if (match.includes('defer') || match.includes('async')) {
          return match;
        }
        
        // Add defer attribute
        return match.replace('<script', '<script defer');
      });
    }
    
    // 3. Add preconnect for critical third-party domains
    if (configCache['optimize_preconnect'] === 'true') {
      const preconnectLinks = `
    <link rel="preconnect" href="https://fonts.googleapis.com" crossorigin>
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link rel="preconnect" href="https://cdnjs.cloudflare.com" crossorigin>`;
      
      html = html.replace('</head>', `${preconnectLinks}</head>`);
    }
    
    return html;
  } catch (error) {
    console.error('Error in HTML transformer:', error);
    return html;
  }
}