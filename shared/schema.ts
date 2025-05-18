import { pgTable, text, serial, integer, boolean, timestamp, primaryKey, date, real } from "drizzle-orm/pg-core";
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
  profileData: text("profile_data"), // JSON string: fullName, phoneNumber, country, city, address, birthDate, languagePreference, avatarUrl
  securitySettings: text("security_settings"), // JSON string: twoFactorEnabled, accountLocked, ipRestricted, allowedIps
  notificationPreferences: text("notification_preferences"), // JSON string: emailEnabled, subscriptionAlerts, promotions
  billingInfo: text("billing_info"), // JSON string: billingAddress, taxInfo, etc.
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
  billingCycle: text("billing_cycle").default("monthly"), // payment cycle (monthly, yearly, etc.)
  currentPrice: integer("current_price").notNull(), // current subscription price
  nextBillingDate: timestamp("next_billing_date"), // when the next payment is due
  stripeCurrentPriceId: text("stripe_current_price_id"), // Stripe price ID for the current subscription
});

export const insertSubscriptionSchema = createInsertSchema(userSubscriptions).omit({
  id: true,
});

// Platforms
export const platforms = pgTable("platforms", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  iconClass: text("icon_class"),
  bgColor: text("bg_color"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Ürün kategorileri
export const productCategories = pgTable("product_categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertPlatformSchema = createInsertSchema(platforms).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertProductCategorySchema = createInsertSchema(productCategories).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Services
export const services = pgTable("services", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  platformId: integer("platform_id").notNull(),
  price: integer("price").notNull(),
  stripePriceId: text("stripe_price_id"),
  viewerBotEnabled: boolean("viewer_bot_enabled").default(false),
  chatBotEnabled: boolean("chat_bot_enabled").default(false),
  followerBotEnabled: boolean("follower_bot_enabled").default(false),
  maxViewers: integer("max_viewers").default(0),
  maxChatMessages: integer("max_chat_messages").default(0),
  maxFollowers: integer("max_followers").default(0),
  serviceType: text("service_type").default("basic"), // basic, premium, enterprise
  isPopular: boolean("is_popular").default(false),
  sortOrder: integer("sort_order").default(0),
  isVisible: boolean("is_visible").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
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
export type ProductCategory = typeof productCategories.$inferSelect;
export type InsertProductCategory = z.infer<typeof insertProductCategorySchema>;

export type Service = typeof services.$inferSelect;
export type InsertService = z.infer<typeof insertServiceSchema>;

export type Payment = typeof payments.$inferSelect;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;

export type Invoice = typeof invoices.$inferSelect;
export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;

export type PaymentMethod = typeof paymentMethods.$inferSelect;
export type InsertPaymentMethod = z.infer<typeof insertPaymentMethodSchema>;

// User Activity Logs
export const userActivityLogs = pgTable("user_activity_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  type: text("type").notNull(), // login, subscription, payment, profile, security
  description: text("description").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  metadata: text("metadata"), // Additional data as JSON
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export const insertActivityLogSchema = createInsertSchema(userActivityLogs).omit({
  id: true,
  timestamp: true,
});

// User Session History
export const userSessions = pgTable("user_sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  sessionId: text("session_id").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  successful: boolean("successful").default(true).notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  expiresAt: timestamp("expires_at"),
  logoutTime: timestamp("logout_time"),
});

export const insertSessionSchema = createInsertSchema(userSessions).omit({
  id: true,
  timestamp: true,
});

export type UserActivityLog = typeof userActivityLogs.$inferSelect;
export type InsertUserActivityLog = z.infer<typeof insertActivityLogSchema>;

export type UserSessionHistory = typeof userSessions.$inferSelect;
export type InsertUserSessionHistory = z.infer<typeof insertSessionSchema>;

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  subscriptions: many(userSubscriptions),
  payments: many(payments),
  invoices: many(invoices),
  paymentMethods: many(paymentMethods),
  activityLogs: many(userActivityLogs),
  sessions: many(userSessions),
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

// Digital Products
export const digitalProducts = pgTable("digital_products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  price: integer("price").notNull(), // Price in cents
  platformId: integer("platform_id").notNull(),
  category: text("category").notNull(), // followers, likes, views, etc.
  serviceType: text("service_type").notNull(), // instant, gradual, etc.
  externalProductId: text("external_product_id"), // ID from external SMM provider
  externalServiceId: text("external_service_id"), // Service ID from external SMM provider
  providerName: text("provider_name"), // JustAnotherPanel, etc.
  minQuantity: integer("min_quantity").default(1),
  maxQuantity: integer("max_quantity"),
  isActive: boolean("is_active").default(true),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertDigitalProductSchema = createInsertSchema(digitalProducts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// SMM Providers
export const smmProviders = pgTable("smm_providers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  apiUrl: text("api_url").notNull(),
  apiKey: text("api_key").notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertSmmProviderSchema = createInsertSchema(smmProviders).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Digital Product Orders
export const digitalProductOrders = pgTable("digital_product_orders", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  productId: integer("product_id").notNull(),
  quantity: integer("quantity").notNull(),
  amount: integer("amount").notNull(), // Total amount in cents
  status: text("status").notNull(), // pending, processing, completed, failed, refunded
  targetUsername: text("target_username"), // Target social media username
  targetUrl: text("target_url"), // Target URL for the service
  externalOrderId: text("external_order_id"), // Order ID from external SMM provider
  refundReason: text("refund_reason"),
  paymentId: integer("payment_id"),
  metadata: text("metadata"), // Additional order metadata as JSON
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertDigitalProductOrderSchema = createInsertSchema(digitalProductOrders).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const platformsRelations = relations(platforms, ({ many }) => ({
  services: many(services),
  digitalProducts: many(digitalProducts),
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

// User Activity and Session Relations
export const userActivityLogsRelations = relations(userActivityLogs, ({ one }) => ({
  user: one(users, {
    fields: [userActivityLogs.userId],
    references: [users.id],
  }),
}));

export const userSessionsRelations = relations(userSessions, ({ one }) => ({
  user: one(users, {
    fields: [userSessions.userId],
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
  coverImage: text("coverimage"),
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
  coverImage: z.string().max(255).optional(),
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
  phone: text("phone"),
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

// System Settings Tables

// Email Templates
export const emailTemplates = pgTable("email_templates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(), // verification, welcome, invoice, etc.
  subject: text("subject").notNull(),
  htmlContent: text("html_content").notNull(),
  textContent: text("text_content"),
  isActive: boolean("is_active").notNull().default(true),
  lastUpdatedBy: integer("last_updated_by").references(() => users.id),
  variables: text("variables").array(), // Available variables that can be used in the template
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
});

export const insertEmailTemplateSchema = createInsertSchema(emailTemplates, {
  name: z.string().min(1).max(100),
  type: z.string().min(1),
  subject: z.string().min(1),
  htmlContent: z.string().min(1),
  textContent: z.string().optional(),
  variables: z.array(z.string()).optional()
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

// System Configurations
export const systemConfigs = pgTable("system_configs", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  value: text("value"),
  description: text("description"),
  category: text("category").notNull(), // integration, security, maintenance, etc.
  isEncrypted: boolean("is_encrypted").default(false),
  lastUpdatedBy: integer("last_updated_by").references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
});

export const insertSystemConfigSchema = createInsertSchema(systemConfigs, {
  key: z.string().min(1).max(100),
  value: z.string().optional(),
  description: z.string().optional(),
  category: z.string().min(1),
  isEncrypted: z.boolean().optional()
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

// IP Restrictions
export const ipRestrictions = pgTable("ip_restrictions", {
  id: serial("id").primaryKey(),
  ipAddress: text("ip_address").notNull(),
  type: text("type").notNull().default("deny"), // allow, deny
  comment: text("comment"),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
});

export const insertIpRestrictionSchema = createInsertSchema(ipRestrictions, {
  ipAddress: z.string().min(1),
  type: z.string().default("deny"),
  comment: z.string().optional()
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

// Audit Logs
export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  action: text("action").notNull(), // login, update_settings, create_post, etc.
  entityType: text("entity_type"), // user, blog_post, system_config, etc.
  entityId: text("entity_id"), // ID of the entity that was affected
  details: text("details"), // JSON with additional details
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").notNull().defaultNow()
});

export const insertAuditLogSchema = createInsertSchema(auditLogs, {
  action: z.string().min(1),
  entityType: z.string().optional(),
  entityId: z.string().optional(),
  details: z.string().optional(),
  ipAddress: z.string().optional(),
  userAgent: z.string().optional()
}).omit({
  id: true,
  createdAt: true
});

// Login Attempts - For tracking failed login attempts and account lockouts
export const loginAttempts = pgTable("login_attempts", {
  id: serial("id").primaryKey(),
  username: text("username").notNull(), // Username or email used in attempt
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  success: boolean("success").default(false),
  failureReason: text("failure_reason"), // Invalid password, account locked, etc.
  timestamp: timestamp("timestamp").defaultNow().notNull()
});

export const insertLoginAttemptSchema = createInsertSchema(loginAttempts, {
  username: z.string().min(1),
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),
  success: z.boolean().default(false),
  failureReason: z.string().optional()
}).omit({
  id: true,
  timestamp: true
});

// Locked Accounts - For tracking and managing account lockouts
export const lockedAccounts = pgTable("locked_accounts", {
  id: serial("id").primaryKey(),
  username: text("username").notNull(),
  email: text("email"),
  userId: integer("user_id"),
  failedAttempts: integer("failed_attempts").notNull().default(0),
  lastFailedIp: text("last_failed_ip"),
  lastFailedUserAgent: text("last_failed_user_agent"),
  lockedAt: timestamp("locked_at").notNull().defaultNow(),
  unlockAt: timestamp("unlock_at"), // If null, requires manual unlock
  reason: text("reason").notNull().default("Too many failed login attempts"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertLockedAccountSchema = createInsertSchema(lockedAccounts, {
  username: z.string().min(1),
  email: z.string().email().optional(),
  userId: z.number().optional(),
  failedAttempts: z.number().default(0),
  lastFailedIp: z.string().optional(),
  lastFailedUserAgent: z.string().optional(),
  reason: z.string().default("Too many failed login attempts"),
}).omit({
  id: true,
  lockedAt: true,
  createdAt: true,
  updatedAt: true
});

// Two Factor Authentication
export const twoFactorAuth = pgTable("two_factor_auth", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id).unique(),
  secret: text("secret").notNull(), // TOTP secret
  backupCodes: text("backup_codes"), // JSON array of hashed backup codes
  enabled: boolean("enabled").default(false),
  lastVerified: timestamp("last_verified"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

export const insertTwoFactorAuthSchema = createInsertSchema(twoFactorAuth, {
  userId: z.number(),
  secret: z.string().min(16),
  backupCodes: z.string().optional(),
  enabled: z.boolean().default(false)
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastVerified: true
});

// Security Questions
export const securityQuestions = pgTable("security_questions", {
  id: serial("id").primaryKey(),
  question: text("question").notNull().unique(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

export const insertSecurityQuestionSchema = createInsertSchema(securityQuestions, {
  question: z.string().min(5),
  isActive: z.boolean().default(true)
}).omit({
  id: true,
  createdAt: true
});

// User Security Questions
export const userSecurityQuestions = pgTable("user_security_questions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  questionId: integer("question_id").notNull().references(() => securityQuestions.id),
  answerHash: text("answer_hash").notNull(), // Hashed answer
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

export const insertUserSecurityQuestionSchema = createInsertSchema(userSecurityQuestions, {
  userId: z.number(),
  questionId: z.number(),
  answerHash: z.string().min(1)
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

// Enhanced Session Management
export const securitySessions = pgTable("security_sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  sessionToken: text("session_token").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  expiresAt: timestamp("expires_at").notNull(),
  lastActive: timestamp("last_active").defaultNow().notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

export const insertSecuritySessionSchema = createInsertSchema(securitySessions, {
  userId: z.number(),
  sessionToken: z.string().min(1),
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),
  expiresAt: z.date(),
  isActive: z.boolean().default(true)
}).omit({
  id: true,
  lastActive: true,
  createdAt: true
});

// Analytics & Reporting Tables

// User Analytics
export const userAnalytics = pgTable("user_analytics", {
  id: serial("id").primaryKey(),
  date: timestamp("date").notNull(),
  newUsers: integer("new_users").notNull().default(0),
  activeUsers: integer("active_users").notNull().default(0),
  totalUsers: integer("total_users").notNull().default(0),
  countryData: text("country_data"), // JSON with country distribution
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
});

// Subscription Analytics
export const subscriptionAnalytics = pgTable("subscription_analytics", {
  id: serial("id").primaryKey(),
  date: timestamp("date").notNull(),
  planId: integer("plan_id").references(() => subscriptionPlans.id),
  newSubscriptions: integer("new_subscriptions").notNull().default(0),
  cancelledSubscriptions: integer("cancelled_subscriptions").notNull().default(0),
  totalActiveSubscriptions: integer("total_active_subscriptions").notNull().default(0),
  renewalRate: integer("renewal_rate"), // Percentage stored as integer (e.g. 7500 = 75.00%)
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
});

// Financial Analytics
export const financialAnalytics = pgTable("financial_analytics", {
  id: serial("id").primaryKey(),
  date: timestamp("date").notNull(),
  totalRevenue: integer("total_revenue").notNull().default(0), // In cents
  newRevenue: integer("new_revenue").notNull().default(0), // In cents
  recurringRevenue: integer("recurring_revenue").notNull().default(0), // In cents
  refunds: integer("refunds").notNull().default(0), // In cents
  averageRevenuePerUser: integer("average_revenue_per_user").default(0), // In cents
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
});

// Performance Metrics
export const performanceMetrics = pgTable("performance_metrics", {
  id: serial("id").primaryKey(),
  date: timestamp("date").notNull(),
  serviceType: text("service_type").notNull(), // twitch_viewers, twitch_chatbot, etc.
  totalRequests: integer("total_requests").notNull().default(0),
  successfulRequests: integer("successful_requests").notNull().default(0),
  failedRequests: integer("failed_requests").notNull().default(0),
  averageResponseTime: integer("average_response_time").default(0), // In milliseconds
  resourceUsage: text("resource_usage"), // JSON with CPU, memory usage, etc.
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
});

// Type definitions for analytics and settings tables
export type SystemConfig = typeof systemConfigs.$inferSelect;
export type InsertSystemConfig = z.infer<typeof insertSystemConfigSchema>;

export type EmailTemplate = typeof emailTemplates.$inferSelect;
export type InsertEmailTemplate = z.infer<typeof insertEmailTemplateSchema>;

export type IpRestriction = typeof ipRestrictions.$inferSelect;
export type InsertIpRestriction = z.infer<typeof insertIpRestrictionSchema>;

export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;

export type LoginAttempt = typeof loginAttempts.$inferSelect;
export type InsertLoginAttempt = z.infer<typeof insertLoginAttemptSchema>;

export type LockedAccount = typeof lockedAccounts.$inferSelect;
export type InsertLockedAccount = z.infer<typeof insertLockedAccountSchema>;

export type TwoFactorAuth = typeof twoFactorAuth.$inferSelect;
export type InsertTwoFactorAuth = z.infer<typeof insertTwoFactorAuthSchema>;

export type SecurityQuestion = typeof securityQuestions.$inferSelect;
export type InsertSecurityQuestion = z.infer<typeof insertSecurityQuestionSchema>;

export type UserSecurityQuestion = typeof userSecurityQuestions.$inferSelect;
export type InsertUserSecurityQuestion = z.infer<typeof insertUserSecurityQuestionSchema>;

export type SecuritySession = typeof securitySessions.$inferSelect;
export type InsertSecuritySession = z.infer<typeof insertSecuritySessionSchema>;

// Admin Notifications
export const adminNotifications = pgTable("admin_notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id"), // If the notification is specific to a user/admin
  type: text("type").notNull(), // info, warning, success, error
  title: text("title").notNull(),
  message: text("message").notNull(),
  read: boolean("read").default(false).notNull(),
  link: text("link"), // Optional link to navigate to
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertAdminNotificationSchema = createInsertSchema(adminNotifications).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type AdminNotification = typeof adminNotifications.$inferSelect;
export type InsertAdminNotification = z.infer<typeof insertAdminNotificationSchema>;

// Analytics types
export type UserAnalytics = typeof userAnalytics.$inferSelect;
export type SubscriptionAnalytics = typeof subscriptionAnalytics.$inferSelect;
export type FinancialAnalytics = typeof financialAnalytics.$inferSelect;
export type PerformanceMetrics = typeof performanceMetrics.$inferSelect;

// Relations
export const emailTemplatesRelations = relations(emailTemplates, ({ one }) => ({
  lastUpdatedByUser: one(users, {
    fields: [emailTemplates.lastUpdatedBy],
    references: [users.id],
  }),
}));

export const systemConfigsRelations = relations(systemConfigs, ({ one }) => ({
  lastUpdatedByUser: one(users, {
    fields: [systemConfigs.lastUpdatedBy],
    references: [users.id],
  }),
}));

export const ipRestrictionsRelations = relations(ipRestrictions, ({ one }) => ({
  createdByUser: one(users, {
    fields: [ipRestrictions.createdBy],
    references: [users.id],
  }),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  user: one(users, {
    fields: [auditLogs.userId],
    references: [users.id],
  }),
}));

export const subscriptionAnalyticsRelations = relations(subscriptionAnalytics, ({ one }) => ({
  plan: one(subscriptionPlans, {
    fields: [subscriptionAnalytics.planId],
    references: [subscriptionPlans.id],
  }),
}));
