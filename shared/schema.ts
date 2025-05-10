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
  // Email verification fields
  isEmailVerified: boolean("is_email_verified").default(false).notNull(),
  verificationToken: text("verification_token"),
  verificationTokenExpiry: timestamp("verification_token_expiry"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  role: true,
  isEmailVerified: true,
});

// Subscription Plans
export const subscriptionPlans = pgTable("subscription_plans", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  price: integer("price").notNull(), // Price in cents
  annualPrice: integer("annual_price"), // Annual price in cents (optional)
  billingCycle: text("billing_cycle").default("monthly"), // monthly or annual
  viewerCount: integer("viewer_count").notNull(),
  chatCount: integer("chat_count").notNull(),
  followerCount: integer("follower_count").notNull(),
  description: text("description").notNull(),
  features: text("features").array().notNull(),
  stripePriceId: text("stripe_price_id"),
  stripeProductId: text("stripe_product_id"),
  stripeAnnualPriceId: text("stripe_annual_price_id"),
  isPopular: boolean("is_popular").default(false),
  platform: text("platform").notNull(),
  geographicTargeting: boolean("geographic_targeting").default(false),
  promoCode: text("promo_code"),
  discountPercentage: integer("discount_percentage"),
  isVisible: boolean("is_visible").default(true).notNull(),
  isComingSoon: boolean("is_coming_soon").default(false).notNull(),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertPlanSchema = createInsertSchema(subscriptionPlans).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
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
  description: text("description"),
  status: text("status").notNull(), // pending, completed, failed, refunded
  paymentMethod: text("payment_method").notNull(), // stripe_card, stripe_sepa, crypto_btc, crypto_eth, etc.
  paymentType: text("payment_type").default("one_time").notNull(), // one_time, subscription, refund
  refundReason: text("refund_reason"),
  invoiceId: integer("invoice_id"),
  subscriptionId: integer("subscription_id"),
  stripePaymentIntentId: text("stripe_payment_intent_id"),
  stripeCustomerId: text("stripe_customer_id"),
  cryptoTransactionHash: text("crypto_transaction_hash"),
  cryptoAddress: text("crypto_address"),
  cryptoCurrency: text("crypto_currency"),
  metadata: text("metadata"), // Any additional payment metadata as JSON
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertPaymentSchema = createInsertSchema(payments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Invoices
export const invoices = pgTable("invoices", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  invoiceNumber: text("invoice_number").notNull(),
  amount: integer("amount").notNull(),
  currency: text("currency").default("usd").notNull(),
  status: text("status").notNull(), // draft, issued, paid, void, overdue
  dueDate: timestamp("due_date"),
  issuedDate: timestamp("issued_date").defaultNow().notNull(),
  paidDate: timestamp("paid_date"),
  billingName: text("billing_name"),
  billingEmail: text("billing_email"),
  billingAddress: text("billing_address"),
  billingCity: text("billing_city"),
  billingState: text("billing_state"),
  billingCountry: text("billing_country"),
  billingPostalCode: text("billing_postal_code"),
  taxAmount: integer("tax_amount").default(0),
  taxRate: integer("tax_rate").default(0),
  notes: text("notes"),
  termsAndConditions: text("terms_and_conditions"),
  stripeInvoiceId: text("stripe_invoice_id"),
  items: text("items").array(), // JSON array of invoice line items
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertInvoiceSchema = createInsertSchema(invoices).omit({
  id: true,
  createdAt: true, 
  updatedAt: true,
});

// Payment Methods (stored payment methods for users)
export const paymentMethods = pgTable("payment_methods", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  type: text("type").notNull(), // card, bank_account, crypto_wallet
  name: text("name").notNull(), // User-friendly name for the payment method
  isDefault: boolean("is_default").default(false),
  // Card specific fields
  cardBrand: text("card_brand"), // visa, mastercard, etc.
  cardLast4: text("card_last4"), 
  cardExpiryMonth: text("card_expiry_month"),
  cardExpiryYear: text("card_expiry_year"),
  // Bank account specific fields
  bankName: text("bank_name"),
  bankLast4: text("bank_last4"),
  // Crypto specific fields
  cryptoAddress: text("crypto_address"),
  cryptoCurrency: text("crypto_currency"), // BTC, ETH, etc.
  // Stripe specific fields
  stripePaymentMethodId: text("stripe_payment_method_id"),
  billingDetails: text("billing_details"), // Billing details as JSON
  metadata: text("metadata"), // Any additional payment method metadata as JSON
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertPaymentMethodSchema = createInsertSchema(paymentMethods).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
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

export type Invoice = typeof invoices.$inferSelect;
export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;

export type PaymentMethod = typeof paymentMethods.$inferSelect;
export type InsertPaymentMethod = z.infer<typeof insertPaymentMethodSchema>;

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  subscriptions: many(userSubscriptions),
  payments: many(payments),
  invoices: many(invoices),
  paymentMethods: many(paymentMethods),
}));

export const subscriptionPlansRelations = relations(subscriptionPlans, ({ many }) => ({
  userSubscriptions: many(userSubscriptions),
}));

export const userSubscriptionsRelations = relations(userSubscriptions, ({ one, many }) => ({
  user: one(users, {
    fields: [userSubscriptions.userId],
    references: [users.id],
  }),
  plan: one(subscriptionPlans, {
    fields: [userSubscriptions.planId],
    references: [subscriptionPlans.id],
  }),
  payments: many(payments, { relationName: "subscription_payments" }),
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
  invoice: one(invoices, {
    fields: [payments.invoiceId],
    references: [invoices.id],
    relationName: "invoice_payment",
  }),
  subscription: one(userSubscriptions, {
    fields: [payments.subscriptionId],
    references: [userSubscriptions.id],
    relationName: "subscription_payments",
  }),
}));

export const invoicesRelations = relations(invoices, ({ one, many }) => ({
  user: one(users, {
    fields: [invoices.userId],
    references: [users.id],
  }),
  payments: many(payments, { relationName: "invoice_payment" }),
}));

export const paymentMethodsRelations = relations(paymentMethods, ({ one }) => ({
  user: one(users, {
    fields: [paymentMethods.userId],
    references: [users.id],
  }),
}));

// Content Management Tables

// Page Content Table - For homepage sections and other static pages
export const pageContents = pgTable("page_contents", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  metaTitle: text("meta_title"),
  metaDescription: text("meta_description"),
  isActive: boolean("is_active").notNull().default(true),
  position: integer("position").notNull().default(0),
  lastUpdatedBy: integer("last_updated_by").references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
});

