import { Router, Request, Response } from 'express';
import { db } from '../db';
import { generateSEOContent } from '../perplexity-service';
import { isAdmin } from '../auth';

const router = Router();

// Middleware to check if API key exists
const checkApiKey = async (req: Request, res: Response, next: Function) => {
  try {
    const apiKey = await db.query.settings.findFirst({
      where: (settings, { eq }) => eq(settings.key, 'PERPLEXITY_API_KEY')
    });
    
    if (!apiKey || !apiKey.value) {
      return res.status(400).json({ 
        error: 'Perplexity API key not found. Please add it in Settings > API Keys section.' 
      });
    }
    
    next();
  } catch (error) {
    console.error('Error checking Perplexity API key:', error);
    res.status(500).json({ error: 'Failed to check Perplexity API key' });
  }
};

// Generate SEO content using Perplexity AI
router.post('/generate-seo', isAdmin, checkApiKey, async (req: Request, res: Response) => {
  try {
    const { productName, platform, category, price, minOrder, maxOrder, serviceType, features } = req.body;
    
    if (!productName || !platform || !category) {
      return res.status(400).json({ error: 'Product name, platform, and category are required' });
    }
    
    const seoContent = await generateSEOContent({
      productName,
      platform,
      category,
      price: parseFloat(price) || 0,
      minOrder: parseInt(minOrder) || 1,
      maxOrder: parseInt(maxOrder) || 1000,
      serviceType: serviceType || 'instant',
      features: features || []
    });
    
    if (!seoContent) {
      return res.status(500).json({ error: 'Failed to generate SEO content' });
    }
    
    res.json(seoContent);
  } catch (error) {
    console.error('Error generating SEO content:', error);
    res.status(500).json({ error: 'Failed to generate SEO content' });
  }
});

export default router;