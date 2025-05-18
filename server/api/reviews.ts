import { Request, Response } from "express";
import { db } from "../db";
import { productReviews, reviewVotes, reviewTemplates, reviewGenerationSettings } from "../schema/reviews";
import { digitalProductOrders, digitalProducts } from "@shared/schema";
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
    
    // Use a direct SQL query to fetch reviews from the database with a regular query
    const result = await db.$queryRaw`
      SELECT * FROM product_reviews 
      WHERE product_id = ${productId} AND status = 'published' 
      ORDER BY created_at DESC
    `;
    const reviews = result as any[];
    
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
      return res.status(401).json({ error: "Authentication required" });
    }
    
    const schema = z.object({
      productId: z.number(),
      rating: z.number().min(1).max(5),
      title: z.string().min(3).max(100),
      content: z.string().min(10).max(1000),
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
    
    // Check if user has purchased this product
    const userPurchases = await db.query.digitalProductOrders.findMany({
      where: and(
        eq(digitalProductOrders.userId, req.user.id),
        eq(digitalProductOrders.productId, productId),
        eq(digitalProductOrders.status, "completed")
      )
    });
    
    // Check if the user already reviewed this product
    const existingReview = await db.query.productReviews.findFirst({
      where: and(
        eq(productReviews.productId, productId),
        eq(productReviews.userId, req.user.id)
      )
    });
    
    if (existingReview) {
      return res.status(400).json({ error: "You have already reviewed this product" });
    }
    
    // Create the review
    const [review] = await db.insert(productReviews).values({
      product_id: productId,
      user_id: req.user.id,
      rating,
      title,
      content,
      pros: pros || [],
      cons: cons || [],
      verified_purchase: userPurchases.length > 0,
      platform,
      device_type: getDeviceType(req.headers['user-agent'] || ''),
      status: "published",
      source: "user",
    }).returning();
    
    return res.status(201).json(review);
  } catch (error) {
    console.error("Error creating review:", error);
    return res.status(500).json({ error: "Failed to create review" });
  }
}

