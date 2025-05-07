import { pgTable, text, serial, integer, boolean, timestamp, primaryKey } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// User Schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull(),
  role: text("role").default("user").notNull(),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  profileData: text("profile_data"),
  securitySettings: text("security_settings"),
  notificationPreferences: text("notification_preferences"),
  billingInfo: text("billing_info"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  role: true,
});

// Subscription Plans
export const subscriptionPlans = pgTable("subscription_plans", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  price: integer("price").notNull(),
  viewerCount: integer("viewer_count").notNull(),
  chatCount: integer("chat_count").notNull(),
  followerCount: integer("follower_count").notNull(),
  description: text("description").notNull(),
  features: text("features").array().notNull(),
  stripePriceId: text("stripe_price_id"),
  isPopular: boolean("is_popular").default(false),
  platform: text("platform").notNull(),
  geographicTargeting: boolean("geographic_targeting").default(false),
});

export const insertPlanSchema = createInsertSchema(subscriptionPlans).omit({
  id: true,
});

// User Subscriptions
export const userSubscriptions = pgTable("user_subscriptions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  planId: integer("plan_id").notNull(),
  status: text("status").notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  stripeSubscriptionId: text("stripe_subscription_id"),
  twitchChannel: text("twitch_channel"),
  isActive: boolean("is_active").default(false),
  lastActivated: timestamp("last_activated"),
  viewerSettings: text("viewer_settings").default("{}"), // JSON settings for viewers
  chatSettings: text("chat_settings").default("{}"), // JSON settings for chat bots
  followerSettings: text("follower_settings").default("{}"), // JSON settings for followers
  geographicTargeting: text("geographic_targeting"), // Countries targeted
});

export const insertSubscriptionSchema = createInsertSchema(userSubscriptions).omit({
  id: true,
});

// Platforms
export const platforms = pgTable("platforms", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description").notNull(),
  iconClass: text("icon_class").notNull(),
  bgColor: text("bg_color").notNull(),
});

export const insertPlatformSchema = createInsertSchema(platforms).omit({
  id: true,
});

// Services
export const services = pgTable("services", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  platformId: integer("platform_id").notNull(),
  price: integer("price").notNull(),
  stripePriceId: text("stripe_price_id"),
});

export const insertServiceSchema = createInsertSchema(services).omit({
  id: true,
});

// Payments
export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  amount: integer("amount").notNull(),
  currency: text("currency").default("usd").notNull(),
  status: text("status").notNull(),
  paymentMethod: text("payment_method").notNull(),
  stripePaymentIntentId: text("stripe_payment_intent_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertPaymentSchema = createInsertSchema(payments).omit({
  id: true,
  createdAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type SubscriptionPlan = typeof subscriptionPlans.$inferSelect;
export type InsertSubscriptionPlan = z.infer<typeof insertPlanSchema>;

export type UserSubscription = typeof userSubscriptions.$inferSelect;
export type InsertUserSubscription = z.infer<typeof insertSubscriptionSchema>;

export type Platform = typeof platforms.$inferSelect;
export type InsertPlatform = z.infer<typeof insertPlatformSchema>;

export type Service = typeof services.$inferSelect;
export type InsertService = z.infer<typeof insertServiceSchema>;

export type Payment = typeof payments.$inferSelect;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  subscriptions: many(userSubscriptions),
  payments: many(payments),
}));

export const subscriptionPlansRelations = relations(subscriptionPlans, ({ many }) => ({
  userSubscriptions: many(userSubscriptions),
}));

export const userSubscriptionsRelations = relations(userSubscriptions, ({ one }) => ({
  user: one(users, {
    fields: [userSubscriptions.userId],
    references: [users.id],
  }),
  plan: one(subscriptionPlans, {
    fields: [userSubscriptions.planId],
    references: [subscriptionPlans.id],
  }),
}));

export const platformsRelations = relations(platforms, ({ many }) => ({
  services: many(services),
}));

export const servicesRelations = relations(services, ({ one }) => ({
  platform: one(platforms, {
    fields: [services.platformId],
    references: [platforms.id],
  }),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  user: one(users, {
    fields: [payments.userId],
    references: [users.id],
  }),
}));
