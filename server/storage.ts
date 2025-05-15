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
  contactMessages, ContactMessage, InsertContactMessage,
  // Analytics and system settings tables
  userAnalytics, UserAnalytics, 
  subscriptionAnalytics, SubscriptionAnalytics,
  financialAnalytics, FinancialAnalytics,
  performanceMetrics, PerformanceMetrics,
  systemConfigs, SystemConfig, InsertSystemConfig,
  emailTemplates, EmailTemplate, InsertEmailTemplate,
  ipRestrictions, IpRestriction, InsertIpRestriction,
  auditLogs, AuditLog, InsertAuditLog,
  // Security tables
  loginAttempts, LoginAttempt, InsertLoginAttempt,
  twoFactorAuth, TwoFactorAuth, InsertTwoFactorAuth,
  securityQuestions, SecurityQuestion, InsertSecurityQuestion,
  userSecurityQuestions, UserSecurityQuestion, InsertUserSecurityQuestion,
  securitySessions, SecuritySession, InsertSecuritySession
} from "@shared/schema";
import session from "express-session";
import { db } from "./db";
import { eq, and, or, gt, gte, lt, lte, desc, asc, isNull, isNotNull, sql, not } from "drizzle-orm";
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
  updateUserStripeInfo(id: number, customerId: string, subscriptionId: string): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;
  
  // Email verification operations
  setVerificationToken(userId: number, token: string, expiryHours?: number): Promise<User | undefined>;
  verifyEmail(token: string): Promise<User | undefined>;
  resendVerificationEmail(userId: number): Promise<{ user: User, token: string } | undefined>;
  
  // System Config operations
  getAllSystemConfigs(): Promise<SystemConfig[]>;
  getSystemConfigsByCategory(category: string): Promise<SystemConfig[]>;
  getSystemConfig(id: number): Promise<SystemConfig | undefined>;
  getSystemConfigByKey(key: string): Promise<SystemConfig | undefined>;
  createSystemConfig(config: InsertSystemConfig): Promise<SystemConfig>;
  updateSystemConfig(id: number, updates: Partial<SystemConfig>): Promise<SystemConfig | undefined>;
  deleteSystemConfig(id: number): Promise<boolean>;
  
  // Email Template operations
  getAllEmailTemplates(): Promise<EmailTemplate[]>;
  getEmailTemplate(id: number): Promise<EmailTemplate | undefined>;
  getEmailTemplateByType(type: string): Promise<EmailTemplate | undefined>;
  createEmailTemplate(template: InsertEmailTemplate): Promise<EmailTemplate>;
  updateEmailTemplate(id: number, updates: Partial<EmailTemplate>): Promise<EmailTemplate | undefined>;
  deleteEmailTemplate(id: number): Promise<boolean>;
  
  // IP Restriction operations
  getAllIpRestrictions(): Promise<IpRestriction[]>;
  getIpRestriction(id: number): Promise<IpRestriction | undefined>;
  getIpRestrictionByIp(ipAddress: string): Promise<IpRestriction | undefined>;
  createIpRestriction(restriction: InsertIpRestriction): Promise<IpRestriction>;
  updateIpRestriction(id: number, updates: Partial<IpRestriction>): Promise<IpRestriction | undefined>;
  deleteIpRestriction(id: number): Promise<boolean>;
  
  // Audit Log operations
  getAllAuditLogs(): Promise<AuditLog[]>;
  getUserAuditLogs(userId: number): Promise<AuditLog[]>;
  getAuditLog(id: number): Promise<AuditLog | undefined>;
  createAuditLog(log: InsertAuditLog): Promise<AuditLog>;
  
  // Analytics operations
  getUserAnalytics(startDate: Date, endDate: Date): Promise<UserAnalytics[]>;
  getSubscriptionAnalytics(startDate: Date, endDate: Date, planId?: number): Promise<SubscriptionAnalytics[]>;
  getFinancialAnalytics(startDate: Date, endDate: Date): Promise<FinancialAnalytics[]>;
  getPerformanceMetrics(startDate: Date, endDate: Date, serviceType?: string): Promise<PerformanceMetrics[]>;
  recordUserAnalytics(data: Partial<UserAnalytics>): Promise<UserAnalytics>;
  recordSubscriptionAnalytics(data: Partial<SubscriptionAnalytics>): Promise<SubscriptionAnalytics>;
  recordFinancialAnalytics(data: Partial<FinancialAnalytics>): Promise<FinancialAnalytics>;
  recordPerformanceMetrics(data: Partial<PerformanceMetrics>): Promise<PerformanceMetrics>;
  
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
  getUserSubscriptionsByPlan(planId: number): Promise<UserSubscription[]>;
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
  
  // Security Features
  // Login attempts and account lockout
  createLoginAttempt(attempt: InsertLoginAttempt): Promise<LoginAttempt>;
  getLoginAttempts(username: string, timeWindow: number): Promise<LoginAttempt[]>;
  getLoginAttemptsByUsername(username: string, limit?: number): Promise<LoginAttempt[]>;
  getSuccessfulLoginAttempts(username: string, limit?: number): Promise<LoginAttempt[]>;
  
  // Two-factor authentication
  createTwoFactorAuth(twoFactor: InsertTwoFactorAuth): Promise<TwoFactorAuth>;
  getTwoFactorAuthByUserId(userId: number): Promise<TwoFactorAuth | undefined>;
  updateTwoFactorAuth(userId: number, updates: Partial<TwoFactorAuth>): Promise<TwoFactorAuth | undefined>;
  deleteTwoFactorAuth(userId: number): Promise<boolean>;
  
  // Security questions
  getSecurityQuestions(activeOnly?: boolean): Promise<SecurityQuestion[]>;
  getSecurityQuestion(id: number): Promise<SecurityQuestion | undefined>;
  createSecurityQuestion(question: InsertSecurityQuestion): Promise<SecurityQuestion>;
  updateSecurityQuestion(id: number, updates: Partial<SecurityQuestion>): Promise<SecurityQuestion | undefined>;
  deleteSecurityQuestion(id: number): Promise<boolean>;
  
  // User security questions
  getUserSecurityQuestions(userId: number): Promise<UserSecurityQuestion[]>;
  getUserSecurityQuestion(id: number): Promise<UserSecurityQuestion | undefined>;
  createUserSecurityQuestion(userQuestion: InsertUserSecurityQuestion): Promise<UserSecurityQuestion>;
  updateUserSecurityQuestion(id: number, updates: Partial<UserSecurityQuestion>): Promise<UserSecurityQuestion | undefined>;
  deleteUserSecurityQuestion(id: number): Promise<boolean>;
  
  // Session management
  createSecuritySession(session: InsertSecuritySession): Promise<SecuritySession>;
  getSecuritySession(sessionToken: string): Promise<SecuritySession | undefined>;
  getUserActiveSessions(userId: number): Promise<SecuritySession[]>;
  updateSecuritySession(id: number, updates: Partial<SecuritySession>): Promise<SecuritySession | undefined>;
  invalidateSecuritySession(sessionToken: string): Promise<boolean>;
  invalidateAllUserSessions(userId: number, exceptSessionToken?: string): Promise<boolean>;

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
  
  // Security Features Implementation
  
  // Login attempts and account lockout
  async createLoginAttempt(attempt: InsertLoginAttempt): Promise<LoginAttempt> {
    console.log(`[DB] Creating login attempt for username: ${attempt.username} in PostgreSQL database`);
    const [newAttempt] = await db
      .insert(loginAttempts)
      .values({
        ...attempt,
        timestamp: new Date()
      })
      .returning();
    
    return newAttempt;
  }
  
  async getLoginAttempts(username: string, timeWindow: number): Promise<LoginAttempt[]> {
    console.log(`[DB] Fetching login attempts for username: ${username} in the last ${timeWindow} minutes from PostgreSQL database`);
    
    const windowDate = new Date();
    windowDate.setMinutes(windowDate.getMinutes() - timeWindow);
    
    const attempts = await db
      .select()
      .from(loginAttempts)
      .where(
        and(
          eq(loginAttempts.username, username),
          gte(loginAttempts.timestamp, windowDate)
        )
      )
      .orderBy(desc(loginAttempts.timestamp));
    
    return attempts;
  }
  
  async getSuccessfulLoginAttempts(username: string, limit?: number): Promise<LoginAttempt[]> {
    console.log(`[DB] Fetching successful login attempts for username: ${username} from PostgreSQL database`);
    
    const query = db
      .select()
      .from(loginAttempts)
      .where(
        and(
          eq(loginAttempts.username, username),
          eq(loginAttempts.success, true)
        )
      )
      .orderBy(desc(loginAttempts.timestamp));
      
    if (limit) {
      query.limit(limit);
    }
    
    return await query;
  }
  
  async isAccountLocked(username: string, maxAttempts: number, lockoutPeriod: number): Promise<boolean> {
    console.log(`[DB] Checking if account is locked for username: ${username} in PostgreSQL database`);
    
    // Get failed login attempts in the lockout period
    const windowDate = new Date();
    windowDate.setMilliseconds(windowDate.getMilliseconds() - lockoutPeriod);
    
    const failedAttempts = await db
      .select()
      .from(loginAttempts)
      .where(
        and(
          eq(loginAttempts.username, username),
          eq(loginAttempts.success, false),
          gte(loginAttempts.timestamp, windowDate)
        )
      );
    
    // If failed attempts in the window exceed maxAttempts, account is locked
    return failedAttempts.length >= maxAttempts;
  }
  
  async getLoginAttemptsByUsername(username: string, limit?: number): Promise<LoginAttempt[]> {
    console.log(`[DB] Fetching login attempts for username: ${username} from PostgreSQL database`);
    
    const query = db
      .select()
      .from(loginAttempts)
      .where(eq(loginAttempts.username, username))
      .orderBy(desc(loginAttempts.timestamp));
      
    if (limit) {
      query.limit(limit);
    }
    
    return await query;
  }
  
  // Two-factor authentication
  async createTwoFactorAuth(twoFactor: InsertTwoFactorAuth): Promise<TwoFactorAuth> {
    console.log(`[DB] Creating two-factor auth for user ID: ${twoFactor.userId} in PostgreSQL database`);
    
    // Check if there's an existing record for this user
    const existing = await this.getTwoFactorAuthByUserId(twoFactor.userId);
    
    if (existing) {
      // Update the existing record instead of creating a new one
      return await this.updateTwoFactorAuth(twoFactor.userId, twoFactor);
    }
    
    const [newTwoFactor] = await db
      .insert(twoFactorAuth)
      .values({
        ...twoFactor,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
    
    return newTwoFactor;
  }
  
  async getTwoFactorAuthByUserId(userId: number): Promise<TwoFactorAuth | undefined> {
    console.log(`[DB] Fetching two-factor auth for user ID: ${userId} from PostgreSQL database`);
    
    const [twoFactorRecord] = await db
      .select()
      .from(twoFactorAuth)
      .where(eq(twoFactorAuth.userId, userId));
    
    return twoFactorRecord;
  }
  
  async updateTwoFactorAuth(userId: number, data: Partial<TwoFactorAuth>): Promise<TwoFactorAuth> {
    console.log(`[DB] Updating two-factor auth for user ID: ${userId} in PostgreSQL database`);
    
    const [updated] = await db
      .update(twoFactorAuth)
      .set({
        ...data,
        updatedAt: new Date()
      })
      .where(eq(twoFactorAuth.userId, userId))
      .returning();
    
    if (!updated) {
      throw new Error(`No two-factor auth record found for user ${userId}`);
    }
    
    return updated;
  }
  
  async deleteTwoFactorAuth(userId: number): Promise<boolean> {
    console.log(`[DB] Deleting two-factor auth for user ID: ${userId} from PostgreSQL database`);
    
    try {
      await db
        .delete(twoFactorAuth)
        .where(eq(twoFactorAuth.userId, userId));
      
      return true;
    } catch (error) {
      console.error(`[DB] Error deleting two-factor auth: ${error}`);
      return false;
    }
  }
  
  // Security questions
  async getSecurityQuestions(activeOnly: boolean = true): Promise<SecurityQuestion[]> {
    console.log(`[DB] Fetching all security questions from PostgreSQL database${activeOnly ? ' (active only)' : ''}`);
    
    if (activeOnly) {
      return await db
        .select()
        .from(securityQuestions)
        .where(eq(securityQuestions.isActive, true))
        .orderBy(asc(securityQuestions.question));
    } else {
      return await db
        .select()
        .from(securityQuestions)
        .orderBy(asc(securityQuestions.question));
    }
  }
  
  async getSecurityQuestion(id: number): Promise<SecurityQuestion | undefined> {
    console.log(`[DB] Fetching security question with ID: ${id} from PostgreSQL database`);
    
    const [question] = await db
      .select()
      .from(securityQuestions)
      .where(eq(securityQuestions.id, id));
    
    return question;
  }
  
  async createSecurityQuestion(question: InsertSecurityQuestion): Promise<SecurityQuestion> {
    console.log(`[DB] Creating security question: ${question.question} in PostgreSQL database`);
    
    const [newQuestion] = await db
      .insert(securityQuestions)
      .values({
        ...question,
        createdAt: new Date()
      })
      .returning();
    
    return newQuestion;
  }
  
  async updateSecurityQuestion(id: number, updates: Partial<SecurityQuestion>): Promise<SecurityQuestion | undefined> {
    console.log(`[DB] Updating security question with ID: ${id} in PostgreSQL database`);
    
    const [updatedQuestion] = await db
      .update(securityQuestions)
      .set({
        ...updates
      })
      .where(eq(securityQuestions.id, id))
      .returning();
    
    return updatedQuestion;
  }
  
  async deleteSecurityQuestion(id: number): Promise<boolean> {
    console.log(`[DB] Deleting security question with ID: ${id} from PostgreSQL database`);
    
    try {
      await db
        .delete(securityQuestions)
        .where(eq(securityQuestions.id, id));
      
      return true;
    } catch (error) {
      console.error(`[DB] Error deleting security question: ${error}`);
      return false;
    }
  }
  
  // User security questions
  async getUserSecurityQuestions(userId: number): Promise<UserSecurityQuestion[]> {
    console.log(`[DB] Fetching user security questions for user ID: ${userId} from PostgreSQL database`);
    
    const questions = await db
      .select()
      .from(userSecurityQuestions)
      .where(eq(userSecurityQuestions.userId, userId));
    
    return questions;
  }
  
  async getUserSecurityQuestion(id: number): Promise<UserSecurityQuestion | undefined> {
    console.log(`[DB] Fetching user security question with ID: ${id} from PostgreSQL database`);
    
    const [question] = await db
      .select()
      .from(userSecurityQuestions)
      .where(eq(userSecurityQuestions.id, id));
    
    return question;
  }
  
  async createUserSecurityQuestion(userQuestion: InsertUserSecurityQuestion): Promise<UserSecurityQuestion> {
    console.log(`[DB] Creating user security question for user ID: ${userQuestion.userId} in PostgreSQL database`);
    
    const [newUserQuestion] = await db
      .insert(userSecurityQuestions)
      .values({
        ...userQuestion,
        createdAt: new Date()
      })
      .returning();
    
    return newUserQuestion;
  }
  
  async updateUserSecurityQuestion(id: number, updates: Partial<UserSecurityQuestion>): Promise<UserSecurityQuestion | undefined> {
    console.log(`[DB] Updating user security question with ID: ${id} in PostgreSQL database`);
    
    const [updatedUserQuestion] = await db
      .update(userSecurityQuestions)
      .set({
        ...updates,
        updatedAt: new Date()
      })
      .where(eq(userSecurityQuestions.id, id))
      .returning();
    
    return updatedUserQuestion;
  }
  
  async deleteUserSecurityQuestion(id: number): Promise<boolean> {
    console.log(`[DB] Deleting user security question with ID: ${id} from PostgreSQL database`);
    
    try {
      await db
        .delete(userSecurityQuestions)
        .where(eq(userSecurityQuestions.id, id));
      
      return true;
    } catch (error) {
      console.error(`[DB] Error deleting user security question: ${error}`);
      return false;
    }
  }
  
  // Session management
  async createSecuritySession(session: InsertSecuritySession): Promise<SecuritySession> {
    console.log(`[DB] Creating security session for user ID: ${session.userId} in PostgreSQL database`);
    
    const [newSession] = await db
      .insert(securitySessions)
      .values({
        ...session,
        createdAt: new Date(),
        lastActivityAt: new Date()
      })
      .returning();
    
    return newSession;
  }
  
  async getSecuritySession(sessionToken: string): Promise<SecuritySession | undefined> {
    console.log(`[DB] Fetching security session with token from PostgreSQL database`);
    
    const [session] = await db
      .select()
      .from(securitySessions)
      .where(eq(securitySessions.sessionToken, sessionToken));
    
    return session;
  }
  
  async getUserActiveSessions(userId: number): Promise<SecuritySession[]> {
    console.log(`[DB] Fetching active sessions for user ID: ${userId} from PostgreSQL database`);
    
    const sessions = await db
      .select()
      .from(securitySessions)
      .where(
        and(
          eq(securitySessions.userId, userId),
          eq(securitySessions.isActive, true)
        )
      )
      .orderBy(desc(securitySessions.lastActivityAt));
    
    return sessions;
  }
  
  async updateSecuritySession(id: number, updates: Partial<SecuritySession>): Promise<SecuritySession | undefined> {
    console.log(`[DB] Updating security session with ID: ${id} in PostgreSQL database`);
    
    const [updatedSession] = await db
      .update(securitySessions)
      .set({
        ...updates,
        lastActivityAt: updates.lastActivityAt || new Date()
      })
      .where(eq(securitySessions.id, id))
      .returning();
    
    return updatedSession;
  }
  
  async invalidateSecuritySession(sessionToken: string): Promise<boolean> {
    console.log(`[DB] Invalidating security session with token in PostgreSQL database`);
    
    try {
      await db
        .update(securitySessions)
        .set({ 
          isActive: false,
          invalidatedAt: new Date()
        })
        .where(eq(securitySessions.sessionToken, sessionToken));
      
      return true;
    } catch (error) {
      console.error(`[DB] Error invalidating security session: ${error}`);
      return false;
    }
  }
  
  async invalidateAllUserSessions(userId: number, exceptSessionToken?: string): Promise<boolean> {
    console.log(`[DB] Invalidating all sessions for user ID: ${userId} from PostgreSQL database`);
    
    try {
      let query = db
        .update(securitySessions)
        .set({ 
          isActive: false,
          invalidatedAt: new Date()
        })
        .where(
          and(
            eq(securitySessions.userId, userId),
            eq(securitySessions.isActive, true)
          )
        );
      
      // If exceptSessionToken is provided, don't invalidate that session
      if (exceptSessionToken) {
        query = query.where(
          not(eq(securitySessions.sessionToken, exceptSessionToken))
        );
      }
      
      await query;
      return true;
    } catch (error) {
      console.error(`[DB] Error invalidating all user sessions: ${error}`);
      return false;
    }
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

  async updateUserStripeInfo(id: number, customerId: string, subscriptionId: string): Promise<User | undefined> {
    return this.updateUser(id, {
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscriptionId
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
      // We don't check for active subscriptions here since it's already checked
      // in the route handler with getUserSubscriptionsByPlan
      
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
  
  async getUserSubscriptionsByPlan(planId: number): Promise<UserSubscription[]> {
    return db.select().from(userSubscriptions).where(eq(userSubscriptions.planId, planId));
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
  
  // System Config operations
  async getAllSystemConfigs(): Promise<SystemConfig[]> {
    try {
      console.log("[DB] Fetching all system configs from PostgreSQL database");
      const configs = await db.select().from(systemConfigs).orderBy(asc(systemConfigs.category), asc(systemConfigs.key));
      return configs;
    } catch (error) {
      console.error('[DB] Error fetching system configs:', error);
      return [];
    }
  }

  async getSystemConfigsByCategory(category: string): Promise<SystemConfig[]> {
    try {
      console.log(`[DB] Fetching system configs with category: ${category} from PostgreSQL database`);
      const configs = await db
        .select()
        .from(systemConfigs)
        .where(eq(systemConfigs.category, category))
        .orderBy(asc(systemConfigs.key));
      return configs;
    } catch (error) {
      console.error(`[DB] Error fetching system configs for category ${category}:`, error);
      return [];
    }
  }

  async getSystemConfig(id: number): Promise<SystemConfig | undefined> {
    try {
      console.log(`[DB] Fetching system config with ID: ${id} from PostgreSQL database`);
      const [config] = await db.select().from(systemConfigs).where(eq(systemConfigs.id, id));
      return config;
    } catch (error) {
      console.error(`[DB] Error fetching system config with ID ${id}:`, error);
      return undefined;
    }
  }

  async getSystemConfigByKey(key: string): Promise<SystemConfig | undefined> {
    try {
      console.log(`[DB] Fetching system config with key: ${key} from PostgreSQL database`);
      const [config] = await db.select().from(systemConfigs).where(eq(systemConfigs.key, key));
      return config;
    } catch (error) {
      console.error(`[DB] Error fetching system config with key ${key}:`, error);
      return undefined;
    }
  }

  async createSystemConfig(config: InsertSystemConfig): Promise<SystemConfig> {
    try {
      console.log("[DB] Creating new system config in PostgreSQL database");
      const [newConfig] = await db.insert(systemConfigs).values({
        ...config,
        createdAt: new Date(),
        updatedAt: new Date()
      }).returning();
      
      // Create audit log
      if (config.lastUpdatedBy) {
        await this.createAuditLog({
          userId: config.lastUpdatedBy,
          action: "create_system_config",
          entityType: "system_config",
          entityId: newConfig.id.toString(),
          details: JSON.stringify({ key: newConfig.key, category: newConfig.category }),
        });
      }
      
      return newConfig;
    } catch (error) {
      console.error('[DB] Error creating system config:', error);
      throw new Error('Failed to create system config');
    }
  }

  async updateSystemConfig(id: number, updates: Partial<SystemConfig>): Promise<SystemConfig | undefined> {
    try {
      console.log(`[DB] Updating system config with ID: ${id} in PostgreSQL database`);
      
      const [updatedConfig] = await db
        .update(systemConfigs)
        .set({
          ...updates,
          updatedAt: new Date()
        })
        .where(eq(systemConfigs.id, id))
        .returning();
        
      // Create audit log
      if (updates.lastUpdatedBy) {
        await this.createAuditLog({
          userId: updates.lastUpdatedBy,
          action: "update_system_config",
          entityType: "system_config",
          entityId: id.toString(),
          details: JSON.stringify(updates),
        });
      }
      
      return updatedConfig;
    } catch (error) {
      console.error(`[DB] Error updating system config with ID ${id}:`, error);
      return undefined;
    }
  }

  async deleteSystemConfig(id: number): Promise<boolean> {
    try {
      console.log(`[DB] Deleting system config with ID: ${id} from PostgreSQL database`);
      await db
        .delete(systemConfigs)
        .where(eq(systemConfigs.id, id));
      
      return true;
    } catch (error) {
      console.error(`[DB] Error deleting system config with ID ${id}:`, error);
      return false;
    }
  }
  
  // Audit Log operations
  async getAllAuditLogs(): Promise<AuditLog[]> {
    try {
      console.log("[DB] Fetching all audit logs from PostgreSQL database");
      const logs = await db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt));
      return logs;
    } catch (error) {
      console.error('[DB] Error fetching audit logs:', error);
      return [];
    }
  }

  async getUserAuditLogs(userId: number): Promise<AuditLog[]> {
    try {
      console.log(`[DB] Fetching audit logs for user ID: ${userId} from PostgreSQL database`);
      const logs = await db
        .select()
        .from(auditLogs)
        .where(eq(auditLogs.userId, userId))
        .orderBy(desc(auditLogs.createdAt));
      return logs;
    } catch (error) {
      console.error(`[DB] Error fetching audit logs for user ID ${userId}:`, error);
      return [];
    }
  }

  async getAuditLog(id: number): Promise<AuditLog | undefined> {
    try {
      console.log(`[DB] Fetching audit log with ID: ${id} from PostgreSQL database`);
      const [log] = await db.select().from(auditLogs).where(eq(auditLogs.id, id));
      return log;
    } catch (error) {
      console.error(`[DB] Error fetching audit log with ID ${id}:`, error);
      return undefined;
    }
  }

  async createAuditLog(log: InsertAuditLog): Promise<AuditLog> {
    try {
      console.log("[DB] Creating new audit log in PostgreSQL database");
      const [newLog] = await db.insert(auditLogs).values({
        ...log,
        createdAt: new Date()
      }).returning();
      
      return newLog;
    } catch (error) {
      console.error('[DB] Error creating audit log:', error);
      throw new Error('Failed to create audit log');
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
  
  // Email Template operations
  async getAllEmailTemplates(): Promise<EmailTemplate[]> {
    try {
      console.log("[DB] Fetching all email templates from PostgreSQL database");
      const templates = await db.select().from(emailTemplates).orderBy(asc(emailTemplates.name));
      return templates;
    } catch (error) {
      console.error('[DB] Error fetching email templates:', error);
      return [];
    }
  }

  async getEmailTemplate(id: number): Promise<EmailTemplate | undefined> {
    try {
      console.log(`[DB] Fetching email template with ID: ${id} from PostgreSQL database`);
      const [template] = await db.select().from(emailTemplates).where(eq(emailTemplates.id, id));
      return template;
    } catch (error) {
      console.error(`[DB] Error fetching email template with ID ${id}:`, error);
      return undefined;
    }
  }

  async getEmailTemplateByType(type: string): Promise<EmailTemplate | undefined> {
    try {
      console.log(`[DB] Fetching email template with type: ${type} from PostgreSQL database`);
      const [template] = await db
        .select()
        .from(emailTemplates)
        .where(and(eq(emailTemplates.type, type), eq(emailTemplates.isActive, true)));
      return template;
    } catch (error) {
      console.error(`[DB] Error fetching email template with type ${type}:`, error);
      return undefined;
    }
  }

  async createEmailTemplate(template: InsertEmailTemplate): Promise<EmailTemplate> {
    try {
      console.log("[DB] Creating new email template in PostgreSQL database");
      const [newTemplate] = await db.insert(emailTemplates).values({
        ...template,
        createdAt: new Date(),
        updatedAt: new Date()
      }).returning();
      
      // Create audit log
      if (template.lastUpdatedBy) {
        await this.createAuditLog({
          userId: template.lastUpdatedBy,
          action: "create_email_template",
          entityType: "email_template",
          entityId: newTemplate.id.toString(),
          details: JSON.stringify({ name: newTemplate.name, type: newTemplate.type }),
        });
      }
      
      return newTemplate;
    } catch (error) {
      console.error('[DB] Error creating email template:', error);
      throw new Error('Failed to create email template');
    }
  }

  async updateEmailTemplate(id: number, updates: Partial<EmailTemplate>): Promise<EmailTemplate | undefined> {
    try {
      console.log(`[DB] Updating email template with ID: ${id} in PostgreSQL database`);
      
      const [updatedTemplate] = await db
        .update(emailTemplates)
        .set({
          ...updates,
          updatedAt: new Date()
        })
        .where(eq(emailTemplates.id, id))
        .returning();
        
      // Create audit log
      if (updates.lastUpdatedBy) {
        await this.createAuditLog({
          userId: updates.lastUpdatedBy,
          action: "update_email_template",
          entityType: "email_template",
          entityId: id.toString(),
          details: JSON.stringify(updates),
        });
      }
      
      return updatedTemplate;
    } catch (error) {
      console.error(`[DB] Error updating email template with ID ${id}:`, error);
      return undefined;
    }
  }

  async deleteEmailTemplate(id: number): Promise<boolean> {
    try {
      console.log(`[DB] Deleting email template with ID: ${id} from PostgreSQL database`);
      await db
        .delete(emailTemplates)
        .where(eq(emailTemplates.id, id));
      
      return true;
    } catch (error) {
      console.error(`[DB] Error deleting email template with ID ${id}:`, error);
      return false;
    }
  }
  
  // IP Restriction operations
  async getAllIpRestrictions(): Promise<IpRestriction[]> {
    try {
      console.log("[DB] Fetching all IP restrictions from PostgreSQL database");
      const restrictions = await db.select().from(ipRestrictions).orderBy(asc(ipRestrictions.ipAddress));
      return restrictions;
    } catch (error) {
      console.error('[DB] Error fetching IP restrictions:', error);
      return [];
    }
  }

  async getIpRestriction(id: number): Promise<IpRestriction | undefined> {
    try {
      console.log(`[DB] Fetching IP restriction with ID: ${id} from PostgreSQL database`);
      const [restriction] = await db.select().from(ipRestrictions).where(eq(ipRestrictions.id, id));
      return restriction;
    } catch (error) {
      console.error(`[DB] Error fetching IP restriction with ID ${id}:`, error);
      return undefined;
    }
  }

  async getIpRestrictionByIp(ipAddress: string): Promise<IpRestriction | undefined> {
    try {
      console.log(`[DB] Fetching IP restriction with address: ${ipAddress} from PostgreSQL database`);
      const [restriction] = await db.select().from(ipRestrictions).where(eq(ipRestrictions.ipAddress, ipAddress));
      return restriction;
    } catch (error) {
      console.error(`[DB] Error fetching IP restriction with address ${ipAddress}:`, error);
      return undefined;
    }
  }

  async createIpRestriction(restriction: InsertIpRestriction): Promise<IpRestriction> {
    try {
      console.log("[DB] Creating new IP restriction in PostgreSQL database");
      const [newRestriction] = await db.insert(ipRestrictions).values({
        ...restriction,
        createdAt: new Date(),
        updatedAt: new Date()
      }).returning();
      
      // Create audit log
      if (restriction.createdBy) {
        await this.createAuditLog({
          userId: restriction.createdBy,
          action: "create_ip_restriction",
          entityType: "ip_restriction",
          entityId: newRestriction.id.toString(),
          details: JSON.stringify({ ipAddress: newRestriction.ipAddress, type: newRestriction.type }),
        });
      }
      
      return newRestriction;
    } catch (error) {
      console.error('[DB] Error creating IP restriction:', error);
      throw new Error('Failed to create IP restriction');
    }
  }

  async updateIpRestriction(id: number, updates: Partial<IpRestriction>): Promise<IpRestriction | undefined> {
    try {
      console.log(`[DB] Updating IP restriction with ID: ${id} in PostgreSQL database`);
      
      const [updatedRestriction] = await db
        .update(ipRestrictions)
        .set({
          ...updates,
          updatedAt: new Date()
        })
        .where(eq(ipRestrictions.id, id))
        .returning();
        
      // Create audit log
      if (updates.createdBy) {
        await this.createAuditLog({
          userId: updates.createdBy,
          action: "update_ip_restriction",
          entityType: "ip_restriction",
          entityId: id.toString(),
          details: JSON.stringify(updates),
        });
      }
      
      return updatedRestriction;
    } catch (error) {
      console.error(`[DB] Error updating IP restriction with ID ${id}:`, error);
      return undefined;
    }
  }

  async deleteIpRestriction(id: number): Promise<boolean> {
    try {
      console.log(`[DB] Deleting IP restriction with ID: ${id} from PostgreSQL database`);
      await db
        .delete(ipRestrictions)
        .where(eq(ipRestrictions.id, id));
      
      return true;
    } catch (error) {
      console.error(`[DB] Error deleting IP restriction with ID ${id}:`, error);
      return false;
    }
  }
  
  // Analytics operations
  async getUserAnalytics(startDate: Date, endDate: Date): Promise<UserAnalytics[]> {
    try {
      console.log(`[DB] Fetching user analytics from ${startDate} to ${endDate} from PostgreSQL database`);
      const analytics = await db
        .select()
        .from(userAnalytics)
        .where(
          and(
            gte(userAnalytics.date, startDate),
            lte(userAnalytics.date, endDate)
          )
        )
        .orderBy(asc(userAnalytics.date));
      return analytics;
    } catch (error) {
      console.error(`[DB] Error fetching user analytics:`, error);
      return [];
    }
  }

  async getSubscriptionAnalytics(startDate: Date, endDate: Date, planId?: number): Promise<SubscriptionAnalytics[]> {
    try {
      console.log(`[DB] Fetching subscription analytics from ${startDate} to ${endDate} from PostgreSQL database`);
      
      let query = db
        .select()
        .from(subscriptionAnalytics)
        .where(
          and(
            gte(subscriptionAnalytics.date, startDate),
            lte(subscriptionAnalytics.date, endDate)
          )
        );
        
      if (planId) {
        query = query.where(eq(subscriptionAnalytics.planId, planId));
      }
      
      const analytics = await query.orderBy(asc(subscriptionAnalytics.date));
      return analytics;
    } catch (error) {
      console.error(`[DB] Error fetching subscription analytics:`, error);
      return [];
    }
  }

  async getFinancialAnalytics(startDate: Date, endDate: Date): Promise<FinancialAnalytics[]> {
    try {
      console.log(`[DB] Fetching financial analytics from ${startDate} to ${endDate} from PostgreSQL database`);
      const analytics = await db
        .select()
        .from(financialAnalytics)
        .where(
          and(
            gte(financialAnalytics.date, startDate),
            lte(financialAnalytics.date, endDate)
          )
        )
        .orderBy(asc(financialAnalytics.date));
      return analytics;
    } catch (error) {
      console.error(`[DB] Error fetching financial analytics:`, error);
      return [];
    }
  }

  async getPerformanceMetrics(startDate: Date, endDate: Date, serviceType?: string): Promise<PerformanceMetrics[]> {
    try {
      console.log(`[DB] Fetching performance metrics from ${startDate} to ${endDate} from PostgreSQL database`);
      
      let query = db
        .select()
        .from(performanceMetrics)
        .where(
          and(
            gte(performanceMetrics.date, startDate),
            lte(performanceMetrics.date, endDate)
          )
        );
        
      if (serviceType) {
        query = query.where(eq(performanceMetrics.serviceType, serviceType));
      }
      
      const metrics = await query.orderBy(asc(performanceMetrics.date));
      return metrics;
    } catch (error) {
      console.error(`[DB] Error fetching performance metrics:`, error);
      return [];
    }
  }

  async recordUserAnalytics(data: Partial<UserAnalytics>): Promise<UserAnalytics> {
    try {
      console.log("[DB] Recording new user analytics entry in PostgreSQL database");
      
      // Check if we already have an entry for this date
      const date = data.date || new Date();
      const existingEntries = await db
        .select()
        .from(userAnalytics)
        .where(eq(userAnalytics.date, date));
      
      if (existingEntries.length > 0) {
        // Update existing entry
        const [updatedAnalytics] = await db
          .update(userAnalytics)
          .set({
            ...data,
            updatedAt: new Date()
          })
          .where(eq(userAnalytics.id, existingEntries[0].id))
          .returning();
        return updatedAnalytics;
      } else {
        // Create new entry
        const [newAnalytics] = await db
          .insert(userAnalytics)
          .values({
            date: date,
            activeUsers: 0,
            newUsers: 0,
            totalUsers: 0,
            ...data,
            createdAt: new Date(),
            updatedAt: new Date()
          })
          .returning();
        return newAnalytics;
      }
    } catch (error) {
      console.error('[DB] Error recording user analytics:', error);
      throw new Error('Failed to record user analytics');
    }
  }

  async recordSubscriptionAnalytics(data: Partial<SubscriptionAnalytics>): Promise<SubscriptionAnalytics> {
    try {
      console.log("[DB] Recording new subscription analytics entry in PostgreSQL database");
      
      // Check if we already have an entry for this date and plan
      const date = data.date || new Date();
      const planId = data.planId;
      
      if (!planId) {
        throw new Error('Plan ID is required for subscription analytics');
      }
      
      const existingEntries = await db
        .select()
        .from(subscriptionAnalytics)
        .where(
          and(
            eq(subscriptionAnalytics.date, date),
            eq(subscriptionAnalytics.planId, planId)
          )
        );
      
      if (existingEntries.length > 0) {
        // Update existing entry
        const [updatedAnalytics] = await db
          .update(subscriptionAnalytics)
          .set({
            ...data,
            updatedAt: new Date()
          })
          .where(eq(subscriptionAnalytics.id, existingEntries[0].id))
          .returning();
        return updatedAnalytics;
      } else {
        // Create new entry
        const [newAnalytics] = await db
          .insert(subscriptionAnalytics)
          .values({
            date: date,
            planId: planId,
            activeSubscriptions: 0,
            newSubscriptions: 0,
            canceledSubscriptions: 0,
            ...data,
            createdAt: new Date(),
            updatedAt: new Date()
          })
          .returning();
        return newAnalytics;
      }
    } catch (error) {
      console.error('[DB] Error recording subscription analytics:', error);
      throw new Error('Failed to record subscription analytics');
    }
  }

  async recordFinancialAnalytics(data: Partial<FinancialAnalytics>): Promise<FinancialAnalytics> {
    try {
      console.log("[DB] Recording new financial analytics entry in PostgreSQL database");
      
      // Check if we already have an entry for this date
      const date = data.date || new Date();
      const existingEntries = await db
        .select()
        .from(financialAnalytics)
        .where(eq(financialAnalytics.date, date));
      
      if (existingEntries.length > 0) {
        // Update existing entry
        const [updatedAnalytics] = await db
          .update(financialAnalytics)
          .set({
            ...data,
            updatedAt: new Date()
          })
          .where(eq(financialAnalytics.id, existingEntries[0].id))
          .returning();
        return updatedAnalytics;
      } else {
        // Create new entry
        const [newAnalytics] = await db
          .insert(financialAnalytics)
          .values({
            date: date,
            revenue: 0,
            expenses: 0,
            profit: 0,
            ...data,
            createdAt: new Date(),
            updatedAt: new Date()
          })
          .returning();
        return newAnalytics;
      }
    } catch (error) {
      console.error('[DB] Error recording financial analytics:', error);
      throw new Error('Failed to record financial analytics');
    }
  }

  async recordPerformanceMetrics(data: Partial<PerformanceMetrics>): Promise<PerformanceMetrics> {
    try {
      console.log("[DB] Recording new performance metrics entry in PostgreSQL database");
      
      // Check if we already have an entry for this date and service type
      const date = data.date || new Date();
      const serviceType = data.serviceType;
      
      if (!serviceType) {
        throw new Error('Service type is required for performance metrics');
      }
      
      const existingEntries = await db
        .select()
        .from(performanceMetrics)
        .where(
          and(
            eq(performanceMetrics.date, date),
            eq(performanceMetrics.serviceType, serviceType)
          )
        );
      
      if (existingEntries.length > 0) {
        // Update existing entry
        const [updatedMetrics] = await db
          .update(performanceMetrics)
          .set({
            ...data,
            updatedAt: new Date()
          })
          .where(eq(performanceMetrics.id, existingEntries[0].id))
          .returning();
        return updatedMetrics;
      } else {
        // Create new entry
        const [newMetrics] = await db
          .insert(performanceMetrics)
          .values({
            date: date,
            serviceType: serviceType,
            totalRequests: 0,
            successfulRequests: 0,
            failedRequests: 0,
            ...data,
            createdAt: new Date(),
            updatedAt: new Date()
          })
          .returning();
        return newMetrics;
      }
    } catch (error) {
      console.error('[DB] Error recording performance metrics:', error);
      throw new Error('Failed to record performance metrics');
    }
  }
}

export const storage = new DatabaseStorage();