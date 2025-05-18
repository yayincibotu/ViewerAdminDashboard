/**
 * Perplexity AI API Service for enhanced SEO content generation
 */
import { db } from './db';
import { settings } from './schema/settings';
import { eq } from 'drizzle-orm';

interface PerplexityResponse {
  id: string;
  model: string;
  object: string;
  created: number;
  citations: string[];
  choices: {
    index: number;
    finish_reason: string;
    message: {
      role: string;
      content: string;
    };
    delta: {
      role: string;
      content: string;
    };
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

interface SEOContentOptions {
  productName: string;
  platform: string;
  category: string;
  price: number;
  minOrder: number;
  maxOrder: number;
  serviceType: string;
  features?: string[];
}

/**
 * Fetch Perplexity API key from settings
 */
export async function getPerplexityApiKey(): Promise<string | null> {
  try {
    const settingRecord = await db.select().from(settings).where(eq(settings.key, 'PERPLEXITY_API_KEY')).limit(1);
    if (settingRecord.length > 0 && settingRecord[0].value) {
      return settingRecord[0].value;
    }
    return null;
  } catch (error) {
    console.error('Error fetching Perplexity API key:', error);
    return null;
  }
}

/**
 * Generate SEO content using Perplexity AI
 */
export async function generateSEOContent(options: SEOContentOptions): Promise<{
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string;
  seoFaqs: { question: string; answer: string }[];
  semanticContent: string;
} | null> {
  try {
    const apiKey = await getPerplexityApiKey();
    
    if (!apiKey) {
      console.error('Perplexity API key not found in settings');
      return null;
    }

    // Create a specialized prompt for generating SEO content
    const prompt = `
    I need comprehensive SEO content for a social media marketing service with the following details:
    
    Product: ${options.productName}
    Platform: ${options.platform}
    Category: ${options.category}
    Price: $${options.price}
    Min Order: ${options.minOrder}
    Max Order: ${options.maxOrder}
    Service Type: ${options.serviceType}
    Features: ${options.features ? options.features.join(', ') : 'None specified'}
    
    Please generate the following in a JSON format:
    1. An SEO title (under 60 characters)
    2. An SEO meta description (150-160 characters) that includes benefits and call to action
    3. A list of SEO keywords (comma separated) including long-tail keywords
    4. 5 FAQ questions and answers related to this service
    5. A 300-word semantic content section for the product details page
    
    Format everything as valid JSON with these keys: "seoTitle", "seoDescription", "seoKeywords", "seoFaqs" (array of objects with "question" and "answer"), and "semanticContent".
    
    Make sure to: 
    - Include the platform name (${options.platform}) and category (${options.category}) in the title and description
    - Use relevant industry-specific terms for social media marketing
    - Focus on benefits, safety, speed, and reliability
    - Use persuasive language that encourages purchase
    - Include keywords about growth, engagement, and visibility
    
    Return only the JSON response with no additional explanation.`;

    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.1-sonar-small-128k-online',
        messages: [
          {
            role: 'system',
            content: 'You are a skilled SEO specialist who creates optimized content for social media marketing services. Return only JSON format.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 1500,
        temperature: 0.2,
        return_images: false,
        return_related_questions: false,
        frequency_penalty: 1,
        response_format: { type: "json_object" }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Perplexity API error (${response.status}):`, errorText);
      return null;
    }

    const data = await response.json() as PerplexityResponse;
    
    if (!data.choices || data.choices.length === 0 || !data.choices[0].message.content) {
      console.error('Invalid response from Perplexity API:', data);
      return null;
    }

    const contentStr = data.choices[0].message.content;
    try {
      const seoContent = JSON.parse(contentStr);
      return {
        seoTitle: seoContent.seoTitle || '',
        seoDescription: seoContent.seoDescription || '',
        seoKeywords: seoContent.seoKeywords || '',
        seoFaqs: seoContent.seoFaqs || [],
        semanticContent: seoContent.semanticContent || ''
      };
    } catch (error) {
      console.error('Error parsing Perplexity API response:', error);
      return null;
    }
  } catch (error) {
    console.error('Error generating SEO content:', error);
    return null;
  }
}