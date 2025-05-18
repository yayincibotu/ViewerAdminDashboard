import { pgTable, text, serial, integer, boolean, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";
import { users, digitalProducts } from "../../shared/schema";

// Review Source Enum (user generated or auto-generated)
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

// Review Votes - for tracking helpful/not helpful votes
export const reviewVotes = pgTable("review_votes", {
  id: serial("id").primaryKey(),
  reviewId: integer("review_id").notNull(),
  userId: integer("user_id").notNull(),
  isHelpful: boolean("is_helpful").notNull(), // true for helpful, false for not helpful
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertReviewVoteSchema = createInsertSchema(reviewVotes).omit({
  id: true,
  createdAt: true,
});

// Review Templates - for auto-generated reviews
export const reviewTemplates = pgTable("review_templates", {
  id: serial("id").primaryKey(),
  category: text("category").notNull(), // Category type (e.g., followers, views)
  platformId: integer("platform_id").notNull(), // Platform (e.g., Twitch, YouTube)
  sentenceTemplates: text("sentence_templates").array().notNull(), // Templates for generating reviews
  positiveAdjectives: text("positive_adjectives").array().notNull(), // Positive words to use
  negativeAdjectives: text("negative_adjectives").array().notNull(), // Negative words to use
  featurePoints: text("feature_points").array().notNull(), // Key features to mention
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertReviewTemplateSchema = createInsertSchema(reviewTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Review Generation Settings
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