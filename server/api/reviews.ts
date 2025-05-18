import { Request, Response } from "express";
import { db } from "../db";
import { productReviews, reviewVotes, reviewTemplates, reviewGenerationSettings } from "../schema/reviews";
import { digitalProductOrders, digitalProducts } from "../../shared/schema";
import { eq, and, desc, count, sql, isNull, inArray } from "drizzle-orm";
import { z } from "zod";
import { faker } from "@faker-js/faker";
import { Country } from "country-state-city";

const countries = Country.getAllCountries();

// Get reviews for a product
export async function getProductReviews(req: Request, res: Response) {
  try {
    const productId = Number(req.query.productId);
    
    if (isNaN(productId)) {
      return res.status(400).json({ error: "Valid productId is required" });
    }
    
    // Get reviews with user information
    const reviews = await db.query.productReviews.findMany({
      where: and(
        eq(productReviews.productId, productId),
        eq(productReviews.status, "published")
      ),
      with: {
        user: {
          columns: {
            id: true,
            username: true,
          }
        }
      },
      orderBy: [desc(productReviews.createdAt)]
    });
    
    return res.json(reviews);
  } catch (error) {
    console.error("Error fetching product reviews:", error);
    return res.status(500).json({ error: "Failed to fetch reviews" });
  }
}

// Create a new review
export async function createProductReview(req: Request, res: Response) {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "You must be logged in to submit a review" });
    }
    
    const userId = req.user.id;
    
    // Validate request body
    const schema = z.object({
      productId: z.number(),
      rating: z.number().min(1).max(5),
      title: z.string().min(3).max(100),
      content: z.string().min(10),
      pros: z.array(z.string()).optional(),
      cons: z.array(z.string()).optional(),
      platform: z.string().optional(),
      category: z.string().optional(),
    });
    
    const validation = schema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: validation.error.format() });
    }
    
    const { productId, rating, title, content, pros, cons, platform, category } = validation.data;
    
    // Check if product exists
    const productExists = await db.query.digitalProducts.findFirst({
      where: eq(digitalProducts.id, productId)
    });
    
    if (!productExists) {
      return res.status(404).json({ error: "Product not found" });
    }
    
    // Check if user has purchased this product (verified purchase)
    const verifiedPurchase = await db.query.digitalProductOrders.findFirst({
      where: and(
        eq(digitalProductOrders.userId, userId),
        eq(digitalProductOrders.productId, productId),
        eq(digitalProductOrders.status, "completed")
      )
    });
    
    // Get client IP and user agent for additional metadata
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];
    const deviceType = getDeviceType(userAgent);
    
    // Insert the review
    const [newReview] = await db.insert(productReviews).values({
      productId,
      userId,
      rating,
      title,
      content,
      pros: pros || [],
      cons: cons || [],
      verifiedPurchase: !!verifiedPurchase,
      platform,
      countryCode: null, // Could be determined from IP in a production environment
      deviceType,
      status: "published",
      source: "user",
      metadata: JSON.stringify({
        ip,
        userAgent,
        submitted_at: new Date().toISOString()
      })
    }).returning();
    
    return res.status(201).json(newReview);
  } catch (error) {
    console.error("Error creating review:", error);
    return res.status(500).json({ error: "Failed to submit review" });
  }
}

// Vote on a review (helpful/not helpful)
export async function voteOnReview(req: Request, res: Response) {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "You must be logged in to vote" });
    }
    
    const userId = req.user.id;
    
    // Validate request
    const schema = z.object({
      reviewId: z.number(),
      isHelpful: z.boolean()
    });
    
    const validation = schema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: validation.error.format() });
    }
    
    const { reviewId, isHelpful } = validation.data;
    
    // Check if review exists
    const reviewExists = await db.query.productReviews.findFirst({
      where: eq(productReviews.id, reviewId)
    });
    
    if (!reviewExists) {
      return res.status(404).json({ error: "Review not found" });
    }
    
    // Check if user has already voted
    const existingVote = await db.query.reviewVotes.findFirst({
      where: and(
        eq(reviewVotes.reviewId, reviewId),
        eq(reviewVotes.userId, userId)
      )
    });
    
    if (existingVote) {
      // Update existing vote
      await db.update(reviewVotes)
        .set({ isHelpful })
        .where(and(
          eq(reviewVotes.reviewId, reviewId),
          eq(reviewVotes.userId, userId)
        ));
    } else {
      // Create new vote
      await db.insert(reviewVotes).values({
        reviewId,
        userId,
        isHelpful
      });
    }
    
    // Update helpfulCount on the review
    const helpfulVotes = await db.select({ count: count() })
      .from(reviewVotes)
      .where(and(
        eq(reviewVotes.reviewId, reviewId),
        eq(reviewVotes.isHelpful, true)
      ));
    
    await db.update(productReviews)
      .set({ helpfulCount: helpfulVotes[0].count })
      .where(eq(productReviews.id, reviewId));
    
    return res.json({ success: true });
  } catch (error) {
    console.error("Error voting on review:", error);
    return res.status(500).json({ error: "Failed to register vote" });
  }
}

