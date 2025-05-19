/**
 * Performance Controller
 * This handles initializing and applying performance optimizations
 */
import { storage } from './storage';
import { db } from './db';
import { systemConfigs } from '@shared/schema';
import { eq } from 'drizzle-orm';

// Default performance configurations 
const defaultPerformanceConfigs = [
  {
    key: 'cache_max_age_images',
    value: '2592000', // 30 days in seconds
    description: 'Cache duration for images in seconds',
    category: 'performance'
  },
  {
    key: 'cache_max_age_static',
    value: '604800', // 7 days in seconds
    description: 'Cache duration for static assets (JS/CSS) in seconds',
    category: 'performance'
  },
  {
    key: 'cache_max_age_api',
    value: '300', // 5 minutes in seconds
    description: 'Cache duration for API responses in seconds',
    category: 'performance'
  },
  {
    key: 'optimize_minify_css',
    value: 'true',
    description: 'Minify CSS to reduce file size',
    category: 'performance'
  },
  {
    key: 'optimize_minify_js',
    value: 'true',
    description: 'Minify JavaScript to reduce file size',
    category: 'performance'
  },
  {
    key: 'optimize_defer_js',
    value: 'true',
    description: 'Load JavaScript with defer attribute to prevent render blocking',
    category: 'performance'
  },
  {
    key: 'optimize_css_delivery',
    value: 'true',
    description: 'Optimize CSS delivery to reduce render blocking',
    category: 'performance'
  },
  {
    key: 'optimize_preconnect',
    value: 'true',
    description: 'Use preconnect for critical third-party domains',
    category: 'performance'
  },
  {
    key: 'optimize_preload',
    value: 'true',
    description: 'Preload critical resources',
    category: 'performance'
  },
  {
    key: 'image_lazy_loading',
    value: 'true',
    description: 'Lazy load images to improve initial page load time',
    category: 'performance'
  },
  {
    key: 'image_dimensions',
    value: 'true',
    description: 'Add width and height attributes to images to prevent layout shifts',
    category: 'performance'
  },
  {
    key: 'image_compression',
    value: 'true',
    description: 'Compress images to reduce file size',
    category: 'performance'
  },
  {
    key: 'image_next_gen_formats',
    value: 'true',
    description: 'Use modern image formats like WebP',
    category: 'performance'
  },
  {
    key: 'image_quality',
    value: '80',
    description: 'Default quality for image compression (1-100)',
    category: 'performance'
  },
  {
    key: 'optimize_lcp',
    value: 'true',
    description: 'Optimize Largest Contentful Paint',
    category: 'performance'
  },
  {
    key: 'optimize_fid',
    value: 'true',
    description: 'Optimize First Input Delay',
    category: 'performance'
  },
  {
    key: 'optimize_cls',
    value: 'true',
    description: 'Optimize Cumulative Layout Shift',
    category: 'performance'
  }
];

/**
 * Initialize default performance configurations if they don't exist
 */
export async function initializePerformanceConfigs() {
  try {
    console.log('Initializing performance configurations...');
    
    // Check existing performance configs
    const existingConfigs = await db.select().from(systemConfigs).where(eq(systemConfigs.category, 'performance'));
    const existingKeys = new Set(existingConfigs.map(config => config.key));
    
    // Create missing configs
    const missingConfigs = defaultPerformanceConfigs.filter(config => !existingKeys.has(config.key));
    
    if (missingConfigs.length > 0) {
      console.log(`Creating ${missingConfigs.length} missing performance configurations...`);
      
      // Insert all missing configs
      for (const config of missingConfigs) {
        await storage.createSystemConfig({
          ...config,
          isEncrypted: false,
          lastUpdatedBy: null
        });
      }
      
      console.log('Performance configurations initialized successfully.');
    } else {
      console.log('All performance configurations already exist.');
    }
    
    return { success: true, message: `${missingConfigs.length} performance configs initialized` };
  } catch (error) {
    console.error('Error initializing performance configurations:', error);
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Get active performance configuration
 */
export async function getActivePerformanceConfig() {
  try {
    const configs = await db.select().from(systemConfigs).where(eq(systemConfigs.category, 'performance'));
    
    // Convert to a key-value map for easier access
    const configMap: Record<string, string> = {};
    
    for (const config of configs) {
      if (config.key && config.value) {
        configMap[config.key] = config.value;
      }
    }
    
    return configMap;
  } catch (error) {
    console.error('Error fetching performance configurations:', error);
    return {};
  }
}