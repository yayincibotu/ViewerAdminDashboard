import { Router } from 'express';
import { db } from '../db';
import { digitalProducts } from '@shared/schema';
import { productReviews } from '../schema/reviews';
import { eq, and, desc, sql } from 'drizzle-orm';

// Middleware for admin authorization
const requireAdmin = (req: any, res: any, next: any) => {
  if (!req.isAuthenticated || !req.isAuthenticated() || req.user?.role !== 'admin') {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  next();
};

const router = Router();

// GET - Fetch all reviews with product info for admin
router.get('/admin/reviews', requireAdmin, async (req, res) => {
  try {
    // Get all reviews with product information using a join
    const allReviews = await db.select({
      id: productReviews.id,
      productId: productReviews.productId,
      userId: productReviews.userId,
      rating: productReviews.rating,
      title: productReviews.title,
      content: productReviews.content,
      pros: productReviews.pros,
      cons: productReviews.cons,
      verifiedPurchase: productReviews.verifiedPurchase,
      helpfulCount: productReviews.helpfulCount,
      reportCount: productReviews.reportCount,
      status: productReviews.status,
      source: productReviews.source,
      authorInfo: productReviews.authorInfo,
      platform: productReviews.platform,
      countryCode: productReviews.countryCode,
      deviceType: productReviews.deviceType,
      createdAt: productReviews.createdAt,
      updatedAt: productReviews.updatedAt,
      productName: digitalProducts.name,
    })
    .from(productReviews)
    .leftJoin(digitalProducts, eq(productReviews.productId, digitalProducts.id))
    .orderBy(desc(productReviews.createdAt));

    res.json(allReviews);
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ message: 'Failed to fetch reviews' });
  }
});

// GET - Fetch a single review by ID
router.get('/admin/reviews/:id', requireAdmin, async (req, res) => {
  const { id } = req.params;
  
  if (!id || isNaN(parseInt(id))) {
    return res.status(400).json({ message: 'Invalid review ID' });
  }

  try {
    const [review] = await db.select({
      id: productReviews.id,
      productId: productReviews.productId,
      userId: productReviews.userId,
      rating: productReviews.rating,
      title: productReviews.title,
      content: productReviews.content,
      pros: productReviews.pros,
      cons: productReviews.cons,
      verifiedPurchase: productReviews.verifiedPurchase,
      helpfulCount: productReviews.helpfulCount,
      reportCount: productReviews.reportCount,
      status: productReviews.status,
      source: productReviews.source,
      authorInfo: productReviews.authorInfo,
      platform: productReviews.platform,
      countryCode: productReviews.countryCode,
      deviceType: productReviews.deviceType,
      createdAt: productReviews.createdAt,
      updatedAt: productReviews.updatedAt,
      productName: digitalProducts.name,
    })
    .from(productReviews)
    .leftJoin(digitalProducts, eq(productReviews.productId, digitalProducts.id))
    .where(eq(productReviews.id, parseInt(id)));

    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    res.json(review);
  } catch (error) {
    console.error('Error fetching review:', error);
    res.status(500).json({ message: 'Failed to fetch review' });
  }
});

// PATCH - Update a review
router.patch('/admin/reviews/:id', requireAdmin, async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;
  
  if (!id || isNaN(parseInt(id))) {
    return res.status(400).json({ message: 'Invalid review ID' });
  }

  // Remove fields that shouldn't be updated directly
  const { id: reviewId, productId, createdAt, ...allowedUpdates } = updateData;

  try {
    // Verify the review exists
    const [existingReview] = await db
      .select()
      .from(productReviews)
      .where(eq(productReviews.id, parseInt(id)));

    if (!existingReview) {
      return res.status(404).json({ message: 'Review not found' });
    }

    // Add updated_at timestamp
    const dataToUpdate = {
      ...allowedUpdates,
      updatedAt: new Date(),
    };

    // Update the review
    const updatedReview = await db
      .update(productReviews)
      .set(dataToUpdate)
      .where(eq(productReviews.id, parseInt(id)))
      .returning();

    res.json(updatedReview[0]);
  } catch (error) {
    console.error('Error updating review:', error);
    res.status(500).json({ message: 'Failed to update review' });
  }
});

// DELETE - Delete a review
router.delete('/admin/reviews/:id', requireAdmin, async (req, res) => {
  const { id } = req.params;
  
  if (!id || isNaN(parseInt(id))) {
    return res.status(400).json({ message: 'Invalid review ID' });
  }

  try {
    // Verify the review exists
    const [existingReview] = await db
      .select()
      .from(productReviews)
      .where(eq(productReviews.id, parseInt(id)));

    if (!existingReview) {
      return res.status(404).json({ message: 'Review not found' });
    }

    // Delete the review
    await db.delete(productReviews).where(eq(productReviews.id, parseInt(id)));

    res.status(200).json({ message: 'Review deleted successfully' });
  } catch (error) {
    console.error('Error deleting review:', error);
    res.status(500).json({ message: 'Failed to delete review' });
  }
});

export default router;