// Auto-generate reviews for a product
export async function generateProductReviews(req: Request, res: Response) {
  try {
    if (!req.isAuthenticated() || req.user.role !== 'admin') {
      return res.status(403).json({ error: "Admin access required" });
    }
    
    const schema = z.object({
      productId: z.number(),
      count: z.number().min(1).max(20).default(5)
    });
    
    const validation = schema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: validation.error.format() });
    }
    
    const { productId, count } = validation.data;
    
    // Get product details
    const product = await db.query.digitalProducts.findFirst({
      where: eq(digitalProducts.id, productId)
    });
    
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }
    
    // Get or create review generation settings
    let settings = await db.query.reviewGenerationSettings.findFirst({
      where: eq(reviewGenerationSettings.productId, productId)
    });
    
    if (!settings) {
      [settings] = await db.insert(reviewGenerationSettings).values({
        productId,
        isEnabled: true,
        minRating: 3,
        maxRating: 5,
        reviewDistribution: JSON.stringify({
          "5": 60,
          "4": 30,
          "3": 8,
          "2": 1,
          "1": 1
        }),
        targetReviewCount: 20,
        dailyGenerationLimit: 2,
        randomGeneration: true
      }).returning();
    }
    
    // Generate the requested number of reviews
    const generatedReviews = [];
    const distribution = settings.reviewDistribution 
      ? JSON.parse(settings.reviewDistribution) 
      : { "5": 60, "4": 30, "3": 8, "2": 1, "1": 1 };
    
    const countryList = countries.map(c => c.isoCode);
    const deviceTypes = ["mobile", "desktop", "tablet"];
    const platforms = ["Chrome", "Firefox", "Safari", "Edge", "Opera"];
    
    for (let i = 0; i < count; i++) {
      // Determine rating based on distribution
      const rating = determineRatingFromDistribution(distribution);
      
      // Generate review content
      const review = generateReviewContent(product.name, product.category, rating);
      
      // Generate random metadata
      const randomCountry = countryList[Math.floor(Math.random() * countryList.length)];
      const randomDevice = deviceTypes[Math.floor(Math.random() * deviceTypes.length)];
      const randomPlatform = platforms[Math.floor(Math.random() * platforms.length)];
      
      // Create the review with slightly randomized timestamps
      const timestamp = new Date();
      timestamp.setDate(timestamp.getDate() - Math.floor(Math.random() * 30)); // Random date in the last 30 days
      
      const [newReview] = await db.insert(productReviews).values({
        productId,
        userId: null, // No real user for auto-generated reviews
        rating,
        title: review.title,
        content: review.content,
        pros: review.pros,
        cons: review.cons,
        verifiedPurchase: Math.random() > 0.3, // 70% are verified purchases
        countryCode: randomCountry,
        deviceType: randomDevice,
        platform: randomPlatform,
        authorInfo: JSON.stringify({
          name: faker.person.fullName(),
          avatar: null
        }),
        source: "auto",
        status: "published",
        createdAt: timestamp,
        updatedAt: timestamp
      }).returning();
      
      generatedReviews.push(newReview);
    }
    
    return res.json({ 
      success: true, 
      count: generatedReviews.length,
      reviews: generatedReviews
    });
  } catch (error) {
    console.error("Error generating reviews:", error);
    return res.status(500).json({ error: "Failed to generate reviews" });
  }
}

// Helper function to determine device type from user agent
function getDeviceType(userAgent: string): string {
  if (!userAgent) return 'unknown';
  
  if (/android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase())) {
    return 'mobile';
  } else if (/tablet|ipad/i.test(userAgent.toLowerCase())) {
    return 'tablet';
  } else {
    return 'desktop';
  }
}

// Helper function to determine rating based on distribution
function determineRatingFromDistribution(distribution: Record<string, number>): number {
  const totalWeight = Object.values(distribution).reduce((sum, weight) => sum + weight, 0);
  const random = Math.random() * totalWeight;
  
  let cumulativeWeight = 0;
  for (const [rating, weight] of Object.entries(distribution)) {
    cumulativeWeight += weight;
    if (random <= cumulativeWeight) {
      return parseInt(rating);
    }
  }
  
  return 5; // Default to 5 if something goes wrong
}