// Vote on a review (helpful/not helpful)
export async function voteOnReview(req: Request, res: Response) {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
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
    const review = await db.query.productReviews.findFirst({
      where: eq(productReviews.id, reviewId)
    });
    
    if (!review) {
      return res.status(404).json({ error: "Review not found" });
    }
    
    // Check if user already voted
    const existingVote = await db.query.reviewVotes.findFirst({
      where: and(
        eq(reviewVotes.reviewId, reviewId),
        eq(reviewVotes.userId, req.user.id)
      )
    });
    
    if (existingVote) {
      // Update existing vote if changed
      if (existingVote.isHelpful !== isHelpful) {
        await db.update(reviewVotes)
          .set({ isHelpful })
          .where(eq(reviewVotes.id, existingVote.id));
      }
    } else {
      // Create new vote
      await db.insert(reviewVotes).values({
        reviewId,
        userId: req.user.id,
        isHelpful
      });
    }
    
    // Update helpful count on the review
    const helpfulVotes = await db.select({ count: count() })
      .from(reviewVotes)
      .where(
        and(
          eq(reviewVotes.reviewId, reviewId),
          eq(reviewVotes.isHelpful, true)
        )
      );
    
    await db.update(productReviews)
      .set({ helpfulCount: helpfulVotes[0].count })
      .where(eq(productReviews.id, reviewId));
    
    return res.json({ success: true });
  } catch (error) {
    console.error("Error voting on review:", error);
    return res.status(500).json({ error: "Failed to vote on review" });
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
    
    // Get existing review templates or assume we have none
    let templates = [];
    
    if (!templates.length) {
      templates = [{
        id: 0,
        category: product.category?.toString() || '',
        platformId: product.platformId || 0,
        sentenceTemplates: [
          "I've been using {product} for {time_period} now and {sentiment}.",
          "Recently purchased {product} and {sentiment}.",
          "After trying several options, I found {product} to be {comparative}.",
          "If you're looking for {feature}, {product} is definitely {recommendation}.",
          "Used this for {use_case} and {sentiment}."
        ],
        positiveAdjectives: [
          "excellent", "outstanding", "impressive", "reliable", "efficient", 
          "effective", "high-quality", "professional", "top-notch", "fantastic"
        ],
        negativeAdjectives: [
          "disappointing", "frustrating", "mediocre", "unreliable", "ineffective",
          "overpriced", "inconsistent", "underwhelming", "problematic", "average"
        ],
        featurePoints: [
          "ease of use", "reliability", "customer support", "value for money",
          "speed", "effectiveness", "quality of service", "user interface",
          "delivery time", "results", "performance"
        ],
        createdAt: new Date(),
        updatedAt: new Date()
      }];
    }
    
    // Generate the reviews
    const generatedReviews = [];
    
    for (let i = 0; i < count; i++) {
      const rating = determineRatingFromDistribution(
        JSON.parse(settings.reviewDistribution || '{"5":60,"4":30,"3":8,"2":1,"1":1}')
      );
      
      const template = templates[Math.floor(Math.random() * templates.length)];
      
      // Generate review content
      const reviewContent = generateReviewContent(
        product.name, 
        product.category?.toString() || '', 
        rating
      );
      
      // Create random date within last 3 months
      const randomDate = new Date();
      randomDate.setDate(randomDate.getDate() - Math.floor(Math.random() * 90));
      
      // Select random country
      const randomCountry = countries[Math.floor(Math.random() * countries.length)];
      
      // Insert the review
      const [review] = await db.insert(productReviews).values({
        productId,
        userId: null, // No actual user
        rating,
        title: reviewContent.title,
        content: reviewContent.content,
        pros: reviewContent.pros,
        cons: reviewContent.cons,
        verifiedPurchase: Math.random() > 0.3, // 70% verified
        helpfulCount: Math.floor(Math.random() * 20),
        platform: product.platform?.toString() || '',
        category: product.category?.toString() || '',
        countryCode: randomCountry.isoCode,
        deviceType: ['mobile', 'desktop', 'tablet'][Math.floor(Math.random() * 3)],
        status: "published",
        source: "auto",
        authorInfo: JSON.stringify({
          name: faker.person.fullName(),
          avatar: faker.image.avatar()
        }),
        createdAt: randomDate,
        updatedAt: randomDate
      }).returning();
      
      generatedReviews.push(review);
    }
    
    return res.status(201).json({ 
      success: true, 
      count: generatedReviews.length,
      reviews: generatedReviews
    });
  } catch (error) {
    console.error("Error generating reviews:", error);
    return res.status(500).json({ error: "Failed to generate reviews" });
  }
}

function getDeviceType(userAgent: string): string {
  const mobileRegex = /Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk/i;
  const tabletRegex = /Tablet|iPad|Playbook|Silk/i;
  
  if (tabletRegex.test(userAgent)) {
    return 'tablet';
  } else if (mobileRegex.test(userAgent)) {
    return 'mobile';
  }
  
  return 'desktop';
}

function determineRatingFromDistribution(distribution: Record<string, number>): number {
  // Calculate total weight
  const totalWeight = Object.values(distribution).reduce((a, b) => a + b, 0);
  
  // Get a random number within the total weight
  const random = Math.random() * totalWeight;
  
  // Find which rating this falls into
  let runningTotal = 0;
  for (const [rating, weight] of Object.entries(distribution)) {
    runningTotal += weight;
    if (random <= runningTotal) {
      return parseInt(rating);
    }
  }
  
  // Default to 5 if something goes wrong
  return 5;
}

