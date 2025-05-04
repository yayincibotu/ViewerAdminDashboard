import { users, User, InsertUser, SubscriptionPlan, subscriptionPlans, platforms, Platform, InsertPlatform, services, Service, InsertService, payments, Payment, InsertPayment, userSubscriptions, UserSubscription, InsertUserSubscription } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

// modify the interface with any CRUD methods
// you might need
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, data: Partial<User>): Promise<User | undefined>;
  updateStripeCustomerId(id: number, customerId: string): Promise<User | undefined>;
  updateUserStripeInfo(id: number, data: { customerId: string, subscriptionId: string }): Promise<User | undefined>;
  
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
  createUserSubscription(subscription: InsertUserSubscription): Promise<UserSubscription>;
  updateUserSubscription(id: number, data: Partial<UserSubscription>): Promise<UserSubscription | undefined>;

  // Session store
  sessionStore: session.SessionStore;
}

export class MemStorage implements IStorage {
  private userDb: Map<number, User>;
  private planDb: Map<number, SubscriptionPlan>;
  private platformDb: Map<number, Platform>;
  private serviceDb: Map<number, Service>;
  private paymentDb: Map<number, Payment>;
  private userSubscriptionDb: Map<number, UserSubscription>;
  sessionStore: session.SessionStore;
  
  private userIdCounter: number;
  private planIdCounter: number;
  private platformIdCounter: number;
  private serviceIdCounter: number;
  private paymentIdCounter: number;
  private subscriptionIdCounter: number;

  constructor() {
    this.userDb = new Map();
    this.planDb = new Map();
    this.platformDb = new Map();
    this.serviceDb = new Map();
    this.paymentDb = new Map();
    this.userSubscriptionDb = new Map();
    
    this.userIdCounter = 1;
    this.planIdCounter = 1;
    this.platformIdCounter = 1;
    this.serviceIdCounter = 1;
    this.paymentIdCounter = 1;
    this.subscriptionIdCounter = 1;
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });
    
    // Initialize with sample data
    this.initializeSampleData();
  }

  private initializeSampleData() {
    // Add sample platforms
    const platforms: InsertPlatform[] = [
      { name: "Twitch", slug: "twitch", description: "Buy Real and Organic Twitch viewers. With 100% customizable and easy control panel.", iconClass: "fab fa-twitch", bgColor: "bg-purple-500" },
      { name: "Kick", slug: "kick", description: "You can buy Kick viewers or Kick followers via Viewerapps.", iconClass: "fas fa-play", bgColor: "bg-green-500" },
      { name: "Instagram", slug: "instagram", description: "Buy instant delivery instagram products and services.", iconClass: "fab fa-instagram", bgColor: "bg-pink-500" },
      { name: "YouTube", slug: "youtube", description: "Geotargeting with Youtube services with instant delivery.", iconClass: "fab fa-youtube", bgColor: "bg-red-500" },
    ];
    
    platforms.forEach(platform => {
      this.createPlatform(platform);
    });
    
    // Add sample subscription plans
    const plans: SubscriptionPlan[] = [
      { 
        id: this.planIdCounter++, 
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
        id: this.planIdCounter++, 
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
        id: this.planIdCounter++, 
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
        id: this.planIdCounter++, 
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
      },
    ];
    
    plans.forEach(plan => {
      this.planDb.set(plan.id, plan);
    });
    
    // Add sample admin user
    this.createUser({
      username: "admin",
      password: "adminpassword",
      email: "admin@viewerapps.com",
      role: "admin"
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.userDb.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.userDb.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(user: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const newUser: User = { ...user, id, createdAt: new Date() };
    this.userDb.set(id, newUser);
    return newUser;
  }

  async updateUser(id: number, data: Partial<User>): Promise<User | undefined> {
    const user = this.userDb.get(id);
    if (!user) return undefined;

    const updatedUser = { ...user, ...data };
    this.userDb.set(id, updatedUser);
    return updatedUser;
  }

  async updateStripeCustomerId(id: number, customerId: string): Promise<User | undefined> {
    const user = this.userDb.get(id);
    if (!user) return undefined;

    const updatedUser = { ...user, stripeCustomerId: customerId };
    this.userDb.set(id, updatedUser);
    return updatedUser;
  }

  async updateUserStripeInfo(id: number, data: { customerId: string, subscriptionId: string }): Promise<User | undefined> {
    const user = this.userDb.get(id);
    if (!user) return undefined;

    const updatedUser = { 
      ...user, 
      stripeCustomerId: data.customerId,
      stripeSubscriptionId: data.subscriptionId 
    };
    this.userDb.set(id, updatedUser);
    return updatedUser;
  }

  async getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    return Array.from(this.planDb.values());
  }

  async getSubscriptionPlan(id: number): Promise<SubscriptionPlan | undefined> {
    return this.planDb.get(id);
  }

  async createSubscriptionPlan(plan: SubscriptionPlan): Promise<SubscriptionPlan> {
    const id = this.planIdCounter++;
    const newPlan = { ...plan, id };
    this.planDb.set(id, newPlan);
    return newPlan;
  }

  async getPlatforms(): Promise<Platform[]> {
    return Array.from(this.platformDb.values());
  }

  async getPlatform(id: number): Promise<Platform | undefined> {
    return this.platformDb.get(id);
  }

  async createPlatform(platform: InsertPlatform): Promise<Platform> {
    const id = this.platformIdCounter++;
    const newPlatform: Platform = { ...platform, id };
    this.platformDb.set(id, newPlatform);
    return newPlatform;
  }

  async getServices(): Promise<Service[]> {
    return Array.from(this.serviceDb.values());
  }

  async getServicesByPlatform(platformId: number): Promise<Service[]> {
    return Array.from(this.serviceDb.values()).filter(
      (service) => service.platformId === platformId
    );
  }

  async getService(id: number): Promise<Service | undefined> {
    return this.serviceDb.get(id);
  }

  async createService(service: InsertService): Promise<Service> {
    const id = this.serviceIdCounter++;
    const newService: Service = { ...service, id };
    this.serviceDb.set(id, newService);
    return newService;
  }

  async createPayment(payment: InsertPayment): Promise<Payment> {
    const id = this.paymentIdCounter++;
    const newPayment: Payment = { ...payment, id, createdAt: new Date() };
    this.paymentDb.set(id, newPayment);
    return newPayment;
  }

  async getUserPayments(userId: number): Promise<Payment[]> {
    return Array.from(this.paymentDb.values()).filter(
      (payment) => payment.userId === userId
    );
  }

  async getUserSubscriptions(userId: number): Promise<UserSubscription[]> {
    return Array.from(this.userSubscriptionDb.values()).filter(
      (subscription) => subscription.userId === userId
    );
  }

  async createUserSubscription(subscription: InsertUserSubscription): Promise<UserSubscription> {
    const id = this.subscriptionIdCounter++;
    const newSubscription: UserSubscription = { ...subscription, id };
    this.userSubscriptionDb.set(id, newSubscription);
    return newSubscription;
  }

  async updateUserSubscription(id: number, data: Partial<UserSubscription>): Promise<UserSubscription | undefined> {
    const subscription = this.userSubscriptionDb.get(id);
    if (!subscription) return undefined;

    const updatedSubscription = { ...subscription, ...data };
    this.userSubscriptionDb.set(id, updatedSubscription);
    return updatedSubscription;
  }
}

export const storage = new MemStorage();
