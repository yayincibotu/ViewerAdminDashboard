import { 
  users, User, InsertUser, 
  subscriptionPlans, SubscriptionPlan, 
  userSubscriptions, UserSubscription, InsertUserSubscription,
  platforms, Platform, InsertPlatform, 
  services, Service, InsertService, 
  payments, Payment, InsertPayment,
  invoices, Invoice, InsertInvoice,
  paymentMethods, PaymentMethod, InsertPaymentMethod,
  pageContents, PageContent, InsertPageContent,
  blogCategories, BlogCategory, InsertBlogCategory,
  blogPosts, BlogPost, InsertBlogPost,
  faqCategories, FaqCategory, InsertFaqCategory,
  faqs, Faq, InsertFaq,
  contactMessages, ContactMessage, InsertContactMessage
} from "@shared/schema";
import session from "express-session";
import { db } from "./db";
import { eq, and, or, gt, gte, lt, lte, desc, asc, isNull, isNotNull, sql } from "drizzle-orm";
import connectPg from "connect-pg-simple";
import { pool } from "./db";
import crypto from "crypto";
import { mailService } from "./mail";

// Session store setup
const PostgresSessionStore = connectPg(session);

// Interface remains the same
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, data: Partial<User>): Promise<User | undefined>;
  updateStripeCustomerId(id: number, customerId: string): Promise<User | undefined>;
  updateUserStripeInfo(id: number, data: { customerId: string, subscriptionId: string }): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;
  
  // Email verification operations
  setVerificationToken(userId: number, token: string, expiryHours?: number): Promise<User | undefined>;
  verifyEmail(token: string): Promise<User | undefined>;
  resendVerificationEmail(userId: number): Promise<{ user: User, token: string } | undefined>;
  
  // Subscription plan operations
  getSubscriptionPlans(): Promise<SubscriptionPlan[]>;
  getSubscriptionPlan(id: number): Promise<SubscriptionPlan | undefined>;
  createSubscriptionPlan(plan: SubscriptionPlan): Promise<SubscriptionPlan>;
  updateSubscriptionPlan(id: number, data: Partial<SubscriptionPlan>): Promise<SubscriptionPlan | undefined>;
  deleteSubscriptionPlan(id: number): Promise<boolean>;
  
  // Platform operations
  getPlatforms(): Promise<Platform[]>;
  getPlatform(id: number): Promise<Platform | undefined>;
  createPlatform(platform: InsertPlatform): Promise<Platform>;
  
  // Service operations
  getServices(): Promise<Service[]>;
  getServicesByPlatform(platformId: number): Promise<Service[]>;
  getService(id: number): Promise<Service | undefined>;
  createService(service: InsertService): Promise<Service>;
  
  // Payment operations
  createPayment(payment: InsertPayment): Promise<Payment>;
  getUserPayments(userId: number): Promise<Payment[]>;
  getPayment(id: number): Promise<Payment | undefined>;
  getPaymentsByInvoiceId(invoiceId: number): Promise<Payment[]>;
  getPaymentsByStatus(status: string): Promise<Payment[]>;
  getPaymentsByDateRange(startDate: Date, endDate: Date): Promise<Payment[]>;
  updatePaymentStatus(id: number, status: string): Promise<Payment | undefined>;
  refundPayment(id: number, reason: string): Promise<Payment | undefined>;
  
  // Invoice operations
  createInvoice(invoice: InsertInvoice): Promise<Invoice>;
  getInvoice(id: number): Promise<Invoice | undefined>;
  getUserInvoices(userId: number): Promise<Invoice[]>;
  getInvoicesByStatus(status: string): Promise<Invoice[]>;
  getInvoicesByDateRange(startDate: Date, endDate: Date): Promise<Invoice[]>;
  updateInvoice(id: number, data: Partial<Invoice>): Promise<Invoice | undefined>;
  updateInvoiceStatus(id: number, status: string): Promise<Invoice | undefined>;
  deleteInvoice(id: number): Promise<boolean>;
  
  // Payment Method operations
  createPaymentMethod(method: InsertPaymentMethod): Promise<PaymentMethod>;
  getUserPaymentMethods(userId: number): Promise<PaymentMethod[]>;
  getPaymentMethod(id: number): Promise<PaymentMethod | undefined>;
  updatePaymentMethod(id: number, data: Partial<PaymentMethod>): Promise<PaymentMethod | undefined>;
  setDefaultPaymentMethod(id: number, userId: number): Promise<PaymentMethod | undefined>;
  deletePaymentMethod(id: number): Promise<boolean>;
  
  // User Subscription operations
  getUserSubscriptions(userId: number): Promise<UserSubscription[]>;
  getUserSubscriptionWithPlan(id: number): Promise<{ subscription: UserSubscription, plan: SubscriptionPlan } | undefined>;
  createUserSubscription(subscription: InsertUserSubscription): Promise<UserSubscription>;
  updateUserSubscription(id: number, data: Partial<UserSubscription>): Promise<UserSubscription | undefined>;
  updateSubscriptionTwitchChannel(id: number, twitchChannel: string): Promise<UserSubscription | undefined>;
  toggleSubscriptionStatus(id: number, isActive: boolean): Promise<UserSubscription | undefined>;
  updateViewerSettings(id: number, settings: string): Promise<UserSubscription | undefined>;
  updateChatSettings(id: number, settings: string): Promise<UserSubscription | undefined>;
  updateFollowerSettings(id: number, settings: string): Promise<UserSubscription | undefined>;
  updateGeographicTargeting(id: number, countries: string): Promise<UserSubscription | undefined>;

  // Content Management - Page Content
  getPageContents(): Promise<PageContent[]>;
  getPageContentBySlug(slug: string): Promise<PageContent | undefined>;
  getPageContent(id: number): Promise<PageContent | undefined>;
  createPageContent(content: InsertPageContent): Promise<PageContent>;
  updatePageContent(id: number, data: Partial<PageContent>): Promise<PageContent | undefined>;
  deletePageContent(id: number): Promise<boolean>;
  
  // Content Management - Blog
  getBlogCategories(): Promise<BlogCategory[]>;
  getBlogCategory(id: number): Promise<BlogCategory | undefined>;
  createBlogCategory(category: InsertBlogCategory): Promise<BlogCategory>;
  updateBlogCategory(id: number, data: Partial<BlogCategory>): Promise<BlogCategory | undefined>;
  deleteBlogCategory(id: number): Promise<boolean>;
  
  getBlogPosts(filters?: { categoryId?: number, status?: string, tag?: string }): Promise<BlogPost[]>;
  getBlogPost(id: number): Promise<BlogPost | undefined>;
  getBlogPostBySlug(slug: string): Promise<BlogPost | undefined>;
  createBlogPost(post: InsertBlogPost): Promise<BlogPost>;
  updateBlogPost(id: number, data: Partial<BlogPost>): Promise<BlogPost | undefined>;
  publishBlogPost(id: number): Promise<BlogPost | undefined>;
  unpublishBlogPost(id: number): Promise<BlogPost | undefined>;
  deleteBlogPost(id: number): Promise<boolean>;
  
  // Content Management - FAQ
  getFaqCategories(): Promise<FaqCategory[]>;
  getFaqCategory(id: number): Promise<FaqCategory | undefined>;
  createFaqCategory(category: InsertFaqCategory): Promise<FaqCategory>;
  updateFaqCategory(id: number, data: Partial<FaqCategory>): Promise<FaqCategory | undefined>;
  deleteFaqCategory(id: number): Promise<boolean>;
  
  getFaqs(categoryId?: number): Promise<Faq[]>;
  getFaq(id: number): Promise<Faq | undefined>;
  createFaq(faq: InsertFaq): Promise<Faq>;
  updateFaq(id: number, data: Partial<Faq>): Promise<Faq | undefined>;
  toggleFaqStatus(id: number, isActive: boolean): Promise<Faq | undefined>;
  deleteFaq(id: number): Promise<boolean>;
  
  // Content Management - Contact Messages
  getContactMessages(filters?: { status?: string }): Promise<ContactMessage[]>;
  getContactMessage(id: number): Promise<ContactMessage | undefined>;
  createContactMessage(message: InsertContactMessage): Promise<ContactMessage>;
  updateContactMessageStatus(id: number, status: string): Promise<ContactMessage | undefined>;
  replyToContactMessage(id: number, userId: number): Promise<ContactMessage | undefined>;
  deleteContactMessage(id: number): Promise<boolean>;

  // Session store
  sessionStore: any; // session.Store
}