function generateReviewContent(productName: string, category: string, rating: number): {
  title: string;
  content: string;
  pros: string[];
  cons: string[];
} {
  // Titles by rating
  const titlesByRating = {
    5: [
      `Excellent ${category} service!`, 
      `Best ${category} service I've used`,
      `Really impressed with ${productName}`,
      `Highly recommended!`,
      `Outstanding service and results`
    ],
    4: [
      `Very good ${category} service`, 
      `Satisfied with ${productName}`,
      `Good service overall`,
      `Reliable service, happy with results`,
      `Solid choice for ${category}`
    ],
    3: [
      `Decent ${category} service`, 
      `Average results from ${productName}`,
      `OK but could be better`,
      `Mixed results but generally OK`,
      `Acceptable but not amazing`
    ],
    2: [
      `Disappointing ${category} service`, 
      `Not what I expected from ${productName}`,
      `Below average results`,
      `Wouldn't recommend this service`,
      `Several issues with this service`
    ],
    1: [
      `Avoid this ${category} service`, 
      `Very disappointed with ${productName}`,
      `Waste of money`,
      `Terrible service, no results`,
      `Extremely poor experience`
    ]
  };
  
  // Possible pros by rating
  const prosByRating = {
    5: [
      `Fast delivery of results`,
      `Excellent customer service`,
      `High quality ${category} service`,
      `Very responsive support team`,
      `Great value for money`,
      `Intuitive ordering process`,
      `Consistent results`,
      `Exceeded expectations`,
      `Noticeable improvement`,
      `No complicated setup needed`
    ],
    4: [
      `Good delivery speed`,
      `Helpful customer service`,
      `Quality matches the price`,
      `Responsive support`,
      `Reasonable value`,
      `Easy ordering process`,
      `Mostly consistent results`,
      `Met expectations`,
      `Visible results`,
      `Simple setup`
    ],
    3: [
      `Acceptable delivery time`,
      `Customer service was OK`,
      `Average quality for the price`,
      `Support responds eventually`,
      `Fair value`,
      `Straightforward ordering`,
      `Results vary`,
      `Met basic expectations`,
      `Some visible results`,
      `Setup was manageable`
    ],
    2: [
      `Eventually got results`,
      `Customer service exists`,
      `Some features work well`,
      `At least there's a support team`,
      `Cheaper than alternatives`,
      `Ordering process mostly works`,
      `Occasional good results`,
      `Lower than expected, but some results`,
      `Interface is simple`
    ],
    1: [
      `Nothing positive to say`,
      `Cheaper than some alternatives`,
      `Website looks professional`,
      `Order confirmation worked`,
      `Learned what to avoid in the future`
    ]
  };
  
  // Possible cons by rating
  const consByRating = {
    5: [
      `Could be slightly faster`,
      `Minor interface improvements needed`,
      `A bit more expensive than some alternatives`,
      `Would like more payment options`,
      `Could have more detailed reporting`
    ],
    4: [
      `Sometimes slower than expected`,
      `Interface could be more intuitive`,
      `Price on the higher side`,
      `Limited payment options`,
      `Reporting could be more detailed`,
      `Support response times vary`,
      `Results occasionally inconsistent`
    ],
    3: [
      `Often slower than advertised`,
      `Confusing interface in places`,
      `Overpriced for what you get`,
      `Very limited payment options`,
      `Minimal reporting capabilities`,
      `Support can be slow to respond`,
      `Inconsistent results`,
      `Expected better quality`,
      `Setup process could be clearer`
    ],
    2: [
      `Extremely slow delivery`,
      `Confusing and difficult interface`,
      `Definitely overpriced`,
      `Payment options limited`,
      `No useful reporting features`,
      `Support rarely responds`,
      `Very inconsistent results`,
      `Poor quality overall`,
      `Complicated setup process`,
      `Not transparent about services`
    ],
    1: [
      `Never delivered as promised`,
      `Terrible user interface`,
      `Complete waste of money`,
      `Payment issues and concerns`,
      `No reporting whatsoever`,
      `Support ignores messages`,
      `No meaningful results`,
      `Worst quality in the industry`,
      `Impossible to set up properly`,
      `Misleading service descriptions`,
      `Potential scam`
    ]
  };
  
  // Content templates by rating
  const contentTemplatesByRating = {
    5: [
      `I've been using {product} for my {category} needs, and I'm extremely satisfied with the results. The service delivered exactly what was promised, and the impact was noticeable immediately. Their customer support team was also very helpful when I had questions. Highly recommend to anyone looking for quality {category} services.`,
      
      `After trying several different {category} services, {product} stands out as the best by far. The quality is consistent, and the delivery was even faster than promised. I appreciate the transparent approach and the excellent results. Will definitely use again for future needs.`,
      
      `{product} exceeded all my expectations! I was skeptical at first, but the results were amazing. The ordering process was simple, and everything was delivered as promised. Their {category} service is definitely worth the investment if you're serious about growing your presence.`
    ],
    4: [
      `{product} provides a good {category} service that delivers solid results. While not perfect, the overall quality is good, and the value for money is reasonable. I had a positive experience and would likely use their services again in the future.`,
      
      `I've had a good experience with {product} for my {category} needs. The service works as advertised, with only minor issues in delivery timing. Customer support was responsive when needed, and the results were satisfactory. A good option in this category.`,
      
      `{product} offers a reliable {category} service that I've used several times now. While there's room for improvement in some areas, the core service works well and delivers acceptable results. I appreciate the straightforward approach and consistent quality.`
    ],
    3: [
      `My experience with {product} has been average. The {category} service works, but not always as well as advertised. There were some delays in delivery, and the results were somewhat inconsistent. It's an okay option if you have limited alternatives.`,
      
      `{product} delivers acceptable results for a {category} service, but nothing exceptional. Customer support response times varied, and the quality wasn't always consistent. It meets basic needs but don't expect outstanding performance.`,
      
      `I have mixed feelings about {product}. Some aspects of their {category} service work well, while others fall short. The pricing seems a bit high for the quality received, and delivery times were longer than promised. It's an average service overall.`
    ],
    2: [
      `I was disappointed with {product} as a {category} service. The results were minimal and took much longer than advertised. Customer support was difficult to reach when problems arose, and the overall experience was frustrating. I wouldn't recommend this service.`,
      
      `{product} didn't meet my expectations for a {category} service. There were significant delays in delivery, and the results were far below what was promised. The user interface is confusing, and support rarely responded to my questions. Look elsewhere for better options.`,
      
      `My experience with {product} was below average. The {category} service barely worked, and when it did, the quality was poor. The price doesn't justify what you receive, and there's very little transparency about what's happening with your order. Not recommended.`
    ],
    1: [
      `Avoid {product} at all costs. This {category} service is terrible and potentially a scam. They took my payment and delivered virtually nothing. Support ignored all my messages, and there was zero transparency about what was happening. Completely unacceptable.`,
      
      `{product} is the worst {category} service I've ever used. Nothing was delivered as promised, and the quality was abysmal. Customer support is non-existent, and the website is misleading about what you'll receive. Save your money and look elsewhere.`,
      
      `I had an awful experience with {product}. Their {category} service simply doesn't work, and they're not honest about it. The ordering process is confusing, support is unresponsive, and the results are non-existent. This seems like a fraudulent operation.`
    ]
  };
  
  // Select random elements
  const titles = titlesByRating[rating as keyof typeof titlesByRating] || titlesByRating[3];
  const title = titles[Math.floor(Math.random() * titles.length)];
  
  const contentTemplates = contentTemplatesByRating[rating as keyof typeof contentTemplatesByRating] || contentTemplatesByRating[3];
  const contentTemplate = contentTemplates[Math.floor(Math.random() * contentTemplates.length)];
  
  // Replace placeholders
  const content = contentTemplate
    .replace(/{product}/g, productName)
    .replace(/{category}/g, category);
  
  // Select pros and cons
  const possiblePros = prosByRating[rating as keyof typeof prosByRating] || prosByRating[3];
  const possibleCons = consByRating[rating as keyof typeof consByRating] || consByRating[3];
  
  // Determine number of pros and cons based on rating
  const numPros = Math.max(1, Math.min(4, rating)); // 1-4 pros, higher for better ratings
  const numCons = Math.max(1, Math.min(4, 6 - rating)); // 1-4 cons, higher for worse ratings
  
  // Shuffle and select
  const pros = shuffleArray(possiblePros).slice(0, numPros);
  const cons = shuffleArray(possibleCons).slice(0, numCons);
  
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

// Helper function for conditional queries
function or(...conditions: any[]) {
  return sql`(${sql.join(conditions, sql` OR `)})`;
}