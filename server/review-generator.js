// Automated review generation system
import { pool } from './db.js';

/**
 * Generate and schedule random reviews for products
 * This will be called daily to add up to 3 reviews per product
 */
export async function scheduleRandomReviews() {
  try {
    // Get all active digital products
    const { rows: products } = await pool.query(
      `SELECT * FROM digital_products WHERE is_active = true`
    );
    
    console.log(`Scheduling reviews for ${products.length} active products`);
    
    for (const product of products) {
      // Random number of reviews to add for this product (0-3)
      const reviewCount = Math.floor(Math.random() * 4); // 0-3 reviews
      
      if (reviewCount === 0) {
        console.log(`Skipping product ${product.id}: ${product.name} - no reviews scheduled today`);
        continue;
      }
      
      console.log(`Scheduling ${reviewCount} reviews for product ${product.id}: ${product.name}`);
      
      for (let i = 0; i < reviewCount; i++) {
        // Random delay between 1 minute and 23 hours to spread throughout the day
        const delayMinutes = Math.floor(Math.random() * (60 * 23)) + 1;
        const delayMs = delayMinutes * 60 * 1000;
        
        // Schedule this review
        setTimeout(() => {
          addRandomReview(product);
        }, delayMs);
        
        console.log(`  - Scheduled review #${i+1} in ${delayMinutes} minutes`);
      }
    }
    
    return { success: true, message: `Scheduled reviews for ${products.length} products` };
  } catch (error) {
    console.error('Error scheduling reviews:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Add a single random review for a product
 */
async function addRandomReview(product) {
  try {
    // Generate a rating (weighted towards higher ratings)
    const ratingDistribution = [3, 4, 4, 5, 5, 5];
    const rating = ratingDistribution[Math.floor(Math.random() * ratingDistribution.length)];
    
    // Generate review content
    const { title, content, pros, cons } = generateReviewContent(
      product.name, 
      product.category || 'digital service',
      rating
    );
    
    // Random verification status (70% are verified)
    const verifiedPurchase = Math.random() < 0.7;
    
    // Random country codes (for display variety)
    const countryCodes = ['US', 'GB', 'CA', 'DE', 'FR', 'ES', 'IT', 'AU', 'JP', 'BR'];
    const countryCode = countryCodes[Math.floor(Math.random() * countryCodes.length)];
    
    // Random device types
    const deviceTypes = ['desktop', 'mobile', 'tablet'];
    const deviceType = deviceTypes[Math.floor(Math.random() * deviceTypes.length)];
    
    // Random username generation
    const usernames = [
      'gamer123', 'streamer_pro', 'content_creator', 'twitch_fan', 'social_media_guru',
      'youtube_lover', 'stream_viewer', 'digital_nomad', 'tech_enthusiast', 'video_creator',
      'broadcast_fan', 'live_stream_watcher', 'channel_supporter', 'media_buff', 'online_presence'
    ];
    const username = usernames[Math.floor(Math.random() * usernames.length)];
    
    // Insert the review
    const result = await pool.query(
      `INSERT INTO product_reviews 
         (product_id, rating, title, content, pros, cons, verified_purchase, 
          platform, device_type, status, source, country_code, username) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) 
       RETURNING *`,
      [
        product.id, 
        rating, 
        title, 
        content, 
        pros, 
        cons, 
        verifiedPurchase,
        product.platform_id ? 'twitch' : 'other', // Default to twitch or based on product
        deviceType, 
        'published', 
        'auto',
        countryCode,
        username
      ]
    );
    
    console.log(`✅ Added automated review for product ${product.id}: "${title}" (${rating}★)`);
    return result.rows[0];
  } catch (error) {
    console.error(`Error adding random review for product ${product.id}:`, error);
    return null;
  }
}

/**
 * Helper function to generate review content
 */
function generateReviewContent(productName, category, rating) {
  const titleTemplates = [
    "Great service, very satisfied",
    "Does exactly what it promises",
    "Worth the money",
    "Good quality service",
    "Fast delivery and good results",
    "Exactly what I needed",
    "Impressive service",
    "Smooth experience",
    "Reliable service",
    "Excellent value for money"
  ];
  
  const contentTemplates = [
    `I tried this ${category} service for my channel and was really impressed with the results. The delivery process was smooth and the quality exceeded my expectations.`,
    `The ${category} service was excellent. The quality was good and delivery was even faster than promised. Will definitely order again when needed.`,
    `This service helped me break through the initial viewer threshold. Now I get much more organic traffic and everything looks authentic. Highly recommend!`,
    `After struggling to grow my account for months, this service helped me push through to the next level. The growth looks natural and I've seen an increase in real engagement too!`,
    `Just what my channel needed. Delivery was fast and support was responsive when I had questions.`,
    `I was skeptical at first, but this service delivered exactly as promised. Impressed with the quality and speed.`,
    `This is my second time using this service and the results are consistent. Good quality and natural-looking growth.`,
    `The service was delivered promptly and the quality was exactly what I needed for my channel.`,
    `Great value for the price. I've tried other services before, but this one stands out in terms of quality.`,
    `Very professional service that helped boost my channel significantly. The effects were noticeable right away.`
  ];
  
  const positivePoints = [
    "Fast delivery",
    "Good quality",
    "Helpful support",
    "Natural looking results",
    "Improved organic traffic",
    "Good retention rate",
    "Responsive customer service",
    "Helped grow my channel",
    "Reasonable pricing",
    "Easy ordering process",
    "Authentic appearance",
    "No suspicious activity",
    "Secure transaction",
    "Clear instructions",
    "Visible results quickly"
  ];
  
  const negativePoints = [
    "Could be slightly cheaper",
    "Delivery took a bit longer than expected",
    "Would prefer more customization options",
    "Small percentage dropped off after a week",
    "Website could be improved",
    "Ordering process could be simpler",
    "Basic analytics only",
    "Limited tracking options",
    "More detailed documentation would help",
    "Mobile ordering experience needs work"
  ];
  
  // Select random content
  const title = titleTemplates[Math.floor(Math.random() * titleTemplates.length)];
  const content = contentTemplates[Math.floor(Math.random() * contentTemplates.length)];
  
  // Shuffle and select pros and cons
  const shuffledPros = shuffleArray([...positivePoints]);
  const shuffledCons = shuffleArray([...negativePoints]);
  
  // Number of pros/cons based on rating
  const numPros = Math.max(1, Math.min(3, rating - 1)); // 1-3 pros, higher for better ratings
  const numCons = Math.max(1, Math.min(2, 5 - rating)); // 1-2 cons, higher for worse ratings
  
  const pros = shuffledPros.slice(0, numPros);
  const cons = shuffledCons.slice(0, numCons);
  
  return { title, content, pros, cons };
}

/**
 * Helper function to shuffle an array
 * @param {Array} array - Array to shuffle
 * @returns {Array} - Shuffled array
 */
function shuffleArray(array) {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}