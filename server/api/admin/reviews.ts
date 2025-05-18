/**
 * Admin Review Management API
 * Handles CRUD operations for reviews in the admin panel
 */
import { Request, Response } from "express";
import { pool } from "../../db";
import { and, asc, desc, eq, ilike, inArray, sql } from "drizzle-orm";
import { z } from "zod";

// Define types
type ReviewStatus = "pending" | "published" | "rejected";

/**
 * Admin endpoint to get all product reviews with filtering and pagination
 */
export const getAdminReviews = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * limit;
    
    const productId = req.query.productId ? parseInt(req.query.productId as string) : null;
    const status = req.query.status as ReviewStatus | undefined;
    const search = req.query.search as string | undefined;
    const sortBy = req.query.sortBy as string || "created_at";
    const sortOrder = (req.query.sortOrder as string || "desc").toLowerCase();
    
    // Start building the query
    let queryParams: any[] = [];
    let countQueryParams: any[] = [];
    
    // Base query
    let query = `
      SELECT r.*, p.name as product_name
      FROM product_reviews r
      LEFT JOIN digital_products p ON r.product_id = p.id
      WHERE 1=1
    `;
    
    let countQuery = `
      SELECT COUNT(*) 
      FROM product_reviews r
      WHERE 1=1
    `;
    
    // Apply filters
    if (productId) {
      query += ` AND r.product_id = $${queryParams.length + 1}`;
      countQuery += ` AND r.product_id = $${countQueryParams.length + 1}`;
      queryParams.push(productId);
      countQueryParams.push(productId);
    }
    
    if (status) {
      query += ` AND r.status = $${queryParams.length + 1}`;
      countQuery += ` AND r.status = $${countQueryParams.length + 1}`;
      queryParams.push(status);
      countQueryParams.push(status);
    }
    
    if (search) {
      const searchTerm = `%${search}%`;
      query += ` AND (r.title ILIKE $${queryParams.length + 1} OR r.content ILIKE $${queryParams.length + 2} OR p.name ILIKE $${queryParams.length + 3})`;
      countQuery += ` AND (r.title ILIKE $${countQueryParams.length + 1} OR r.content ILIKE $${countQueryParams.length + 2})`;
      queryParams.push(searchTerm, searchTerm, searchTerm);
      countQueryParams.push(searchTerm, searchTerm);
    }
    
    // Add sorting
    query += ` ORDER BY r.${sortBy} ${sortOrder === "asc" ? "ASC" : "DESC"}`;
    
    // Add pagination
    query += ` LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`;
    queryParams.push(limit, offset);
    
    // Execute both queries
    const result = await pool.query(query, queryParams);
    const countResult = await pool.query(countQuery, countQueryParams);
    
    const totalCount = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(totalCount / limit);
    
    return res.json({
      reviews: result.rows,
      pagination: {
        currentPage: page,
        limit,
        totalCount,
        totalPages
      }
    });
  } catch (error) {
    console.error("Error fetching admin reviews:", error);
    return res.status(500).json({ error: "Failed to fetch reviews" });
  }
};

/**
 * Admin endpoint to get a single review by ID
 */
export const getAdminReviewById = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).json({ error: "Valid review ID is required" });
    }
    
    const { rows } = await pool.query(
      `SELECT r.*, p.name as product_name
       FROM product_reviews r
       LEFT JOIN digital_products p ON r.product_id = p.id
       WHERE r.id = $1`,
      [id]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ error: "Review not found" });
    }
    
    return res.json(rows[0]);
  } catch (error) {
    console.error("Error fetching admin review by ID:", error);
    return res.status(500).json({ error: "Failed to fetch review" });
  }
};

/**
 * Admin endpoint to update a review
 */
export const updateAdminReview = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).json({ error: "Valid review ID is required" });
    }
    
    // Validate the request body
    const reviewSchema = z.object({
      title: z.string().min(1),
      content: z.string().min(1),
      rating: z.number().min(1).max(5),
      pros: z.array(z.string()).optional(),
      cons: z.array(z.string()).optional(),
      status: z.enum(["pending", "published", "rejected"]),
      username: z.string().optional().nullable(),
      country_code: z.string().optional().nullable(),
      platform: z.string().optional().nullable(),
      device_type: z.string().optional().nullable(),
      verified_purchase: z.boolean().optional(),
    });
    
    const parsedBody = reviewSchema.safeParse(req.body);
    
    if (!parsedBody.success) {
      return res.status(400).json({ 
        error: "Invalid review data", 
        details: parsedBody.error.errors 
      });
    }
    
    const reviewData = parsedBody.data;
    
    // Build the query dynamically
    const setClauses = [];
    const queryParams = [id]; // First param is the ID
    let paramIndex = 2;
    
    for (const [key, value] of Object.entries(reviewData)) {
      if (key === 'pros' || key === 'cons') {
        if (value) {
          setClauses.push(`${key} = $${paramIndex++}`);
          queryParams.push(JSON.stringify(value));
        }
      } else {
        setClauses.push(`${key} = $${paramIndex++}`);
        queryParams.push(value);
      }
    }
    
    // Add updated_at timestamp
    setClauses.push(`updated_at = $${paramIndex++}`);
    queryParams.push(new Date());
    
    const query = `
      UPDATE product_reviews
      SET ${setClauses.join(', ')}
      WHERE id = $1
      RETURNING *
    `;
    
    const { rows } = await pool.query(query, queryParams);
    
    if (rows.length === 0) {
      return res.status(404).json({ error: "Review not found" });
    }
    
    return res.json(rows[0]);
  } catch (error) {
    console.error("Error updating admin review:", error);
    return res.status(500).json({ error: "Failed to update review" });
  }
};

/**
 * Admin endpoint to update a review's status
 */
export const updateAdminReviewStatus = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).json({ error: "Valid review ID is required" });
    }
    
    // Validate the request body
    const statusSchema = z.object({
      status: z.enum(["pending", "published", "rejected"])
    });
    
    const parsedBody = statusSchema.safeParse(req.body);
    
    if (!parsedBody.success) {
      return res.status(400).json({ 
        error: "Invalid status", 
        details: parsedBody.error.errors 
      });
    }
    
    const { status } = parsedBody.data;
    
    const { rows } = await pool.query(
      `UPDATE product_reviews
       SET status = $1, updated_at = $2
       WHERE id = $3
       RETURNING *`,
      [status, new Date(), id]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ error: "Review not found" });
    }
    
    return res.json(rows[0]);
  } catch (error) {
    console.error("Error updating admin review status:", error);
    return res.status(500).json({ error: "Failed to update review status" });
  }
};

/**
 * Admin endpoint to delete a review
 */
export const deleteAdminReview = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).json({ error: "Valid review ID is required" });
    }
    
    const { rowCount } = await pool.query(
      `DELETE FROM product_reviews WHERE id = $1`,
      [id]
    );
    
    if (rowCount === 0) {
      return res.status(404).json({ error: "Review not found" });
    }
    
    return res.json({ success: true, message: "Review deleted successfully" });
  } catch (error) {
    console.error("Error deleting admin review:", error);
    return res.status(500).json({ error: "Failed to delete review" });
  }
};