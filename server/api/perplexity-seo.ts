import express, { Request, Response } from 'express';
import { z } from 'zod';
import { db } from '../db';
import { isAdmin } from '../auth';
import { generateSEOContent, savePerplexityApiKey, getPerplexityApiKey } from '../perplexity-service';
import { settings } from '../schema/settings';
import { eq } from 'drizzle-orm';

const router = express.Router();

// Middleware to check if Perplexity API key is set
const checkApiKey = async (req: Request, res: Response, next: Function) => {
  const apiKey = await getPerplexityApiKey();
  
  if (!apiKey) {
    return res.status(400).json({ 
      error: 'Missing Perplexity API key', 
      code: 'PERPLEXITY_API_KEY_MISSING'
    });
  }
  
  next();
};

// Set or update Perplexity API key
router.post('/api-key', isAdmin, async (req: Request, res: Response) => {
  try {
    const schema = z.object({
      apiKey: z.string().min(1, 'API key is required')
    });
    
    const { apiKey } = schema.parse(req.body);
    
    const success = await savePerplexityApiKey(
      apiKey,
      req.user?.username || 'admin'
    );
    
    if (success) {
      res.status(200).json({ message: 'Perplexity API key saved successfully' });
    } else {
      res.status(500).json({ error: 'Failed to save API key' });
    }
  } catch (error) {
    console.error('Error saving Perplexity API key:', error);
    res.status(400).json({ 
      error: error instanceof z.ZodError 
        ? error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
        : 'Invalid request data'
    });
  }
});

// Check if Perplexity API key is set
router.get('/api-key-status', isAdmin, async (req: Request, res: Response) => {
  try {
    const apiKey = await getPerplexityApiKey();
    res.json({ 
      hasApiKey: !!apiKey,
      // If there's an API key, mask it for security
      maskedKey: apiKey 
        ? `${apiKey.substring(0, 4)}...${apiKey.substring(apiKey.length - 4)}` 
        : null
    });
  } catch (error) {
    console.error('Error checking API key status:', error);
    res.status(500).json({ error: 'Failed to check API key status' });
  }
});

// Generate SEO content for a digital product
router.post('/generate-seo', isAdmin, checkApiKey, async (req: Request, res: Response) => {
  try {
    const schema = z.object({
      productName: z.string().min(1, 'Product name is required'),
      platform: z.string().min(1, 'Platform is required'),
      category: z.string().min(1, 'Category is required'),
      price: z.number().min(0, 'Price must be a positive number'),
      minOrder: z.number().int().min(1, 'Minimum order must be at least 1'),
      maxOrder: z.number().int().min(1, 'Maximum order must be at least 1'),
      serviceType: z.string().min(1, 'Service type is required'),
      features: z.array(z.string()).optional()
    });
    
    const validatedData = schema.parse(req.body);
    
    const seoContent = await generateSEOContent(validatedData);
    
    if (!seoContent) {
      return res.status(500).json({ error: 'Failed to generate SEO content' });
    }
    
    res.json({
      success: true,
      data: seoContent
    });
  } catch (error) {
    console.error('Error generating SEO content:', error);
    res.status(400).json({ 
      error: error instanceof z.ZodError 
        ? error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
        : 'Invalid request data'
    });
  }
});

export default router;