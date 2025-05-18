import { Request, Response } from "express";
import { pool } from "../../db";

/**
 * Admin endpoint to get all product reviews with filtering and pagination
 */
export const getAdminReviews = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * limit;
    const status = req.query.status as string;
    const search = req.query.search as string;
    const productId = req.query.productId as string;
    
    let queryParams: any[] = [];
    let whereConditions = [];
    
    // Build WHERE clause based on filters
    if (status && status !== "all") {
      whereConditions.push(`pr.status = $${queryParams.length + 1}`);
      queryParams.push(status);
    }
    
    if (productId && productId !== "all") {
      whereConditions.push(`pr.product_id = $${queryParams.length + 1}`);
      queryParams.push(parseInt(productId));
    }
    
    if (search) {
      whereConditions.push(`(pr.title ILIKE $${queryParams.length + 1} OR pr.content ILIKE $${queryParams.length + 1} OR pr.username ILIKE $${queryParams.length + 1})`);
      queryParams.push(`%${search}%`);
    }
    
    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(" AND ")}` : "";
    
    // Get total count for pagination
    const countQuery = `
      SELECT COUNT(*) 
      FROM product_reviews pr
      ${whereClause}
    `;
    
    const { rows: countResult } = await pool.query(countQuery, queryParams);
    const total = parseInt(countResult[0].count);
    
    // Get reviews with product information
    const reviewsQuery = `
      SELECT pr.*, dp.name as product_name
      FROM product_reviews pr
      LEFT JOIN digital_products dp ON pr.product_id = dp.id
      ${whereClause}
      ORDER BY pr.created_at DESC
      LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}
    `;
    
    queryParams.push(limit, offset);
    
    const { rows: reviews } = await pool.query(reviewsQuery, queryParams);
    
    // Transform rows to include product information
    const transformedReviews = reviews.map(review => ({
      ...review,
      product: {
        name: review.product_name
      }
    }));
    
    return res.json({
      reviews: transformedReviews,
      total,
      page,
      limit,
      hasMore: offset + reviews.length < total
    });
  } catch (error) {
    console.error("Error fetching admin reviews:", error);
    return res.status(500).json({ error: "İnceleme listesi yüklenirken bir hata oluştu." });
  }
};

/**
 * Admin endpoint to get a single review by ID
 */
export const getAdminReviewById = async (req: Request, res: Response) => {
  try {
    const reviewId = parseInt(req.params.id);
    
    if (isNaN(reviewId)) {
      return res.status(400).json({ error: "Geçersiz inceleme ID'si" });
    }
    
    const { rows } = await pool.query(
      `SELECT pr.*, dp.name as product_name
       FROM product_reviews pr
       LEFT JOIN digital_products dp ON pr.product_id = dp.id
       WHERE pr.id = $1`,
      [reviewId]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ error: "İnceleme bulunamadı" });
    }
    
    const review = {
      ...rows[0],
      product: {
        name: rows[0].product_name
      }
    };
    
    return res.json(review);
  } catch (error) {
    console.error("Error fetching admin review by ID:", error);
    return res.status(500).json({ error: "İnceleme detayları yüklenirken bir hata oluştu." });
  }
};

/**
 * Admin endpoint to update a review
 */
export const updateAdminReview = async (req: Request, res: Response) => {
  try {
    const reviewId = parseInt(req.params.id);
    
    if (isNaN(reviewId)) {
      return res.status(400).json({ error: "Geçersiz inceleme ID'si" });
    }
    
    const { title, content, rating, pros, cons, status } = req.body;
    
    // Check if review exists
    const { rows: existingReview } = await pool.query(
      "SELECT * FROM product_reviews WHERE id = $1",
      [reviewId]
    );
    
    if (existingReview.length === 0) {
      return res.status(404).json({ error: "İnceleme bulunamadı" });
    }
    
    // Prepare update fields
    const updateFields = [];
    const queryParams = [];
    let paramCounter = 1;
    
    if (title !== undefined) {
      updateFields.push(`title = $${paramCounter}`);
      queryParams.push(title);
      paramCounter++;
    }
    
    if (content !== undefined) {
      updateFields.push(`content = $${paramCounter}`);
      queryParams.push(content);
      paramCounter++;
    }
    
    if (rating !== undefined) {
      updateFields.push(`rating = $${paramCounter}`);
      queryParams.push(rating);
      paramCounter++;
    }
    
    if (pros !== undefined) {
      updateFields.push(`pros = $${paramCounter}`);
      queryParams.push(pros);
      paramCounter++;
    }
    
    if (cons !== undefined) {
      updateFields.push(`cons = $${paramCounter}`);
      queryParams.push(cons);
      paramCounter++;
    }
    
    if (status !== undefined) {
      updateFields.push(`status = $${paramCounter}`);
      queryParams.push(status);
      paramCounter++;
    }
    
    // Always update the updated_at timestamp
    updateFields.push(`updated_at = NOW()`);
    
    if (updateFields.length === 0) {
      return res.status(400).json({ error: "Güncellenecek hiçbir alan belirtilmedi" });
    }
    
    // Add review ID as the last parameter
    queryParams.push(reviewId);
    
    const { rows: updatedReview } = await pool.query(
      `UPDATE product_reviews 
       SET ${updateFields.join(", ")} 
       WHERE id = $${paramCounter} 
       RETURNING *`,
      queryParams
    );
    
    return res.json(updatedReview[0]);
  } catch (error) {
    console.error("Error updating admin review:", error);
    return res.status(500).json({ error: "İnceleme güncellenirken bir hata oluştu." });
  }
};

/**
 * Admin endpoint to update a review's status
 */
export const updateAdminReviewStatus = async (req: Request, res: Response) => {
  try {
    const reviewId = parseInt(req.params.id);
    
    if (isNaN(reviewId)) {
      return res.status(400).json({ error: "Geçersiz inceleme ID'si" });
    }
    
    const { status } = req.body;
    
    if (!status || !["published", "pending", "rejected"].includes(status)) {
      return res.status(400).json({ error: "Geçersiz durum değeri" });
    }
    
    const { rows } = await pool.query(
      `UPDATE product_reviews 
       SET status = $1, updated_at = NOW() 
       WHERE id = $2 
       RETURNING *`,
      [status, reviewId]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ error: "İnceleme bulunamadı" });
    }
    
    return res.json(rows[0]);
  } catch (error) {
    console.error("Error updating admin review status:", error);
    return res.status(500).json({ error: "İnceleme durumu güncellenirken bir hata oluştu." });
  }
};

/**
 * Admin endpoint to delete a review
 */
export const deleteAdminReview = async (req: Request, res: Response) => {
  try {
    const reviewId = parseInt(req.params.id);
    
    if (isNaN(reviewId)) {
      return res.status(400).json({ error: "Geçersiz inceleme ID'si" });
    }
    
    // First delete related votes
    await pool.query(
      "DELETE FROM review_votes WHERE review_id = $1",
      [reviewId]
    );
    
    // Then delete the review
    const { rowCount } = await pool.query(
      "DELETE FROM product_reviews WHERE id = $1",
      [reviewId]
    );
    
    if (rowCount === 0) {
      return res.status(404).json({ error: "İnceleme bulunamadı" });
    }
    
    return res.json({ success: true, message: "İnceleme başarıyla silindi" });
  } catch (error) {
    console.error("Error deleting admin review:", error);
    return res.status(500).json({ error: "İnceleme silinirken bir hata oluştu." });
  }
};