import { Request, Response } from "express";
import { pool } from "../db";

// Get reviews for a specific product
export async function getProductReviews(req: Request, res: Response) {
  try {
    const productId = Number(req.query.productId);
    
    if (isNaN(productId)) {
      return res.status(400).json({ error: "Valid productId is required" });
    }
    
    // Use raw SQL query with node-postgres directly to avoid ORM issues
    const { rows } = await pool.query(
      `SELECT * FROM product_reviews 
       WHERE product_id = $1 AND status = 'published' 
       ORDER BY created_at DESC`,
      [productId]
    );
    
    return res.json(rows);
  } catch (error) {
    console.error("Error fetching product reviews:", error);
    return res.status(500).json({ error: "Failed to fetch reviews" });
  }
}

// Create a new review
export async function createProductReview(req: Request, res: Response) {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    const { 
      productId, 
      rating, 
      title, 
      content, 
      pros, 
      cons, 
      platform 
    } = req.body;
    
    if (!productId || !rating || !title || !content) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    
    // Check if user has purchased this product (optional step)
    const { rows: purchases } = await pool.query(
      `SELECT * FROM digital_product_orders 
       WHERE user_id = $1 AND product_id = $2 AND status = 'completed'`,
      [req.user.id, productId]
    );
    
    const verifiedPurchase = purchases.length > 0;
    
    // Check if the user already reviewed this product
    const { rows: existingReviews } = await pool.query(
      `SELECT * FROM product_reviews 
       WHERE product_id = $1 AND user_id = $2`,
      [productId, req.user.id]
    );
    
    if (existingReviews.length > 0) {
      return res.status(400).json({ error: "You have already reviewed this product" });
    }
    
    // Get user agent for device type
    const deviceType = getUserDeviceType(req.headers['user-agent'] || '');
    
    // Insert review
    const { rows } = await pool.query(
      `INSERT INTO product_reviews 
       (product_id, user_id, rating, title, content, pros, cons, 
        verified_purchase, platform, device_type, status, source) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) 
       RETURNING *`,
      [productId, req.user.id, rating, title, content, pros || [], cons || [], 
       verifiedPurchase, platform, deviceType, 'published', 'user']
    );
    
    return res.status(201).json(rows[0]);
  } catch (error) {
    console.error("Error creating review:", error);
    return res.status(500).json({ error: "Failed to create review" });
  }
}

// Vote on a review
export async function voteOnReview(req: Request, res: Response) {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    const { reviewId, isHelpful } = req.body;
    
    if (typeof reviewId !== 'number' || typeof isHelpful !== 'boolean') {
      return res.status(400).json({ error: "Invalid parameters" });
    }
    
    // Check if user has already voted
    const { rows: existingVotes } = await pool.query(
      `SELECT * FROM review_votes 
       WHERE review_id = $1 AND user_id = $2`,
      [reviewId, req.user.id]
    );
    
    if (existingVotes.length > 0) {
      // Update existing vote
      await pool.query(
        `UPDATE review_votes 
         SET is_helpful = $3 
         WHERE review_id = $1 AND user_id = $2`,
        [reviewId, req.user.id, isHelpful]
      );
    } else {
      // Create new vote
      await pool.query(
        `INSERT INTO review_votes (review_id, user_id, is_helpful) 
         VALUES ($1, $2, $3)`,
        [reviewId, req.user.id, isHelpful]
      );
    }
    
    // Update helpful count on the review
    await pool.query(
      `UPDATE product_reviews 
       SET helpful_count = (
         SELECT COUNT(*) FROM review_votes 
         WHERE review_id = $1 AND is_helpful = true
       ) 
       WHERE id = $1`,
      [reviewId]
    );
    
    return res.json({ success: true });
  } catch (error) {
    console.error("Error voting on review:", error);
    return res.status(500).json({ error: "Failed to record vote" });
  }
}

// Generate reviews for a product (for admin only)
export async function generateProductReviews(req: Request, res: Response) {
  try {
    if (!req.isAuthenticated() || req.user.role !== 'admin') {
      return res.status(403).json({ error: "Admin access required" });
    }
    
    const { productId, count = 5 } = req.body;
    
    if (!productId) {
      return res.status(400).json({ error: "Product ID is required" });
    }
    
    // Get product information to include in generated reviews
    const { rows: products } = await pool.query(
      `SELECT * FROM digital_products WHERE id = $1`,
      [productId]
    );
    
    if (products.length === 0) {
      return res.status(404).json({ error: "Product not found" });
    }
    
    const product = products[0];
    
    // Generate and insert reviews
    const generatedReviews = [];
    
    for (let i = 0; i < count; i++) {
      const rating = Math.floor(Math.random() * 3) + 3; // 3-5 stars for generated reviews
      const { title, content, pros, cons } = generateReviewContent(product.name, product.category, rating);
      
      // Insert the generated review
      const { rows } = await pool.query(
        `INSERT INTO product_reviews 
         (product_id, rating, title, content, pros, cons, 
          verified_purchase, platform, device_type, status, source) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) 
         RETURNING *`,
        [productId, rating, title, content, pros, cons, 
         true, product.platform_id ? 'twitch' : 'other', 
         ['mobile', 'desktop', 'tablet'][Math.floor(Math.random() * 3)], 
         'published', 'auto']
      );
      
      generatedReviews.push(rows[0]);
    }
    
    return res.json({ success: true, count: generatedReviews.length });
  } catch (error) {
    console.error("Error generating reviews:", error);
    return res.status(500).json({ error: "Failed to generate reviews" });
  }
}

// Helper function to determine device type from user agent
function getUserDeviceType(userAgent: string): string {
  if (/mobile/i.test(userAgent)) return 'mobile';
  if (/tablet/i.test(userAgent)) return 'tablet';
  return 'desktop';
}

// Helper function to generate review content
function generateReviewContent(productName: string, category: string, rating: number) {
  const titleTemplates = [
    "Great service, very satisfied",
    "Does exactly what it promises",
    "Worth the money",
    "Good quality service",
    "Fast delivery and good results"
  ];
  
  const contentTemplates = [
    `I tried this ${category} service for my channel and was really impressed with the results. The followers started coming in within an hour of purchase and the retention has been great so far.`,
    `The ${category} service was excellent. The quality was good and delivery was even faster than promised. Will definitely order again when needed.`,
    `This service helped me break through the initial viewer threshold. Now I get much more organic traffic and everything looks authentic. Highly recommend!`,
    `After struggling to grow my account for months, this service helped me push through to the next level. The growth looks natural and I've seen an increase in real engagement too!`,
    `Just what my channel needed. Delivery was fast and support was responsive when I had questions.`
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
    "Easy ordering process"
  ];
  
  const negativePoints = [
    "Could be slightly cheaper",
    "Delivery took a bit longer than expected",
    "Would prefer more customization options",
    "Small percentage dropped off after a week",
    "Website could be improved",
    "Ordering process could be simpler",
    "Basic analytics only"
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

// Helper function to shuffle array
function shuffleArray<T>(array: T[]): T[] {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}