/**
 * Perplexity SEO Content Generation API
 * This API endpoint handles requests for generating SEO content using Perplexity AI
 */
import express, { Request, Response } from 'express';
import { generateSEOContent } from '../perplexity-service';
import { db } from '../db';
import { digitalProducts } from '../schema/digital-products';
import { eq } from 'drizzle-orm';

const router = express.Router();

/**
 * Test the Perplexity API connection
 */
router.post("/test", async (req: Request, res: Response) => {
  try {
    const { apiKey } = req.body;
    
    // Test connection to Perplexity API
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
            role: "user",
            content: "Test connection"
          }
        ],
        max_tokens: 5,
        temperature: 0.1,
        stream: false
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      return res.status(400).json({ 
        success: false, 
        message: `API connection failed: ${response.status} - ${response.statusText}`,
        error: errorText
      });
    }
    
    const data = await response.json();
    
    return res.json({
      success: true,
      message: 'Successfully connected to Perplexity API',
      model: data.model
    });
  } catch (error: any) {
    console.error('Error testing Perplexity API:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to connect to Perplexity API',
      error: error.message
    });
  }
});

/**
 * Generate SEO content for a product
 */
router.post("/generate", async (req: Request, res: Response) => {
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
        message: 'Missing required fields for SEO content generation'
      });
    }
    
    const seoContent = await generateSEOContent({
      productName,
      platform,
      category,
      price: parseFloat(price) || 0,
      minOrder: parseInt(minOrder) || 1,
      maxOrder: parseInt(maxOrder) || 100,
      serviceType: serviceType || 'viewer service',
      features: features || []
    });
    
    if (!seoContent) {
      return res.status(500).json({
        success: false,
        message: 'Failed to generate SEO content. Check Perplexity API key in Settings.'
      });
    }
    
    return res.json({
      success: true,
      message: 'SEO content generated successfully',
      data: seoContent
    });
  } catch (error: any) {
    console.error('Error generating SEO content:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to generate SEO content',
      error: error.message
    });
  }
});

/**
 * Save SEO content to a product
 */
router.patch("/product/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      seoTitle,
      seoDescription,
      lsiKeywords,
      faqQuestions,
      faqAnswers,
      productDescription
    } = req.body;
    
    // Update the product with the SEO content
    await db.update(digitalProducts)
      .set({
        seo_title: seoTitle,
        seo_description: seoDescription,
        lsi_keywords: lsiKeywords,
        faq_questions: faqQuestions,
        faq_answers: faqAnswers,
        product_description: productDescription,
        updated_at: new Date()
      })
      .where(eq(digitalProducts.id, parseInt(id)));
    
    return res.json({
      success: true,
      message: 'SEO content saved successfully'
    });
  } catch (error: any) {
    console.error('Error saving SEO content:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to save SEO content',
      error: error.message
    });
  }
});

export default router;