// Helper function to generate review content
function generateReviewContent(productName: string, category: string, rating: number): {
  title: string;
  content: string;
  pros: string[];
  cons: string[];
} {
  // Determine sentiment based on rating
  const sentiment = rating >= 4 ? 'positive' : rating === 3 ? 'neutral' : 'negative';
  
  // Title templates by sentiment
  const titleTemplates = {
    positive: [
      `Great ${category} service!`,
      `Excellent ${productName}`,
      `Highly recommended!`,
      `Works perfectly!`,
      `Best ${category} provider`,
      `Amazing results with ${productName}`,
      `Fast delivery, great service`,
      `Excellent value for money`,
      `Very satisfied with my purchase`,
      `Top quality service`
    ],
    neutral: [
      `Decent ${category} service`,
      `Good but not perfect`,
      `Satisfactory experience`,
      `Does the job, but..`,
      `Acceptable service`,
      `Mixed feelings about this`,
      `Average ${category} service`,
      `Not bad for the price`,
      `Meets basic expectations`,
      `Works as described`
    ],
    negative: [
      `Disappointed with this service`,
      `Not worth the money`,
      `Expected more from ${productName}`,
      `Needs improvement`,
      `Would not recommend`,
      `Frustrating experience`,
      `Too many issues`,
      `Poor quality service`,
      `Waste of money`,
      `Doesn't deliver as promised`
    ]
  };
  
  // Content templates (more generic)
  const contentTemplates = {
    positive: [
      `I've tried several ${category} services before, but this one is definitely the best. ${productName} delivered exactly what was promised, and the results were visible quickly.`,
      `Extremely satisfied with my purchase. The service works flawlessly, and customer support is responsive. Would definitely use again.`,
      `The ${productName} service exceeded my expectations. Fast delivery, good quality, and excellent value for money.`,
      `I've been using ${productName} for a while now, and I'm consistently impressed with the results. Highly recommended for anyone looking for a reliable ${category} service.`,
      `Great service from start to finish. The process was straightforward, and the results were exactly what I needed.`
    ],
    neutral: [
      `${productName} is decent for the price. There are some minor issues, but overall it does what it claims to do.`,
      `The service works, but delivery was slower than advertised. Customer support was helpful in resolving the issue.`,
      `Average experience with ${productName}. It gets the job done, but there's definitely room for improvement.`,
      `Not bad, but not great either. The ${category} service works, but I've seen better quality elsewhere.`,
      `Mixed results with this service. Some aspects were excellent, while others left something to be desired.`
    ],
    negative: [
      `I had high hopes for ${productName}, but unfortunately, it didn't deliver as promised. The results were disappointing and not worth the price.`,
      `Poor experience overall. The service was unreliable, and customer support was unresponsive when I tried to resolve issues.`,
      `Would not recommend this ${category} service. There are much better alternatives available for the same price.`,
      `Disappointing results and slow delivery. I expected much more based on the description and reviews.`,
      `Save your money and look elsewhere. This service has too many issues to be worth it.`
    ]
  };
  
  // Pros templates
  const prosTemplates = {
    positive: [
      `Fast delivery`,
      `Excellent quality`,
      `Good customer support`,
      `Easy to use`,
      `Great value for money`,
      `Reliable service`,
      `Consistent results`,
      `Exactly as described`,
      `Visible results quickly`,
      `Hassle-free process`
    ],
    neutral: [
      `Reasonable price`,
      `Works as expected`,
      `Decent quality`,
      `Acceptable delivery time`,
      `Responsive support`,
      `Simple process`,
      `Does the basic job`,
      `No major issues`,
      `Interface is easy to navigate`,
      `Payment process is secure`
    ],
    negative: [
      `Some features work correctly`,
      `Payment process was smooth`,
      `Website is easy to navigate`,
      `Good concept in theory`,
      `Customer support responds eventually`
    ]
  };
  
  // Cons templates
  const consTemplates = {
    positive: [
      `Minor delay in delivery`,
      `Could be slightly cheaper`,
      `Interface could be more intuitive`,
      `More options would be nice`,
      `Occasional small glitches`
    ],
    neutral: [
      `Slow delivery times`,
      `Inconsistent results`,
      `Limited features`,
      `Customer support could be better`,
      `Price is a bit high for what you get`,
      `Interface needs improvement`,
      `Some options are confusing`,
      `Results take time to appear`,
      `Documentation could be clearer`,
      `No real-time tracking`
    ],
    negative: [
      `Poor quality service`,
      `Extremely slow delivery`,
      `Non-existent customer support`,
      `Doesn't work as advertised`,
      `Overpriced for what you get`,
      `Confusing interface`,
      `No refund policy`,
      `Inconsistent results`,
      `Hidden fees not mentioned`,
      `No transparency in the process`
    ]
  };
  
  // Select random templates
  const title = titleTemplates[sentiment][Math.floor(Math.random() * titleTemplates[sentiment].length)];
  
  const content = contentTemplates[sentiment][Math.floor(Math.random() * contentTemplates[sentiment].length)];
  
  // Generate 1-3 pros
  const prosCount = sentiment === 'positive' ? Math.floor(Math.random() * 3) + 2 : // 2-4 for positive
                    sentiment === 'neutral' ? Math.floor(Math.random() * 2) + 1 : // 1-2 for neutral
                    Math.floor(Math.random() * 1) + 1; // 1 for negative
  
  // Generate 1-3 cons
  const consCount = sentiment === 'positive' ? Math.floor(Math.random() * 1) + 1 : // 1 for positive
                    sentiment === 'neutral' ? Math.floor(Math.random() * 2) + 1 : // 1-2 for neutral
                    Math.floor(Math.random() * 3) + 2; // 2-4 for negative
  
  // Helper to get random unique items
  const getRandomUnique = (arr: string[], count: number) => {
    const shuffled = [...arr].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  };
  
  const pros = getRandomUnique(prosTemplates[sentiment], prosCount);
  const cons = getRandomUnique(consTemplates[sentiment], consCount);
  
  return {
    title,
    content,
    pros,
    cons
  };
}