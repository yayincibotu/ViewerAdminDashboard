import { Router } from 'express';
import { db } from '../db';
import { reviews, products } from '@shared/schema';
import { eq, and, desc, sql } from 'drizzle-orm';
import { requireAdmin } from '../middleware/auth';

const router = Router();

// GET - Fetch all reviews with product info for admin
router.get('/admin/reviews', requireAdmin, async (req, res) => {
  try {
    // Get all reviews with their related product information
    const allReviews = await db.query.reviews.findMany({
      with: {
        product: {
          columns: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: [desc(reviews.created_at)],
    });

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
    const review = await db.query.reviews.findFirst({
      where: eq(reviews.id, parseInt(id)),
      with: {
        product: {
          columns: {
            id: true,
            name: true,
          },
        },
      },
    });

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
  const { id: reviewId, product_id, created_at, ...allowedUpdates } = updateData;

  try {
    // Verify the review exists
    const existingReview = await db.query.reviews.findFirst({
      where: eq(reviews.id, parseInt(id)),
    });

    if (!existingReview) {
      return res.status(404).json({ message: 'Review not found' });
    }

    // Add updated_at timestamp
    const dataToUpdate = {
      ...allowedUpdates,
      updated_at: new Date(),
    };

    // Update the review
    const updatedReview = await db
      .update(reviews)
      .set(dataToUpdate)
      .where(eq(reviews.id, parseInt(id)))
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
    const existingReview = await db.query.reviews.findFirst({
      where: eq(reviews.id, parseInt(id)),
    });

    if (!existingReview) {
      return res.status(404).json({ message: 'Review not found' });
    }

    // Delete the review
    await db.delete(reviews).where(eq(reviews.id, parseInt(id)));

    res.status(200).json({ message: 'Review deleted successfully' });
  } catch (error) {
    console.error('Error deleting review:', error);
    res.status(500).json({ message: 'Failed to delete review' });
  }
});

export default router;