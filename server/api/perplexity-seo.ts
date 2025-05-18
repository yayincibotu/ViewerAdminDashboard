/**
 * Perplexity API endpoints for SEO content generation
 */
import express from 'express';
import { getPerplexityApiKey, generateSEOContent, savePerplexityApiKey } from '../perplexity-service';
import { isAdmin } from '../auth';

const router = express.Router();

// Middleware to ensure user is authenticated and has admin rights
router.use(isAdmin);

/**
 * Test the Perplexity API connection
 */
router.get('/test', async (req, res) => {
  try {
    const apiKey = await getPerplexityApiKey();
    
    if (!apiKey) {
      return res.status(400).json({
        success: false,
        message: 'Perplexity API key not found. Please set up your API key in the settings.'
      });
    }
    
    // Simple test prompt to verify the API connection
    const testContent = await generateSEOContent({
      productName: 'Test Product',
      platform: 'Twitch',
      category: 'Live Viewers',
      price: 10,
      minOrder: 100,
      maxOrder: 1000,
      serviceType: 'viewer bot'
    });
    
    if (testContent) {
      return res.json({
        success: true,
        message: 'Perplexity API connection successful!',
      });
    } else {
      return res.status(400).json({
        success: false,
        message: 'Failed to generate content. Please check your API key.'
      });
    }
  } catch (error: any) {
    console.error('Error testing Perplexity API:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'An error occurred while testing the Perplexity API connection'
    });
  }
});

/**
 * Generate SEO content for a digital product
 */
router.post('/generate', async (req, res) => {
  try {
    const { 
      productId, 
      productName, 
      platform, 
      category, 
      price, 
      minOrder, 
      maxOrder, 
      serviceType, 
      features 
    } = req.body;
    
    if (!productName || !platform || !category) {
      return res.status(400).json({
        success: false,
        message: 'Missing required product information'
      });
    }
    
    const content = await generateSEOContent({
      productName,
      platform,
      category,
      price: price || 0,
      minOrder: minOrder || 1,
      maxOrder: maxOrder || 1000,
      serviceType: serviceType || 'viewer service',
      features: features || []
    });
    
    if (!content) {
      return res.status(500).json({
        success: false,
        message: 'Failed to generate SEO content'
      });
    }
    
    return res.json({
      success: true,
      data: content
    });
    
  } catch (error: any) {
    console.error('Error generating SEO content:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'An error occurred while generating SEO content'
    });
  }
});

/**
 * Update Perplexity API key
 */
router.post('/api-key', async (req, res) => {
  try {
    const { apiKey } = req.body;
    
    if (!apiKey) {
      return res.status(400).json({
        success: false,
        message: 'API key is required'
      });
    }
    
    const username = req.user?.username || 'admin';
    const success = await savePerplexityApiKey(apiKey, username);
    
    if (success) {
      return res.json({
        success: true,
        message: 'Perplexity API key saved successfully'
      });
    } else {
      return res.status(500).json({
        success: false,
        message: 'Failed to save API key'
      });
    }
    
  } catch (error: any) {
    console.error('Error saving Perplexity API key:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'An error occurred while saving the API key'
    });
  }
});

export default router;