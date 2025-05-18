// Simple reviews module to bypass the ORM issues
import { pool } from './db.js';

/**
 * Get reviews for a specific product
 * @param {number} productId - The ID of the product
 * @returns {Promise<Array>} - Array of review objects
 */
export async function getProductReviews(productId) {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM product_reviews 
       WHERE product_id = $1 AND status = 'published' 
       ORDER BY created_at DESC`,
      [productId]
    );
    return rows;
  } catch (error) {
    console.error('Error fetching product reviews:', error);
    return [];
  }
}

/**
 * Check if a user has already reviewed a product
 * @param {number} productId - The ID of the product
 * @param {number} userId - The ID of the user
 * @returns {Promise<boolean>} - True if user has already reviewed this product
 */
export async function hasUserReviewedProduct(productId, userId) {
  try {
    if (!userId) return false; // Guest users don't have reviews
    
    const { rows } = await pool.query(
      `SELECT COUNT(*) as review_count FROM product_reviews 
       WHERE product_id = $1 AND user_id = $2`,
      [productId, userId]
    );
    
    return parseInt(rows[0].review_count) > 0;
  } catch (error) {
    console.error('Error checking if user has reviewed product:', error);
    throw error;
  }
}

/**
 * Create a new review
 */
export async function createReview(reviewData) {
  try {
    const { 
      product_id, 
      user_id, 
      rating, 
      title, 
      content,
      pros, 
      cons, 
      verified_purchase,
      platform,
      device_type
    } = reviewData;
    
    // Check if user has already reviewed this product
    if (user_id) {
      const hasReviewed = await hasUserReviewedProduct(product_id, user_id);
      if (hasReviewed) {
        throw new Error('You have already reviewed this product');
      }
    }
    
    const { rows } = await pool.query(
      `INSERT INTO product_reviews 
        (product_id, user_id, rating, title, content, pros, cons, verified_purchase, platform, device_type, status, source)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'published', 'user')
       RETURNING *`,
      [product_id, user_id, rating, title, content, pros, cons, verified_purchase, platform, device_type]
    );
    
    return rows[0];
  } catch (error) {
    console.error('Error creating review:', error);
    throw error;
  }
}

/**
 * Vote on a review
 */
export async function voteOnReview(reviewId, userId, isHelpful) {
  try {
    // Check if the user has already voted on this review
    const { rows: existingVotes } = await pool.query(
      `SELECT * FROM review_votes WHERE review_id = $1 AND user_id = $2`,
      [reviewId, userId]
    );
    
    if (existingVotes.length > 0) {
      // Update existing vote
      await pool.query(
        `UPDATE review_votes SET is_helpful = $3 WHERE review_id = $1 AND user_id = $2`,
        [reviewId, userId, isHelpful]
      );
    } else {
      // Create new vote
      await pool.query(
        `INSERT INTO review_votes (review_id, user_id, is_helpful) VALUES ($1, $2, $3)`,
        [reviewId, userId, isHelpful]
      );
    }
    
    // Update helpful count on the review
    await pool.query(
      `UPDATE product_reviews 
       SET helpful_count = (SELECT COUNT(*) FROM review_votes WHERE review_id = $1 AND is_helpful = true)
       WHERE id = $1`,
      [reviewId]
    );
    
    return { success: true };
  } catch (error) {
    console.error('Error voting on review:', error);
    throw error;
  }
}

/**
 * Helper function to generate review content for automated review creation
 * @param {string} productName - The name of the product
 * @param {string} category - The category of the product
 * @param {number} rating - The rating (1-5) for the review
 * @returns {Object} - Object containing title, content, pros, and cons
 */
export function generateReviewContent(productName, category, rating) {
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
export function shuffleArray(array) {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}