export const insertPageContentSchema = createInsertSchema(pageContents, {
  slug: z.string().min(1).max(100),
  title: z.string().min(1).max(200),
  content: z.string().min(1),
  metaTitle: z.string().max(200).optional(),
  metaDescription: z.string().optional()
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

// Blog Posts Table
export const blogCategories = pgTable("blog_categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  position: integer("position").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
});

export const insertBlogCategorySchema = createInsertSchema(blogCategories, {
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(100),
  description: z.string().optional()
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const blogPosts = pgTable("blog_posts", {
  id: serial("id").primaryKey(),
  categoryId: integer("category_id").notNull().references(() => blogCategories.id),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  excerpt: text("excerpt").notNull(),
  content: text("content").notNull(),
  featuredImage: text("featured_image"),
  authorId: integer("author_id").notNull().references(() => users.id),
  metaTitle: text("meta_title"),
  metaDescription: text("meta_description"),
  tags: text("tags"),
  status: text("status").notNull().default("draft"), // draft, published, archived
  publishedAt: timestamp("published_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
});

export const insertBlogPostSchema = createInsertSchema(blogPosts, {
  title: z.string().min(1).max(200),
  slug: z.string().min(1).max(200),
  excerpt: z.string().min(1),
  content: z.string().min(1),
  featuredImage: z.string().max(255).optional(),
  metaTitle: z.string().max(200).optional(),
  metaDescription: z.string().optional(),
  tags: z.string().optional(),
  status: z.string().default("draft")
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

// FAQ Management
export const faqCategories = pgTable("faq_categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  position: integer("position").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
});

export const insertFaqCategorySchema = createInsertSchema(faqCategories, {
  name: z.string().min(1).max(100),
  description: z.string().optional()
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const faqs = pgTable("faqs", {
  id: serial("id").primaryKey(),
  categoryId: integer("category_id").notNull().references(() => faqCategories.id),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  position: integer("position").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
});

export const insertFaqSchema = createInsertSchema(faqs, {
  question: z.string().min(1).max(255),
  answer: z.string().min(1)
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

// Contact Form Messages
export const contactMessages = pgTable("contact_messages", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  subject: text("subject").notNull(),
  message: text("message").notNull(),
  status: text("status").notNull().default("unread"), // unread, read, replied
  ipAddress: text("ip_address"),
  repliedBy: integer("replied_by").references(() => users.id),
  repliedAt: timestamp("replied_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
});

export const insertContactMessageSchema = createInsertSchema(contactMessages, {
  name: z.string().min(1).max(100),
  email: z.string().email().max(100),
  subject: z.string().min(1).max(200),
  message: z.string().min(1)
}).omit({
  id: true,
  status: true,
  ipAddress: true,
  repliedBy: true,
  repliedAt: true,
  createdAt: true,
  updatedAt: true
});

// Types for content management tables
export type PageContent = typeof pageContents.$inferSelect;
export type InsertPageContent = z.infer<typeof insertPageContentSchema>;

export type BlogCategory = typeof blogCategories.$inferSelect;
export type InsertBlogCategory = z.infer<typeof insertBlogCategorySchema>;

export type BlogPost = typeof blogPosts.$inferSelect;
export type InsertBlogPost = z.infer<typeof insertBlogPostSchema>;

export type FaqCategory = typeof faqCategories.$inferSelect;
export type InsertFaqCategory = z.infer<typeof insertFaqCategorySchema>;

export type Faq = typeof faqs.$inferSelect;
export type InsertFaq = z.infer<typeof insertFaqSchema>;

export type ContactMessage = typeof contactMessages.$inferSelect;
export type InsertContactMessage = z.infer<typeof insertContactMessageSchema>;

// Relations for content management tables
export const pageContentsRelations = relations(pageContents, ({ one }) => ({
  lastUpdatedByUser: one(users, {
    fields: [pageContents.lastUpdatedBy],
    references: [users.id],
  }),
}));

export const blogCategoriesRelations = relations(blogCategories, ({ many }) => ({
  posts: many(blogPosts),
}));

export const blogPostsRelations = relations(blogPosts, ({ one }) => ({
  category: one(blogCategories, {
    fields: [blogPosts.categoryId],
    references: [blogCategories.id],
  }),
  author: one(users, {
    fields: [blogPosts.authorId],
    references: [users.id],
  }),
}));

export const faqCategoriesRelations = relations(faqCategories, ({ many }) => ({
  faqs: many(faqs),
}));

export const faqsRelations = relations(faqs, ({ one }) => ({
  category: one(faqCategories, {
    fields: [faqs.categoryId],
    references: [faqCategories.id],
  }),
}));

export const contactMessagesRelations = relations(contactMessages, ({ one }) => ({
  repliedByUser: one(users, {
    fields: [contactMessages.repliedBy],
    references: [users.id],
  }),
}));
