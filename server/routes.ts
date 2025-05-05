import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import Stripe from "stripe";
import { z } from "zod";
import { db } from "./db";
import { users, userSubscriptions, payments } from "@shared/schema";

if (!process.env.STRIPE_SECRET_KEY) {
  console.warn('Missing STRIPE_SECRET_KEY. Stripe functionality will not work properly.');
}

const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2023-10-16" })
  : undefined;

export async function registerRoutes(app: Express): Promise<Server> {
  // Sets up /api/register, /api/login, /api/logout, /api/user
  setupAuth(app);

  // Platform routes
  app.get("/api/platforms", async (req, res) => {
    try {
      const platforms = await storage.getPlatforms();
      res.json(platforms);
    } catch (error: any) {
      res.status(500).json({ message: "Error fetching platforms: " + error.message });
    }
  });

  // Subscription plans routes
  app.get("/api/subscription-plans", async (req, res) => {
    try {
      const plans = await storage.getSubscriptionPlans();
      res.json(plans);
    } catch (error: any) {
      res.status(500).json({ message: "Error fetching subscription plans: " + error.message });
    }
  });

  app.get("/api/subscription-plans/:id", async (req, res) => {
    try {
      const plan = await storage.getSubscriptionPlan(parseInt(req.params.id));
      if (!plan) {
        return res.status(404).json({ message: "Subscription plan not found" });
      }
      res.json(plan);
    } catch (error: any) {
      res.status(500).json({ message: "Error fetching subscription plan: " + error.message });
    }
  });

  // User subscriptions routes
  app.get("/api/user-subscriptions", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const subscriptions = await storage.getUserSubscriptions(req.user.id);
      
      // Get plan details for each subscription
      const results = await Promise.all(
        subscriptions.map(async (sub) => {
          const plan = await storage.getSubscriptionPlan(sub.planId);
          return { subscription: sub, plan };
        })
      );
      
      res.json(results);
    } catch (error: any) {
      res.status(500).json({ message: "Error fetching user subscriptions: " + error.message });
    }
  });
  
  app.get("/api/user-subscriptions/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const id = parseInt(req.params.id);
      const subscriptionWithPlan = await storage.getUserSubscriptionWithPlan(id);
      
      if (!subscriptionWithPlan) {
        return res.status(404).json({ message: "Subscription not found" });
      }
      
      // Check if the subscription belongs to the logged-in user
      if (subscriptionWithPlan.subscription.userId !== req.user.id) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      res.json(subscriptionWithPlan);
    } catch (error: any) {
      res.status(500).json({ message: "Error fetching subscription: " + error.message });
    }
  });
  
  // Update Twitch channel for subscription
  app.put("/api/user-subscriptions/:id/twitch-channel", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const subscriptionId = parseInt(req.params.id);
      const { twitchChannel } = req.body;
      
      // Validate data
      if (!twitchChannel) {
        return res.status(400).json({ message: "Twitch channel is required" });
      }
      
      // Get the subscription to verify ownership
      const subscription = await storage.getUserSubscriptionWithPlan(subscriptionId);
      
      if (!subscription) {
        return res.status(404).json({ message: "Subscription not found" });
      }
      
      // Check if subscription belongs to the user
      if (subscription.subscription.userId !== req.user.id) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      // Update the twitch channel
      const updated = await storage.updateSubscriptionTwitchChannel(subscriptionId, twitchChannel);
      
      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ message: "Error updating Twitch channel: " + error.message });
    }
  });
  
  // Toggle subscription activation
  app.put("/api/user-subscriptions/:id/toggle", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const subscriptionId = parseInt(req.params.id);
      const { isActive } = req.body;
      
      // Get the subscription to verify ownership
      const subscription = await storage.getUserSubscriptionWithPlan(subscriptionId);
      
      if (!subscription) {
        return res.status(404).json({ message: "Subscription not found" });
      }
      
      // Check if subscription belongs to the user
      if (subscription.subscription.userId !== req.user.id) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      // Check if the channel is set
      if (isActive && !subscription.subscription.twitchChannel) {
        return res.status(400).json({ message: "You must set a Twitch channel before activating this subscription" });
      }
      
      // Toggle subscription
      const updated = await storage.toggleSubscriptionStatus(subscriptionId, isActive);
      
      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ message: "Error toggling subscription: " + error.message });
    }
  });
  
  // Update Viewer Settings
  app.put("/api/user-subscriptions/:id/viewer-settings", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const subscriptionId = parseInt(req.params.id);
      const { settings } = req.body;
      
      // Get the subscription to verify ownership
      const subscription = await storage.getUserSubscriptionWithPlan(subscriptionId);
      
      if (!subscription) {
        return res.status(404).json({ message: "Subscription not found" });
      }
      
      // Check if subscription belongs to the user
      if (subscription.subscription.userId !== req.user.id) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      // Validate settings
      const settingsSchema = z.object({
        viewerCount: z.number().min(1).max(subscription.plan.viewerCount),
        chatMode: z.enum(["quiet", "moderate", "active"]),
        autoMessages: z.boolean(),
        customMessages: z.array(z.string()).optional(),
      });
      
      try {
        settingsSchema.parse(JSON.parse(settings));
      } catch (validationError) {
        return res.status(400).json({ message: "Invalid settings format", error: validationError });
      }
      
      // Update the settings
      const updated = await storage.updateViewerSettings(subscriptionId, settings);
      
      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ message: "Error updating viewer settings: " + error.message });
    }
  });
  
  // Update Chat Settings
  app.put("/api/user-subscriptions/:id/chat-settings", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const subscriptionId = parseInt(req.params.id);
      const { settings } = req.body;
      
      // Get the subscription to verify ownership
      const subscription = await storage.getUserSubscriptionWithPlan(subscriptionId);
      
      if (!subscription) {
        return res.status(404).json({ message: "Subscription not found" });
      }
      
      // Check if subscription belongs to the user
      if (subscription.subscription.userId !== req.user.id) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      // Validate settings
      const settingsSchema = z.object({
        chatCount: z.number().min(1).max(subscription.plan.chatCount),
        messageFrequency: z.enum(["low", "medium", "high"]),
        autoRespond: z.boolean(),
        chatBotNames: z.array(z.string()).optional(),
        customResponses: z.record(z.string(), z.string()).optional(),
      });
      
      try {
        settingsSchema.parse(JSON.parse(settings));
      } catch (validationError) {
        return res.status(400).json({ message: "Invalid settings format", error: validationError });
      }
      
      // Update the settings
      const updated = await storage.updateChatSettings(subscriptionId, settings);
      
      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ message: "Error updating chat settings: " + error.message });
    }
  });
  
  // Update Follower Settings
  app.put("/api/user-subscriptions/:id/follower-settings", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const subscriptionId = parseInt(req.params.id);
      const { settings } = req.body;
      
      // Get the subscription to verify ownership
      const subscription = await storage.getUserSubscriptionWithPlan(subscriptionId);
      
      if (!subscription) {
        return res.status(404).json({ message: "Subscription not found" });
      }
      
      // Check if subscription belongs to the user
      if (subscription.subscription.userId !== req.user.id) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      // Validate settings
      const settingsSchema = z.object({
        followerCount: z.number().min(1).max(subscription.plan.followerCount),
        deliverySpeed: z.enum(["slow", "normal", "fast"]),
        scheduleDelivery: z.boolean(),
        scheduleTime: z.string().optional(),
      });
      
      try {
        settingsSchema.parse(JSON.parse(settings));
      } catch (validationError) {
        return res.status(400).json({ message: "Invalid settings format", error: validationError });
      }
      
      // Update the settings
      const updated = await storage.updateFollowerSettings(subscriptionId, settings);
      
      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ message: "Error updating follower settings: " + error.message });
    }
  });
  
  // Update Geographic Targeting
  app.put("/api/user-subscriptions/:id/geographic-targeting", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const subscriptionId = parseInt(req.params.id);
      const { countries } = req.body;
      
      // Get the subscription to verify ownership
      const subscription = await storage.getUserSubscriptionWithPlan(subscriptionId);
      
      if (!subscription) {
        return res.status(404).json({ message: "Subscription not found" });
      }
      
      // Check if subscription belongs to the user
      if (subscription.subscription.userId !== req.user.id) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      // Check if plan supports geographic targeting
      if (!subscription.plan.geographicTargeting) {
        return res.status(400).json({ message: "Your plan does not support geographic targeting" });
      }
      
      // Update the geographic targeting
      const updated = await storage.updateGeographicTargeting(subscriptionId, countries);
      
      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ message: "Error updating geographic targeting: " + error.message });
    }
  });
  
  // Toggle service status (viewers, chat, followers)
  app.put("/api/user-subscriptions/:id/service/:serviceType", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const subscriptionId = parseInt(req.params.id);
      const serviceType = req.params.serviceType;
      const { isActive } = req.body;
      
      // Validate service type
      if (!['viewers', 'chat', 'followers'].includes(serviceType)) {
        return res.status(400).json({ message: "Invalid service type. Must be 'viewers', 'chat', or 'followers'." });
      }
      
      // Get the subscription to verify ownership
      const subscription = await storage.getUserSubscriptionWithPlan(subscriptionId);
      
      if (!subscription) {
        return res.status(404).json({ message: "Subscription not found" });
      }
      
      // Check if subscription belongs to the user
      if (subscription.subscription.userId !== req.user.id) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      // Check if subscription is active before activating services
      if (isActive && !subscription.subscription.isActive) {
        return res.status(400).json({ message: "Subscription must be active to start services" });
      }
      
      // Check if Twitch channel is set before activating services
      if (isActive && !subscription.subscription.twitchChannel) {
        return res.status(400).json({ message: "You must set a Twitch channel before activating services" });
      }
      
      // Update the service status
      const updated = await storage.updateServiceStatus(subscriptionId, serviceType, isActive);
      
      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ message: `Error updating ${req.params.serviceType} service status: ${error.message}` });
    }
  });

  // Stripe payment route for one-time payments
  app.post("/api/create-payment-intent", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!stripe) {
      return res.status(500).json({ message: "Stripe is not configured." });
    }

    try {
      const { amount } = req.body;
      
      if (!amount || amount <= 0) {
        return res.status(400).json({ message: "Invalid amount" });
      }

      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: "usd",
        metadata: {
          userId: req.user.id.toString(),
        }
      });

      // Create a payment record
      await storage.createPayment({
        userId: req.user.id,
        amount: Math.round(amount * 100),
        currency: "usd",
        status: "pending",
        paymentMethod: "stripe",
        stripePaymentIntentId: paymentIntent.id,
      });

      res.json({ clientSecret: paymentIntent.client_secret });
    } catch (error: any) {
      res.status(500).json({ message: "Error creating payment intent: " + error.message });
    }
  });

  // Subscription creation
  app.post('/api/get-or-create-subscription', async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!stripe) {
      return res.status(500).json({ message: "Stripe is not configured." });
    }

    let user = req.user;

    // If user already has a subscription
    if (user.stripeSubscriptionId) {
      try {
        const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);

        res.json({
          subscriptionId: subscription.id,
          clientSecret: subscription.latest_invoice?.payment_intent?.client_secret,
        });
        return;
      } catch (error) {
        // If there was an error retrieving the subscription, continue to create a new one
        console.error("Error retrieving subscription:", error);
      }
    }
    
    if (!user.email) {
      return res.status(400).json({ message: 'No user email on file' });
    }

    try {
      const { planId } = req.body;
      
      if (!planId) {
        return res.status(400).json({ message: "Plan ID is required" });
      }
      
      const plan = await storage.getSubscriptionPlan(parseInt(planId));
      
      if (!plan) {
        return res.status(404).json({ message: "Subscription plan not found" });
      }
      
      if (!plan.stripePriceId) {
        return res.status(400).json({ message: "Selected plan does not have a valid price ID" });
      }

      // Create or use existing Stripe customer
      let customerId = user.stripeCustomerId;
      
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: user.email,
          name: user.username,
        });
        
        customerId = customer.id;
        user = await storage.updateStripeCustomerId(user.id, customerId);
      }

      // Create subscription
      const subscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [{
          price: plan.stripePriceId,
        }],
        payment_behavior: 'default_incomplete',
        expand: ['latest_invoice.payment_intent'],
      });

      // Update user with subscription info
      await storage.updateUserStripeInfo(user.id, {
        customerId: customerId, 
        subscriptionId: subscription.id
      });
      
      // Create user subscription record
      const now = new Date();
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 1);
      
      await storage.createUserSubscription({
        userId: user.id,
        planId: plan.id,
        status: "active",
        startDate: now,
        endDate: endDate,
        stripeSubscriptionId: subscription.id,
      });
  
      res.json({
        subscriptionId: subscription.id,
        clientSecret: subscription.latest_invoice?.payment_intent?.client_secret,
      });
    } catch (error: any) {
      res.status(500).json({ message: "Error creating subscription: " + error.message });
    }
  });

  // Admin API routes
  app.get("/api/admin/users", async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== "admin") {
      return res.status(403).json({ message: "Forbidden" });
    }
    
    try {
      // Get all users from the database
      const allUsers = await db.select().from(users);
      res.json(allUsers);
    } catch (error: any) {
      res.status(500).json({ message: "Error fetching users: " + error.message });
    }
  });

  app.get("/api/admin/payments", async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== "admin") {
      return res.status(403).json({ message: "Forbidden" });
    }
    
    try {
      // Get all payments from the database
      const allPayments = await db.select().from(payments);
      res.json(allPayments);
    } catch (error: any) {
      res.status(500).json({ message: "Error fetching payments: " + error.message });
    }
  });

  app.get("/api/admin/subscriptions", async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== "admin") {
      return res.status(403).json({ message: "Forbidden" });
    }
    
    try {
      // Get all user subscriptions from the database
      const subscriptions = await db.select().from(userSubscriptions);
      res.json(subscriptions);
    } catch (error: any) {
      res.status(500).json({ message: "Error fetching subscriptions: " + error.message });
    }
  });

  app.post("/api/admin/subscription-plans", async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== "admin") {
      return res.status(403).json({ message: "Forbidden" });
    }
    
    try {
      const plan = await storage.createSubscriptionPlan(req.body);
      res.status(201).json(plan);
    } catch (error: any) {
      res.status(500).json({ message: "Error creating subscription plan: " + error.message });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
