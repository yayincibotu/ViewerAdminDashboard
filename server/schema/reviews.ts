import { pgTable, serial, integer, text, boolean, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";

// Define review source enum
export const reviewSourceEnum = pgEnum('review_source', ['user', 'auto']);

// Product Reviews Table
export const productReviews = pgTable("product_reviews", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull(),
  userId: integer("user_id"),
  rating: integer("rating").notNull(), // 1-5 stars
  title: text("title").notNull(),
  content: text("content").notNull(),
  pros: text("pros").array(), // What user liked
  cons: text("cons").array(), // What user disliked
  verifiedPurchase: boolean("verified_purchase").default(false).notNull(),
  helpfulCount: integer("helpful_count").default(0).notNull(),
  reportCount: integer("report_count").default(0).notNull(),
  status: text("status").default("published").notNull(), // published, pending, rejected
  source: reviewSourceEnum("source").default("user").notNull(), // user or auto generated
  authorInfo: text("author_info"), // Optional additional author info (JSON)
  platform: text("platform"), // e.g., "twitch", "youtube"
  countryCode: text("country_code"), // User country code (ISO)
  deviceType: text("device_type"), // mobile, desktop, tablet
  socialProof: text("social_proof"), // Optional social media handle or link
  metadata: text("metadata"), // Additional data as JSON
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertProductReviewSchema = createInsertSchema(productReviews).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  helpfulCount: true,
  reportCount: true,
});

export type InsertProductReview = typeof productReviews.$inferInsert;
export type ProductReview = typeof productReviews.$inferSelect;

// Review Votes Table
export const reviewVotes = pgTable("review_votes", {
  id: serial("id").primaryKey(),
  reviewId: integer("review_id").notNull(),
  userId: integer("user_id").notNull(),
  isHelpful: boolean("is_helpful").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertReviewVoteSchema = createInsertSchema(reviewVotes).omit({
  id: true,
  createdAt: true,
});

export type InsertReviewVote = typeof reviewVotes.$inferInsert;
export type ReviewVote = typeof reviewVotes.$inferSelect;

// Review Templates Table
export const reviewTemplates = pgTable("review_templates", {
  id: serial("id").primaryKey(),
  category: text("category").notNull(),
  platformId: integer("platform_id").notNull(),
  sentenceTemplates: text("sentence_templates").array().notNull(),
  positiveAdjectives: text("positive_adjectives").array().notNull(),
  negativeAdjectives: text("negative_adjectives").array().notNull(),
  featurePoints: text("feature_points").array().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertReviewTemplateSchema = createInsertSchema(reviewTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertReviewTemplate = typeof reviewTemplates.$inferInsert;
export type ReviewTemplate = typeof reviewTemplates.$inferSelect;

// Review Generation Settings Table
export const reviewGenerationSettings = pgTable("review_generation_settings", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull(),
  isEnabled: boolean("is_enabled").default(true).notNull(),
  minRating: integer("min_rating").default(3).notNull(), // Minimum rating (1-5)
  maxRating: integer("max_rating").default(5).notNull(), // Maximum rating (1-5)
  reviewDistribution: text("review_distribution"), // JSON with rating distribution percentages
  targetReviewCount: integer("target_review_count").default(10), // Target number of reviews
  dailyGenerationLimit: integer("daily_generation_limit").default(1), // Max reviews per day
  randomGeneration: boolean("random_generation").default(true), // Random timing or specific schedule
  generationSchedule: text("generation_schedule"), // JSON with generation time rules
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertReviewGenerationSettingsSchema = createInsertSchema(reviewGenerationSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertReviewGenerationSettings = typeof reviewGenerationSettings.$inferInsert;
export type ReviewGenerationSettings = typeof reviewGenerationSettings.$inferSelect;