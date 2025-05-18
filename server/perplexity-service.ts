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
    
    console.log('Found Perplexity API key setting:', apiKeySetting);
    
    // If there's an API key setting in the database, return its value
    if (apiKeySetting?.value) {
      return apiKeySetting.value;
    }
    
    // Check if we have an API key in the environment variables as a fallback
    const envApiKey = process.env.PERPLEXITY_API_KEY;
    if (envApiKey) {
      console.log('Using Perplexity API key from environment variables');
      return envApiKey;
    }
    
    return null;
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
        stream: false
      })
    });
    
    if (!response.ok) {
      throw new Error(`API call failed with status: ${response.status} - ${response.statusText}`);
    }
    
    const data = await response.json() as PerplexityResponse;
    
    // Parse the content as JSON
    try {
      const content = data.choices[0].message.content;
      console.log('Perplexity response content:', content);
      
      // Check if content is wrapped in markdown code blocks and extract it
      let jsonContent = content;
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (jsonMatch && jsonMatch[1]) {
        jsonContent = jsonMatch[1].trim();
        console.log('Extracted JSON content from code blocks:', jsonContent);
      }
      
      const parsedContent = JSON.parse(jsonContent);
      
      // Add citations from the Perplexity response
      return {
        ...parsedContent,
        citations: data.citations || []
      };
    } catch (parseError) {
      console.error('Error parsing JSON response from Perplexity:', parseError);
      
      // Try to extract structured data even if not properly formatted as JSON
      const content = data.choices[0].message.content;
      
      // Create a fallback response that ensures we return something useful
      return {
        title: options.productName || "Generated SEO Title",
        metaDescription: `${options.productName} for ${options.platform} - Best ${options.category} service with fast delivery. Starting at $${options.price}`,
        mainContent: `# ${options.productName}\n\n${content}`,
        faq: [
          { 
            question: `What is ${options.productName}?`, 
            answer: `${options.productName} is a ${options.serviceType} for ${options.platform} that provides ${options.category} services.` 
          },
          { 
            question: `How much does ${options.productName} cost?`, 
            answer: `The price for ${options.productName} starts at $${options.price}.` 
          },
          {
            question: `What is the minimum order quantity for ${options.productName}?`,
            answer: `The minimum order quantity for ${options.productName} is ${options.minOrder}.`
          },
          {
            question: `What is the maximum order quantity for ${options.productName}?`,
            answer: `The maximum order quantity for ${options.productName} is ${options.maxOrder}.`
          },
          {
            question: `Is ${options.productName} safe to use?`,
            answer: `Yes, ${options.productName} is completely safe to use and follows all ${options.platform} guidelines.`
          }
        ],
        lsiKeywords: [
          options.platform, 
          options.category, 
          "social media", 
          "marketing", 
          "services",
          `${options.platform} ${options.category}`,
          `buy ${options.platform} ${options.category}`,
          `increase ${options.platform} presence`,
          `${options.platform} growth`,
          `${options.platform} marketing`
        ],
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