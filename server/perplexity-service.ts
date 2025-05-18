/**
 * Perplexity AI API Service for enhanced SEO content generation
 */
import fetch from 'node-fetch';
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
    const [apiKeySetting] = await db
      .select()
      .from(settings)
      .where(eq(settings.key, 'perplexity_api_key'));
    
    return apiKeySetting?.value || null;
  } catch (error) {
    console.error('Error retrieving Perplexity API key:', error);
    return null;
  }
}

/**
 * Generate SEO content using Perplexity AI
 */
export async function generateSEOContent(options: SEOContentOptions): Promise<{
  title: string;
  metaDescription: string;
  mainContent: string;
  faq: { question: string; answer: string }[];
  lsiKeywords: string[];
  citations: string[];
} | null> {
  const apiKey = await getPerplexityApiKey();
  
  if (!apiKey) {
    console.error('Perplexity API key not found in settings');
    return null;
  }
  
  try {
    // Build the prompt with specific instructions for SEO content
    const featuresText = options.features?.length 
      ? `The service offers these features: ${options.features.join(', ')}.` 
      : '';
    
    const prompt = `Generate SEO-optimized content for a digital service that provides ${options.serviceType} for ${options.platform}. 
    
Product details:
- Name: ${options.productName}
- Platform: ${options.platform}
- Category: ${options.category}
- Price: $${options.price}
- Minimum order: ${options.minOrder}
- Maximum order: ${options.maxOrder}
${featuresText}

I need the following output in JSON format:
1. SEO title (max 60 characters)
2. Meta description (max 160 characters)
3. Main content with H1, H2 headings and 3-4 paragraphs (600-800 words)
4. 5 FAQ questions and answers related to the service
5. 10 LSI keywords for semantic relevance

Format the response as valid JSON with these keys: title, metaDescription, mainContent, faq (array of {question, answer}), lsiKeywords (array of strings).`;

    // Make the API call to Perplexity
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
            content: "You are an expert SEO content writer specializing in digital services for social media marketing. Create highly optimized content that follows SEO best practices and ranks well on Google."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.2,
        max_tokens: 2000,
        top_p: 0.9,
        search_domain_filter: ["smm", "social-media", "viewer-bot", "social-media-marketing"],
        return_images: false,
        return_related_questions: false,
        search_recency_filter: "month",
        top_k: 0,
        stream: false,
        presence_penalty: 0,
        frequency_penalty: 1
      })
    });
    
    if (!response.ok) {
      throw new Error(`API call failed with status: ${response.status} - ${response.statusText}`);
    }
    
    const data = await response.json() as PerplexityResponse;
    
    // Parse the content as JSON
    try {
      const content = data.choices[0].message.content;
      const parsedContent = JSON.parse(content);
      
      // Add citations from the Perplexity response
      return {
        ...parsedContent,
        citations: data.citations || []
      };
    } catch (parseError) {
      console.error('Error parsing JSON response from Perplexity:', parseError);
      
      // Try to extract structured data even if not properly formatted as JSON
      const content = data.choices[0].message.content;
      const titleMatch = content.match(/\"title\":\s*\"([^\"]+)\"/);
      const metaDescriptionMatch = content.match(/\"metaDescription\":\s*\"([^\"]+)\"/);
      const mainContentMatch = content.match(/\"mainContent\":\s*\"([^\"]+)\"/);
      
      return {
        title: titleMatch?.[1] || "Generated Title",
        metaDescription: metaDescriptionMatch?.[1] || "Generated meta description for the service.",
        mainContent: mainContentMatch?.[1] || content,
        faq: [],
        lsiKeywords: [],
        citations: data.citations || []
      };
    }
    
  } catch (error) {
    console.error('Error generating SEO content with Perplexity:', error);
    return null;
  }
}

/**
 * Save API key to settings
 */
export async function savePerplexityApiKey(apiKey: string, updatedBy: string): Promise<boolean> {
  try {
    const [existing] = await db
      .select()
      .from(settings)
      .where(eq(settings.key, 'perplexity_api_key'));
    
    if (existing) {
      await db
        .update(settings)
        .set({ 
          value: apiKey,
          last_updated_by: updatedBy,
          updated_at: new Date()
        })
        .where(eq(settings.id, existing.id));
    } else {
      await db.insert(settings).values({
        key: 'perplexity_api_key',
        value: apiKey,
        description: 'API key for Perplexity AI content generation',
        category: 'api_keys',
        is_encrypted: true,
        last_updated_by: updatedBy
      });
    }
    
    return true;
  } catch (error) {
    console.error('Error saving Perplexity API key:', error);
    return false;
  }
}