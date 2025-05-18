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