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
    // Make sure we're setting the correct content type header
    res.setHeader('Content-Type', 'application/json');
    
    const apiKey = await getPerplexityApiKey();
    console.log('Testing Perplexity API with key available:', !!apiKey);
    
    if (!apiKey) {
      return res.status(400).json({
        success: false,
        message: 'Perplexity API key not found. Please set up your API key in the settings.'
      });
    }
    
    // Instead of generating full content, let's make a simple API call to test the connection
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: "llama-3.1-sonar-small-128k-online",
        messages: [
          {
            role: "system",
            content: "You are a helpful assistant."
          },
          {
            role: "user",
            content: "Hello, this is a test message to verify the API connection. Please respond with 'Connection successful'."
          }
        ],
        temperature: 0.1,
        max_tokens: 20,
        stream: false
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Perplexity API error:', errorText);
      return res.status(response.status).json({
        success: false,
        message: `Failed to connect to Perplexity API: ${response.statusText}`
      });
    }
    
    const data = await response.json();
    
    return res.json({
      success: true,
      message: 'Perplexity API connection successful!'
    });
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