export class DatabaseStorage implements IStorage {
  sessionStore: any; // Session store instance

  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true,
    });
    
    // Initialize sample data
    this.initializeSampleData();
  }

  private async initializeSampleData() {
    try {
      // Check if we already have data
      const existingPlans = await db.select({ count: subscriptionPlans.id }).from(subscriptionPlans).limit(1);
      
      if (existingPlans.length === 0 || existingPlans[0].count === 0) {
        // Add sample platforms
        await db.insert(platforms).values([
          { name: "Twitch", slug: "twitch", description: "Buy Real and Organic Twitch viewers. With 100% customizable and easy control panel.", iconClass: "fab fa-twitch", bgColor: "bg-purple-500" },
          { name: "Kick", slug: "kick", description: "You can buy Kick viewers or Kick followers via Viewerapps.", iconClass: "fas fa-play", bgColor: "bg-green-500" },
          { name: "Instagram", slug: "instagram", description: "Buy instant delivery instagram products and services.", iconClass: "fab fa-instagram", bgColor: "bg-pink-500" },
          { name: "YouTube", slug: "youtube", description: "Geotargeting with Youtube services with instant delivery.", iconClass: "fab fa-youtube", bgColor: "bg-red-500" }
        ]);
        
        // Add sample subscription plans
        await db.insert(subscriptionPlans).values([
          { 
            name: "25 Live Viewers", 
            price: 30, 
            viewerCount: 25, 
            chatCount: 25, 
            followerCount: 50, 
            description: "Basic plan for new streamers",
            features: ["Up to 25 Live Viewers", "Realistic Chatters", "Up to 25 Chat List", "Chat Package", "Realistic View", "Unlimited Usage", "Free Support: 24/7", "50 Twitch Follower"],
            stripePriceId: "price_basic",
            isPopular: false,
            platform: "twitch",
            geographicTargeting: false
          },
          { 
            name: "50 Live Viewers", 
            price: 50, 
            viewerCount: 50, 
            chatCount: 50, 
            followerCount: 100, 
            description: "Standard plan for growing streamers",
            features: ["Up to 50 Live Viewers", "Realistic Chatters", "Up to 50 Chat List", "Chat Package", "Realistic View", "Unlimited Usage", "Free Support: 24/7", "100 Twitch Follower"],
            stripePriceId: "price_standard",
            isPopular: false,
            platform: "twitch",
            geographicTargeting: false
          },
          { 
            name: "100 Live Viewers", 
            price: 75, 
            viewerCount: 100, 
            chatCount: 100, 
            followerCount: 250, 
            description: "Popular plan for established streamers",
            features: ["Up to 100 Live Viewers", "Realistic Chatters", "Up to 100 Chat List", "Customizable Chat Package", "Realistic View", "Unlimited Usage", "Free Support: 24/7", "250 Twitch Follower"],
            stripePriceId: "price_popular",
            isPopular: true,
            platform: "twitch",
            geographicTargeting: false
          },
          { 
            name: "250 Live Viewers", 
            price: 140, 
            viewerCount: 250, 
            chatCount: 250, 
            followerCount: 500, 
            description: "Premium plan for professional streamers",
            features: ["Up to 250 Live Viewers", "Realistic Chatters", "Up to 250 Chat List", "Customizable Chat Package", "Realistic View", "Unlimited Usage", "Free Support: 24/7", "500 Twitch Follower", "Geographic Targeting"],
            stripePriceId: "price_premium",
            isPopular: false,
            platform: "twitch",
            geographicTargeting: true
          }
        ]);
        
        // Add sample admin user
        await this.createUser({
          username: "admin",
          password: "$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy", // hash for 'password'
          email: "admin@viewerapps.com",
          role: "admin"
        });
        
        console.log("Sample data initialized successfully");
      }
    } catch (error) {
      console.error("Error initializing sample data:", error);
    }
  }

  async getUser(id: number): Promise<User | undefined> {
    console.log(`[DB] Fetching user with ID: ${id} from PostgreSQL database`);
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }
  
  // Email verification methods
  async setVerificationToken(userId: number, token: string, expiryHours: number = 24): Promise<User | undefined> {
    const expiry = new Date();
    expiry.setHours(expiry.getHours() + expiryHours);
    
    return this.updateUser(userId, {
      verificationToken: token,
      verificationTokenExpiry: expiry
    });
  }
  
  async verifyEmail(token: string): Promise<User | undefined> {
    // Find user with this token
    const [user] = await db.select()
      .from(users)
      .where(eq(users.verificationToken, token));
    
    if (!user) {
      return undefined;
    }
    
    // Check if token is expired
    if (user.verificationTokenExpiry && new Date(user.verificationTokenExpiry) < new Date()) {
      return undefined;
    }
    
    // Update user to mark email as verified and clear token
    return this.updateUser(user.id, {
      isEmailVerified: true,
      verificationToken: null,
      verificationTokenExpiry: null
    });
  }
  
  async resendVerificationEmail(userId: number): Promise<{ user: User, token: string } | undefined> {
    const user = await this.getUser(userId);
    if (!user) {
      return undefined;
    }
    
    // Generate a new token (we'll do this in the routes.ts file)
    const token = crypto.randomBytes(32).toString('hex');
    
    // Update user with new token
    const updatedUser = await this.setVerificationToken(userId, token);
    if (!updatedUser) {
      return undefined;
    }
    
    return { user: updatedUser, token };
  }

  async updateUser(id: number, data: Partial<User>): Promise<User | undefined> {
    console.log(`Updating user ${id} with data:`, data);
    const [updatedUser] = await db.update(users)
      .set(data)
      .where(eq(users.id, id))
      .returning();
    console.log(`Updated user result:`, updatedUser);
    return updatedUser;
  }

  async updateStripeCustomerId(id: number, customerId: string): Promise<User | undefined> {
    return this.updateUser(id, { stripeCustomerId: customerId });
  }

  async updateUserStripeInfo(id: number, data: { customerId: string, subscriptionId: string }): Promise<User | undefined> {
    return this.updateUser(id, {
      stripeCustomerId: data.customerId,
      stripeSubscriptionId: data.subscriptionId
    });
  }
  
  async deleteUser(id: number): Promise<boolean> {
    try {
      // First, delete related records
      
      // Delete user's payments
      await db.delete(payments).where(eq(payments.userId, id));
      
      // Delete user's subscriptions
      await db.delete(userSubscriptions).where(eq(userSubscriptions.userId, id));
      
      // Finally, delete the user
      const result = await db.delete(users).where(eq(users.id, id)).returning();
      
      return result.length > 0;
    } catch (error) {
      console.error("Error deleting user:", error);
      return false;
    }
  }

  async getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    return db.select().from(subscriptionPlans);
  }

  async getSubscriptionPlan(id: number): Promise<SubscriptionPlan | undefined> {
    const [plan] = await db.select().from(subscriptionPlans).where(eq(subscriptionPlans.id, id));
    return plan;
  }

  async createSubscriptionPlan(plan: SubscriptionPlan): Promise<SubscriptionPlan> {
    const [newPlan] = await db.insert(subscriptionPlans).values(plan).returning();
    return newPlan;
  }
  
  async updateSubscriptionPlan(id: number, data: Partial<SubscriptionPlan>): Promise<SubscriptionPlan | undefined> {
    const [updatedPlan] = await db
      .update(subscriptionPlans)
      .set({
        ...data,
        updatedAt: new Date()
      })
      .where(eq(subscriptionPlans.id, id))
      .returning();
    
    return updatedPlan;
  }
  
  async deleteSubscriptionPlan(id: number): Promise<boolean> {
    try {
      // Check if there are any active subscriptions using this plan
      const subscriptions = await db
        .select()
        .from(userSubscriptions)
        .where(eq(userSubscriptions.planId, id));
        
      // If there are active subscriptions, don't allow deletion
      if (subscriptions.length > 0) {
        return false;
      }
        
      // Delete the plan
      const result = await db
        .delete(subscriptionPlans)
        .where(eq(subscriptionPlans.id, id));
        
      return true;
    } catch (error) {
      console.error("Error deleting subscription plan:", error);
      return false;
    }
  }

  async getPlatforms(): Promise<Platform[]> {
    return db.select().from(platforms);
  }

  async getPlatform(id: number): Promise<Platform | undefined> {
    const [platform] = await db.select().from(platforms).where(eq(platforms.id, id));
    return platform;
  }

  async createPlatform(platform: InsertPlatform): Promise<Platform> {
    const [newPlatform] = await db.insert(platforms).values(platform).returning();
    return newPlatform;
  }

  async getServices(): Promise<Service[]> {
    return db.select().from(services);
  }

  async getServicesByPlatform(platformId: number): Promise<Service[]> {
    return db.select().from(services).where(eq(services.platformId, platformId));
  }

  async getService(id: number): Promise<Service | undefined> {
    const [service] = await db.select().from(services).where(eq(services.id, id));
    return service;
  }

  async createService(service: InsertService): Promise<Service> {
    const [newService] = await db.insert(services).values(service).returning();
    return newService;
  }

  async createPayment(payment: InsertPayment): Promise<Payment> {
    const [newPayment] = await db.insert(payments).values(payment).returning();
    return newPayment;
  }

  async getUserPayments(userId: number): Promise<Payment[]> {
    return db.select().from(payments).where(eq(payments.userId, userId));
  }
  
  async getPayment(id: number): Promise<Payment | undefined> {
    const [payment] = await db.select().from(payments).where(eq(payments.id, id));
    return payment;
  }
  
  async getPaymentsByInvoiceId(invoiceId: number): Promise<Payment[]> {
    return db.select().from(payments).where(eq(payments.invoiceId, invoiceId));
  }
  
  async getPaymentsByStatus(status: string): Promise<Payment[]> {
    return db.select().from(payments).where(eq(payments.status, status));
  }
  
  async getPaymentsByDateRange(startDate: Date, endDate: Date): Promise<Payment[]> {
    return db
      .select()
      .from(payments)
      .where(
        and(
          gte(payments.createdAt, startDate),
          lte(payments.createdAt, endDate)
        )
      );
  }
  
  async updatePaymentStatus(id: number, status: string): Promise<Payment | undefined> {
    const [updatedPayment] = await db
      .update(payments)
      .set({ 
        status,
        updatedAt: new Date()
      })
      .where(eq(payments.id, id))
      .returning();
      
    return updatedPayment;
  }
  
  async refundPayment(id: number, reason: string): Promise<Payment | undefined> {
    const payment = await this.getPayment(id);
    
    if (!payment || payment.status === 'refunded') {
      return undefined;
    }
    
    // Create refund payment record
    const refundPayment: InsertPayment = {
      userId: payment.userId,
      amount: -payment.amount, // Negative amount to represent refund
      currency: payment.currency,
      status: 'completed',
      paymentMethod: payment.paymentMethod,
      paymentType: 'refund',
      refundReason: reason,
      invoiceId: payment.invoiceId,
      subscriptionId: payment.subscriptionId,
      stripePaymentIntentId: payment.stripePaymentIntentId,
      stripeCustomerId: payment.stripeCustomerId,
      description: `Refund for payment #${payment.id}: ${reason}`,
    };
    
    const [refundRecord] = await db.insert(payments).values(refundPayment).returning();
    
    // Update original payment status
    const [updatedPayment] = await db
      .update(payments)
      .set({ 
        status: 'refunded',
        refundReason: reason,
        updatedAt: new Date()
      })
      .where(eq(payments.id, id))
      .returning();
      
    return updatedPayment;
  }
  
  // Invoice operations
  async createInvoice(invoice: InsertInvoice): Promise<Invoice> {
    const [newInvoice] = await db.insert(invoices).values(invoice).returning();
    return newInvoice;
  }
  
  async getInvoice(id: number): Promise<Invoice | undefined> {
    const [invoice] = await db.select().from(invoices).where(eq(invoices.id, id));
    return invoice;
  }
  
  async getUserInvoices(userId: number): Promise<Invoice[]> {
    return db.select().from(invoices).where(eq(invoices.userId, userId));
  }
  
  async getInvoicesByStatus(status: string): Promise<Invoice[]> {
    return db.select().from(invoices).where(eq(invoices.status, status));
  }
  
  async getInvoicesByDateRange(startDate: Date, endDate: Date): Promise<Invoice[]> {
    return db
      .select()
      .from(invoices)
      .where(
        and(
          gte(invoices.issuedDate, startDate),
          lte(invoices.issuedDate, endDate)
        )
      );
  }
  
  async updateInvoice(id: number, data: Partial<Invoice>): Promise<Invoice | undefined> {
    const [updatedInvoice] = await db
      .update(invoices)
      .set({ 
        ...data,
        updatedAt: new Date()
      })
      .where(eq(invoices.id, id))
      .returning();
      
    return updatedInvoice;
  }
  
  async updateInvoiceStatus(id: number, status: string): Promise<Invoice | undefined> {
    const [updatedInvoice] = await db
      .update(invoices)
      .set({ 
        status,
        updatedAt: new Date(),
        paidDate: status === 'paid' ? new Date() : undefined
      })
      .where(eq(invoices.id, id))
      .returning();
      
    return updatedInvoice;
  }
  
  async deleteInvoice(id: number): Promise<boolean> {
    try {
      // Check if there are any payments associated with this invoice
      const associatedPayments = await this.getPaymentsByInvoiceId(id);
      
      // If there are payments, don't allow deletion
      if (associatedPayments.length > 0) {
        return false;
      }
      
      await db.delete(invoices).where(eq(invoices.id, id));
      return true;
    } catch (error) {
      console.error('Error deleting invoice:', error);
      return false;
    }
  }
  
  // Payment Method operations
  async createPaymentMethod(method: InsertPaymentMethod): Promise<PaymentMethod> {
    // If this is set as default, unset any other default payment methods for this user
    if (method.isDefault) {
      await db
        .update(paymentMethods)
        .set({ isDefault: false })
        .where(eq(paymentMethods.userId, method.userId));
    }
    
    const [newMethod] = await db.insert(paymentMethods).values(method).returning();
    return newMethod;
  }
  
  async getUserPaymentMethods(userId: number): Promise<PaymentMethod[]> {
    return db.select().from(paymentMethods).where(eq(paymentMethods.userId, userId));
  }
  
  async getPaymentMethod(id: number): Promise<PaymentMethod | undefined> {
    const [method] = await db.select().from(paymentMethods).where(eq(paymentMethods.id, id));
    return method;
  }
  
  async updatePaymentMethod(id: number, data: Partial<PaymentMethod>): Promise<PaymentMethod | undefined> {
    const [updatedMethod] = await db
      .update(paymentMethods)
      .set({ 
        ...data,
        updatedAt: new Date()
      })
      .where(eq(paymentMethods.id, id))
      .returning();
      
    return updatedMethod;
  }
  
  async setDefaultPaymentMethod(id: number, userId: number): Promise<PaymentMethod | undefined> {
    // First, unset any existing default payment methods for this user
    await db
      .update(paymentMethods)
      .set({ isDefault: false })
      .where(eq(paymentMethods.userId, userId));
    
    // Then set the specified payment method as default
    const [updatedMethod] = await db
      .update(paymentMethods)
      .set({ 
        isDefault: true,
        updatedAt: new Date()
      })
      .where(eq(paymentMethods.id, id))
      .returning();
      
    return updatedMethod;
  }
  
  async deletePaymentMethod(id: number): Promise<boolean> {
    try {
      // First check if this is the only payment method or if it's used in active subscriptions
      const method = await this.getPaymentMethod(id);
      
      if (!method) {
        return false;
      }
      
      // Don't allow deletion of the only default payment method if there are active subscriptions
      if (method.isDefault) {
        const userMethods = await this.getUserPaymentMethods(method.userId);
        const userSubscriptions = await this.getUserSubscriptions(method.userId);
        
        if (userMethods.length === 1 && userSubscriptions.some(sub => sub.status === 'active')) {
          return false;
        }
      }
      
      await db.delete(paymentMethods).where(eq(paymentMethods.id, id));
      return true;
    } catch (error) {
      console.error('Error deleting payment method:', error);
      return false;
    }
  }

  async getUserSubscriptions(userId: number): Promise<UserSubscription[]> {
    return db.select().from(userSubscriptions).where(eq(userSubscriptions.userId, userId));
  }

  async getUserSubscriptionWithPlan(id: number): Promise<{ subscription: UserSubscription, plan: SubscriptionPlan } | undefined> {
    const result = await db
      .select({
        subscription: userSubscriptions,
        plan: subscriptionPlans
      })
      .from(userSubscriptions)
      .innerJoin(subscriptionPlans, eq(userSubscriptions.planId, subscriptionPlans.id))
      .where(eq(userSubscriptions.id, id))
      .limit(1);
    
    return result.length > 0 ? result[0] : undefined;
  }

  async createUserSubscription(subscription: InsertUserSubscription): Promise<UserSubscription> {
    const [newSubscription] = await db.insert(userSubscriptions).values(subscription).returning();
    return newSubscription;
  }

  async updateUserSubscription(id: number, data: Partial<UserSubscription>): Promise<UserSubscription | undefined> {
    const [updatedSubscription] = await db.update(userSubscriptions)
      .set(data)
      .where(eq(userSubscriptions.id, id))
      .returning();
    return updatedSubscription;
  }
  
  async updateSubscriptionTwitchChannel(id: number, twitchChannel: string): Promise<UserSubscription | undefined> {
    return this.updateUserSubscription(id, { twitchChannel });
  }
  
  async toggleSubscriptionStatus(id: number, isActive: boolean): Promise<UserSubscription | undefined> {
    const lastActivated = isActive ? new Date() : undefined;
    return this.updateUserSubscription(id, { 
      isActive, 
      lastActivated: lastActivated as any // Drizzle type casting
    });
  }
  
  async updateViewerSettings(id: number, settings: string): Promise<UserSubscription | undefined> {
    return this.updateUserSubscription(id, { viewerSettings: settings });
  }
  
  async updateChatSettings(id: number, settings: string): Promise<UserSubscription | undefined> {
    return this.updateUserSubscription(id, { chatSettings: settings });
  }
  
  async updateFollowerSettings(id: number, settings: string): Promise<UserSubscription | undefined> {
    return this.updateUserSubscription(id, { followerSettings: settings });
  }
  
  async updateGeographicTargeting(id: number, countries: string): Promise<UserSubscription | undefined> {
    return this.updateUserSubscription(id, { geographicTargeting: countries });
  }

  // Content Management - Page Content
  async getPageContents(): Promise<PageContent[]> {
    try {
      console.log("[DB] Fetching page contents from PostgreSQL database");
      const contents = await db
        .select()
        .from(pageContents)
        .orderBy(pageContents.position);
      
      return contents;
    } catch (error) {
      console.error('[DB] Error fetching page contents:', error);
      return [];
    }
  }
  
  async getPageContentBySlug(slug: string): Promise<PageContent | undefined> {
    try {
      console.log(`[DB] Fetching page content with slug ${slug} from PostgreSQL database`);
      const [content] = await db
        .select()
        .from(pageContents)
        .where(eq(pageContents.slug, slug));
      
      return content;
    } catch (error) {
      console.error(`[DB] Error fetching page content with slug ${slug}:`, error);
      return undefined;
    }
  }
  
  async getPageContent(id: number): Promise<PageContent | undefined> {
    try {
      console.log(`[DB] Fetching page content with ID ${id} from PostgreSQL database`);
      const [content] = await db
        .select()
        .from(pageContents)
        .where(eq(pageContents.id, id));
      
      return content;
    } catch (error) {
      console.error(`[DB] Error fetching page content with ID ${id}:`, error);
      return undefined;
    }
  }
  
  async createPageContent(content: InsertPageContent): Promise<PageContent> {
    try {
      console.log("[DB] Creating new page content in PostgreSQL database");
      const [newContent] = await db
        .insert(pageContents)
        .values({
          ...content,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();
      
      return newContent;
    } catch (error) {
      console.error('[DB] Error creating page content:', error);
      throw new Error('Failed to create page content');
    }
  }
  
  async updatePageContent(id: number, data: Partial<PageContent>): Promise<PageContent | undefined> {
    try {
      console.log(`[DB] Updating page content with ID ${id} in PostgreSQL database`);
      const [updatedContent] = await db
        .update(pageContents)
        .set({
          ...data,
          updatedAt: new Date()
        })
        .where(eq(pageContents.id, id))
        .returning();
      
      return updatedContent;
    } catch (error) {
      console.error(`[DB] Error updating page content with ID ${id}:`, error);
      return undefined;
    }
  }
  
  async deletePageContent(id: number): Promise<boolean> {
    try {
      console.log(`[DB] Deleting page content with ID ${id} from PostgreSQL database`);
      await db
        .delete(pageContents)
        .where(eq(pageContents.id, id));
      
      return true;
    } catch (error) {
      console.error(`[DB] Error deleting page content with ID ${id}:`, error);
      return false;
    }
  }
  
  // Content Management - Blog
  async getBlogCategories(): Promise<BlogCategory[]> {
    try {
      console.log("[DB] Fetching blog categories from PostgreSQL database");
      const categories = await db
        .select()
        .from(blogCategories)
        .orderBy(blogCategories.position);
      
      return categories;
    } catch (error) {
      console.error('[DB] Error fetching blog categories:', error);
      return [];
    }
  }
  
  async getBlogCategory(id: number): Promise<BlogCategory | undefined> {
    try {
      console.log(`[DB] Fetching blog category with ID ${id} from PostgreSQL database`);
      const [category] = await db
        .select()
        .from(blogCategories)
        .where(eq(blogCategories.id, id));
      
      return category;
    } catch (error) {
      console.error(`[DB] Error fetching blog category with ID ${id}:`, error);
      return undefined;
    }
  }
  
  async createBlogCategory(category: InsertBlogCategory): Promise<BlogCategory> {
    try {
      console.log("[DB] Creating new blog category in PostgreSQL database");
      const [newCategory] = await db
        .insert(blogCategories)
        .values({
          ...category,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();
      
      return newCategory;
    } catch (error) {
      console.error('[DB] Error creating blog category:', error);
      throw new Error('Failed to create blog category');
    }
  }
  
  async updateBlogCategory(id: number, data: Partial<BlogCategory>): Promise<BlogCategory | undefined> {
    try {
      console.log(`[DB] Updating blog category with ID ${id} in PostgreSQL database`);
      const [updatedCategory] = await db
        .update(blogCategories)
        .set({
          ...data,
          updatedAt: new Date()
        })
        .where(eq(blogCategories.id, id))
        .returning();
      
      return updatedCategory;
    } catch (error) {
      console.error(`[DB] Error updating blog category with ID ${id}:`, error);
      return undefined;
    }
  }
  
  async deleteBlogCategory(id: number): Promise<boolean> {
    try {
      console.log(`[DB] Deleting blog category with ID ${id} from PostgreSQL database`);
      // First check if there are any posts in this category
      const posts = await db
        .select()
        .from(blogPosts)
        .where(eq(blogPosts.categoryId, id));
      
      if (posts.length > 0) {
        throw new Error('Cannot delete category that contains posts');
      }
      
      await db
        .delete(blogCategories)
        .where(eq(blogCategories.id, id));
      
      return true;
    } catch (error) {
      console.error(`[DB] Error deleting blog category with ID ${id}:`, error);
      return false;
    }
  }
  
  async getBlogPosts(filters?: { categoryId?: number, status?: string, tag?: string }): Promise<BlogPost[]> {
    try {
      console.log("[DB] Fetching blog posts from PostgreSQL database");
      let query = db.select().from(blogPosts);
      
      if (filters?.categoryId) {
        query = query.where(eq(blogPosts.categoryId, filters.categoryId));
      }
      
      if (filters?.status) {
        query = query.where(eq(blogPosts.status, filters.status));
      }
      
      if (filters?.tag) {
        query = query.where(sql`${blogPosts.tags} LIKE ${`%${filters.tag}%`}`);
      }
      
      const posts = await query.orderBy(desc(blogPosts.createdAt));
      return posts;
    } catch (error) {
      console.error('[DB] Error fetching blog posts:', error);
      return [];
    }
  }
  
  async getBlogPost(id: number): Promise<BlogPost | undefined> {
    try {
      console.log(`[DB] Fetching blog post with ID ${id} from PostgreSQL database`);
      const [post] = await db
        .select()
        .from(blogPosts)
        .where(eq(blogPosts.id, id));
      
      return post;
    } catch (error) {
      console.error(`[DB] Error fetching blog post with ID ${id}:`, error);
      return undefined;
    }
  }
  
  async getBlogPostBySlug(slug: string): Promise<BlogPost | undefined> {
    try {
      console.log(`[DB] Fetching blog post with slug ${slug} from PostgreSQL database`);
      const [post] = await db
        .select()
        .from(blogPosts)
        .where(eq(blogPosts.slug, slug));
      
      return post;
    } catch (error) {
      console.error(`[DB] Error fetching blog post with slug ${slug}:`, error);
      return undefined;
    }
  }
  
  async createBlogPost(post: InsertBlogPost): Promise<BlogPost> {
    try {
      console.log("[DB] Creating new blog post in PostgreSQL database");
      
      // Explicitly map the fields to avoid any schema mismatches
      const [newPost] = await db
        .insert(blogPosts)
        .values({
          title: post.title,
          slug: post.slug,
          content: post.content,
          excerpt: post.excerpt,
          categoryId: post.categoryId,
          authorId: post.authorId,
          tags: post.tags || null,
          metaTitle: post.metaTitle || null,
          metaDescription: post.metaDescription || null,
          coverImage: post.coverImage || null,
          status: post.status || 'draft',
          publishedAt: post.status === 'published' ? new Date() : null,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();
      
      return newPost;
    } catch (error) {
      console.error('[DB] Error creating blog post:', error);
      throw new Error('Failed to create blog post');
    }
  }
  
  async updateBlogPost(id: number, data: Partial<BlogPost>): Promise<BlogPost | undefined> {
    try {
      console.log(`[DB] Updating blog post with ID ${id} in PostgreSQL database`);
      const [updatedPost] = await db
        .update(blogPosts)
        .set({
          ...data,
          updatedAt: new Date()
        })
        .where(eq(blogPosts.id, id))
        .returning();
      
      return updatedPost;
    } catch (error) {
      console.error(`[DB] Error updating blog post with ID ${id}:`, error);
      return undefined;
    }
  }
  
  async publishBlogPost(id: number): Promise<BlogPost | undefined> {
    try {
      console.log(`[DB] Publishing blog post with ID ${id} in PostgreSQL database`);
      const [publishedPost] = await db
        .update(blogPosts)
        .set({
          status: 'published',
          publishedAt: new Date(),
          updatedAt: new Date()
        })
        .where(eq(blogPosts.id, id))
        .returning();
      
      return publishedPost;
    } catch (error) {
      console.error(`[DB] Error publishing blog post with ID ${id}:`, error);
      return undefined;
    }
  }
  
  async unpublishBlogPost(id: number): Promise<BlogPost | undefined> {
    try {
      console.log(`[DB] Unpublishing blog post with ID ${id} in PostgreSQL database`);
      const [unpublishedPost] = await db
        .update(blogPosts)
        .set({
          status: 'draft',
          updatedAt: new Date()
        })
        .where(eq(blogPosts.id, id))
        .returning();
      
      return unpublishedPost;
    } catch (error) {
      console.error(`[DB] Error unpublishing blog post with ID ${id}:`, error);
      return undefined;
    }
  }
  
  async deleteBlogPost(id: number): Promise<boolean> {
    try {
      console.log(`[DB] Deleting blog post with ID ${id} from PostgreSQL database`);
      await db
        .delete(blogPosts)
        .where(eq(blogPosts.id, id));
      
      return true;
    } catch (error) {
      console.error(`[DB] Error deleting blog post with ID ${id}:`, error);
      return false;
    }
  }
  
  // Content Management - FAQ
  async getFaqCategories(): Promise<FaqCategory[]> {
    try {
      console.log("[DB] Fetching FAQ categories from PostgreSQL database");
      const categories = await db
        .select()
        .from(faqCategories)
        .orderBy(faqCategories.position);
      
      return categories;
    } catch (error) {
      console.error('[DB] Error fetching FAQ categories:', error);
      return [];
    }
  }
  
  async getFaqCategory(id: number): Promise<FaqCategory | undefined> {
    try {
      console.log(`[DB] Fetching FAQ category with ID ${id} from PostgreSQL database`);
      const [category] = await db
        .select()
        .from(faqCategories)
        .where(eq(faqCategories.id, id));
      
      return category;
    } catch (error) {
      console.error(`[DB] Error fetching FAQ category with ID ${id}:`, error);
      return undefined;
    }
  }
  
  async createFaqCategory(category: InsertFaqCategory): Promise<FaqCategory> {
    try {
      console.log("[DB] Creating new FAQ category in PostgreSQL database");
      const [newCategory] = await db
        .insert(faqCategories)
        .values({
          ...category,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();
      
      return newCategory;
    } catch (error) {
      console.error('[DB] Error creating FAQ category:', error);
      throw new Error('Failed to create FAQ category');
    }
  }
  
  async updateFaqCategory(id: number, data: Partial<FaqCategory>): Promise<FaqCategory | undefined> {
    try {
      console.log(`[DB] Updating FAQ category with ID ${id} in PostgreSQL database`);
      const [updatedCategory] = await db
        .update(faqCategories)
        .set({
          ...data,
          updatedAt: new Date()
        })
        .where(eq(faqCategories.id, id))
        .returning();
      
      return updatedCategory;
    } catch (error) {
      console.error(`[DB] Error updating FAQ category with ID ${id}:`, error);
      return undefined;
    }
  }
  
  async deleteFaqCategory(id: number): Promise<boolean> {
    try {
      console.log(`[DB] Deleting FAQ category with ID ${id} from PostgreSQL database`);
      // First check if there are any FAQs in this category
      const faqItems = await db
        .select()
        .from(faqs)
        .where(eq(faqs.categoryId, id));
      
      if (faqItems.length > 0) {
        throw new Error('Cannot delete category that contains FAQs');
      }
      
      await db
        .delete(faqCategories)
        .where(eq(faqCategories.id, id));
      
      return true;
    } catch (error) {
      console.error(`[DB] Error deleting FAQ category with ID ${id}:`, error);
      return false;
    }
  }
  
  async getFaqs(categoryId?: number): Promise<Faq[]> {
    try {
      console.log("[DB] Fetching FAQs from PostgreSQL database");
      let query = db.select().from(faqs);
      
      if (categoryId) {
        query = query.where(eq(faqs.categoryId, categoryId));
      }
      
      const faqItems = await query.orderBy(faqs.position);
      return faqItems;
    } catch (error) {
      console.error('[DB] Error fetching FAQs:', error);
      return [];
    }
  }
  
  async getFaq(id: number): Promise<Faq | undefined> {
    try {
      console.log(`[DB] Fetching FAQ with ID ${id} from PostgreSQL database`);
      const [faq] = await db
        .select()
        .from(faqs)
        .where(eq(faqs.id, id));
      
      return faq;
    } catch (error) {
      console.error(`[DB] Error fetching FAQ with ID ${id}:`, error);
      return undefined;
    }
  }
  
  async createFaq(faq: InsertFaq): Promise<Faq> {
    try {
      console.log("[DB] Creating new FAQ in PostgreSQL database");
      const [newFaq] = await db
        .insert(faqs)
        .values({
          ...faq,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();
      
      return newFaq;
    } catch (error) {
      console.error('[DB] Error creating FAQ:', error);
      throw new Error('Failed to create FAQ');
    }
  }
  
  async updateFaq(id: number, data: Partial<Faq>): Promise<Faq | undefined> {
    try {
      console.log(`[DB] Updating FAQ with ID ${id} in PostgreSQL database`);
      const [updatedFaq] = await db
        .update(faqs)
        .set({
          ...data,
          updatedAt: new Date()
        })
        .where(eq(faqs.id, id))
        .returning();
      
      return updatedFaq;
    } catch (error) {
      console.error(`[DB] Error updating FAQ with ID ${id}:`, error);
      return undefined;
    }
  }
  
  async toggleFaqStatus(id: number, isActive: boolean): Promise<Faq | undefined> {
    try {
      console.log(`[DB] Toggling FAQ status with ID ${id} in PostgreSQL database`);
      const [updatedFaq] = await db
        .update(faqs)
        .set({
          isActive,
          updatedAt: new Date()
        })
        .where(eq(faqs.id, id))
        .returning();
      
      return updatedFaq;
    } catch (error) {
      console.error(`[DB] Error toggling FAQ status with ID ${id}:`, error);
      return undefined;
    }
  }
  
  async deleteFaq(id: number): Promise<boolean> {
    try {
      console.log(`[DB] Deleting FAQ with ID ${id} from PostgreSQL database`);
      await db
        .delete(faqs)
        .where(eq(faqs.id, id));
      
      return true;
    } catch (error) {
      console.error(`[DB] Error deleting FAQ with ID ${id}:`, error);
      return false;
    }
  }
  
  // Content Management - Contact Messages
  async getContactMessages(filters?: { status?: string }): Promise<ContactMessage[]> {
    try {
      console.log("[DB] Fetching contact messages from PostgreSQL database");
      let query = db.select().from(contactMessages);
      
      if (filters?.status) {
        query = query.where(eq(contactMessages.status, filters.status));
      }
      
      const messages = await query.orderBy(desc(contactMessages.createdAt));
      return messages;
    } catch (error) {
      console.error('[DB] Error fetching contact messages:', error);
      return [];
    }
  }
  
  async getContactMessage(id: number): Promise<ContactMessage | undefined> {
    try {
      console.log(`[DB] Fetching contact message with ID ${id} from PostgreSQL database`);
      const [message] = await db
        .select()
        .from(contactMessages)
        .where(eq(contactMessages.id, id));
      
      return message;
    } catch (error) {
      console.error(`[DB] Error fetching contact message with ID ${id}:`, error);
      return undefined;
    }
  }
  
  async createContactMessage(message: InsertContactMessage): Promise<ContactMessage> {
    try {
      console.log("[DB] Creating new contact message in PostgreSQL database");
      const [newMessage] = await db
        .insert(contactMessages)
        .values({
          ...message,
          status: 'unread',
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();
      
      return newMessage;
    } catch (error) {
      console.error('[DB] Error creating contact message:', error);
      throw new Error('Failed to create contact message');
    }
  }
  
  async updateContactMessageStatus(id: number, status: string): Promise<ContactMessage | undefined> {
    try {
      console.log(`[DB] Updating contact message status with ID ${id} in PostgreSQL database`);
      const [updatedMessage] = await db
        .update(contactMessages)
        .set({
          status,
          updatedAt: new Date()
        })
        .where(eq(contactMessages.id, id))
        .returning();
      
      return updatedMessage;
    } catch (error) {
      console.error(`[DB] Error updating contact message status with ID ${id}:`, error);
      return undefined;
    }
  }
  
  async replyToContactMessage(id: number, userId: number): Promise<ContactMessage | undefined> {
    try {
      console.log(`[DB] Replying to contact message with ID ${id} in PostgreSQL database`);
      const [repliedMessage] = await db
        .update(contactMessages)
        .set({
          status: 'replied',
          repliedBy: userId,
          repliedAt: new Date(),
          updatedAt: new Date()
        })
        .where(eq(contactMessages.id, id))
        .returning();
      
      return repliedMessage;
    } catch (error) {
      console.error(`[DB] Error replying to contact message with ID ${id}:`, error);
      return undefined;
    }
  }
  
  async deleteContactMessage(id: number): Promise<boolean> {
    try {
      console.log(`[DB] Deleting contact message with ID ${id} from PostgreSQL database`);
      await db
        .delete(contactMessages)
        .where(eq(contactMessages.id, id));
      
      return true;
    } catch (error) {
      console.error(`[DB] Error deleting contact message with ID ${id}:`, error);
      return false;
    }
  }
}

export const storage = new DatabaseStorage();