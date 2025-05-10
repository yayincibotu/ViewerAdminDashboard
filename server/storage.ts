import { users, User, InsertUser, SubscriptionPlan, subscriptionPlans, platforms, Platform, InsertPlatform, services, Service, InsertService, payments, Payment, InsertPayment, userSubscriptions, UserSubscription, InsertUserSubscription } from "@shared/schema";
import session from "express-session";
import { db } from "./db";
import { eq } from "drizzle-orm";
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

  // Session store
  sessionStore: session.SessionStore;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.SessionStore;

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
}

export const storage = new DatabaseStorage();