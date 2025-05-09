import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import Stripe from "stripe";
import { z } from "zod";
import { mailService } from "./mail";
import crypto from "crypto";

// Email verification constants
const EMAIL_VERIFICATION = {
  COOLDOWN_PERIOD_MS: 60000, // 1 minute cooldown between email sends
  MAX_ATTEMPTS: 5,           // Maximum 5 attempts per hour
  RESET_PERIOD_MS: 3600000   // 1 hour reset period for attempts counter
};

// Email verification rate limiting
interface VerificationRateLimiter {
  [userId: number]: {
    lastSent: number;
    count: number;
  }
}

// Store rate limiting data in memory
const verificationRateLimit: VerificationRateLimiter = {};

if (!process.env.STRIPE_SECRET_KEY) {
  console.warn('Missing STRIPE_SECRET_KEY. Stripe functionality will not work properly.');
}

const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2023-10-16" })
  : undefined;

export async function registerRoutes(app: Express): Promise<Server> {
  // Import required functions and modules
  const { hashPassword, comparePasswords } = await import('./auth');
  // Sets up /api/register, /api/login, /api/logout, /api/user
  setupAuth(app);
  
  // Email verification routes
  app.get("/api/verify-email", async (req, res) => {
    try {
      const token = req.query.token as string;
      if (!token) {
        return res.status(400).json({ message: "Token is required" });
      }
      
      const user = await storage.verifyEmail(token);
      if (!user) {
        return res.status(400).json({ message: "Invalid or expired verification token" });
      }
      
      // Send welcome email after successful verification
      if (user.email) {
        await mailService.sendWelcomeEmail(user.email, user.username);
      }
      
      return res.json({ message: "Email verified successfully" });
    } catch (error: any) {
      return res.status(500).json({ message: "Error verifying email: " + error.message });
    }
  });
  
  // Check verification rate limit status without actually sending an email
  app.get("/api/verification-status", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    try {
      const userId = req.user.id;
      
      // Check if user is rate limited
      const now = Date.now();
      const userRateLimit = verificationRateLimit[userId];
      
      if (userRateLimit) {
        // Check if we're still in cooldown period
        if (now - userRateLimit.lastSent < EMAIL_VERIFICATION.COOLDOWN_PERIOD_MS) {
          const remainingSeconds = Math.ceil((EMAIL_VERIFICATION.COOLDOWN_PERIOD_MS - (now - userRateLimit.lastSent)) / 1000);
          return res.status(429).json({ 
            message: `Please wait ${remainingSeconds} seconds before requesting another verification email`,
            remainingSeconds
          });
        }
        
        // Check for maximum attempts within reset period
        if (userRateLimit.count >= EMAIL_VERIFICATION.MAX_ATTEMPTS && 
            now - userRateLimit.lastSent < EMAIL_VERIFICATION.RESET_PERIOD_MS) {
          const resetTime = new Date(userRateLimit.lastSent + EMAIL_VERIFICATION.RESET_PERIOD_MS);
          return res.status(429).json({ 
            message: `Maximum verification attempts reached. Please try again after ${resetTime.toLocaleTimeString()}`,
            resetTime: resetTime.toISOString()
          });
        }
      }
      
      // User is not rate-limited
      return res.json({ 
        status: "ok",
        canSendVerification: true
      });
    } catch (error: any) {
      return res.status(500).json({ message: "Error checking verification status: " + error.message });
    }
  });
  
  app.post("/api/resend-verification", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    try {
      const userId = req.user.id;
      
      // Rate limiting check
      const now = Date.now();
      const userRateLimit = verificationRateLimit[userId];
      
      if (userRateLimit) {
        // Check if we're still in cooldown period
        if (now - userRateLimit.lastSent < EMAIL_VERIFICATION.COOLDOWN_PERIOD_MS) {
          const remainingSeconds = Math.ceil((EMAIL_VERIFICATION.COOLDOWN_PERIOD_MS - (now - userRateLimit.lastSent)) / 1000);
          return res.status(429).json({ 
            message: `Please wait ${remainingSeconds} seconds before requesting another verification email`,
            remainingSeconds
          });
        }
        
        // Check for maximum attempts within reset period
        if (userRateLimit.count >= EMAIL_VERIFICATION.MAX_ATTEMPTS && 
            now - userRateLimit.lastSent < EMAIL_VERIFICATION.RESET_PERIOD_MS) {
          const resetTime = new Date(userRateLimit.lastSent + EMAIL_VERIFICATION.RESET_PERIOD_MS);
          return res.status(429).json({ 
            message: `Maximum verification attempts reached. Please try again after ${resetTime.toLocaleTimeString()}`,
            resetTime: resetTime.toISOString()
          });
        }
        
        // Update count if we're still in the reset period
        if (now - userRateLimit.lastSent < EMAIL_VERIFICATION.RESET_PERIOD_MS) {
          userRateLimit.count += 1;
        } else {
          // Reset count if we're outside the reset period
          userRateLimit.count = 1;
        }
        
        // Update last sent time
        userRateLimit.lastSent = now;
      } else {
        // First attempt for this user
        verificationRateLimit[userId] = {
          lastSent: now,
          count: 1
        };
      }
      
      const result = await storage.resendVerificationEmail(userId);
      
      if (!result) {
        return res.status(400).json({ message: "Failed to generate verification token" });
      }
      
      // Generate verification URL and send email
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      const verificationUrl = `${baseUrl}/verify-email?token=${result.token}`;
      
      // Send verification email
      let emailSent = false;
      if (result.user.email) {
        emailSent = await mailService.sendVerificationEmail(
          result.user.email,
          result.user.username,
          result.token
        );
      }
      
      return res.json({ 
        message: emailSent 
          ? "Verification email sent successfully" 
          : "Verification token generated, but email could not be sent",
        success: emailSent,
        // Return the remaining attempts information
        rateLimitInfo: {
          attemptsUsed: verificationRateLimit[userId].count,
          attemptsMax: EMAIL_VERIFICATION.MAX_ATTEMPTS,
          cooldownSeconds: Math.ceil(EMAIL_VERIFICATION.COOLDOWN_PERIOD_MS / 1000)
        },
        // Only include these details in development
        debug: { 
          token: result.token,
          url: verificationUrl 
        }
      });
    } catch (error: any) {
      return res.status(500).json({ message: "Error resending verification email: " + error.message });
    }
  });

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
  
  // User profile endpoints
  app.put("/api/user/profile", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      // Validate incoming data
      const profileSchema = z.object({
        fullName: z.string().min(2, "Full name must be at least 2 characters").optional(),
        displayName: z.string().min(2, "Display name must be at least 2 characters").optional(),
        email: z.string().email("Invalid email address").optional(),
        bio: z.string().optional(),
        location: z.string().optional(),
        website: z.string().optional(),
        twitterHandle: z.string().optional(),
        discordUsername: z.string().optional(),
      });
      
      const validData = profileSchema.parse(req.body);
      
      // Update the user profile
      const updatedUser = await storage.updateUser(req.user.id, {
        // Only include email in the update if it's actually provided
        ...(validData.email && { email: validData.email }),
        // Store additional profile data as JSON in the metadata field
        profileData: JSON.stringify({
          fullName: validData.fullName || "",
          displayName: validData.displayName || "",
          bio: validData.bio || "",
          location: validData.location || "",
          website: validData.website || "",
          twitterHandle: validData.twitterHandle || "",
          discordUsername: validData.discordUsername || "",
        })
      });
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Remove password from response
      const userResponse = { ...updatedUser };
      delete userResponse.password;
      
      res.json(userResponse);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: error.errors.map(e => ({
            path: e.path.join("."),
            message: e.message
          })) 
        });
      }
      res.status(500).json({ message: "Error updating profile: " + error.message });
    }
  });
  
  // Update security settings
  app.put("/api/user/security", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      // Validate incoming data
      const securitySchema = z.object({
        twoFactorEnabled: z.boolean().optional(),
        loginNotifications: z.boolean().optional(),
        sessionTimeout: z.string().optional(),
      });
      
      const validData = securitySchema.parse(req.body);
      
      // Update the user security settings
      const updatedUser = await storage.updateUser(req.user.id, {
        securitySettings: JSON.stringify(validData),
      });
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Remove password from response
      const userResponse = { ...updatedUser };
      delete userResponse.password;
      
      res.json(userResponse);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: error.errors.map(e => ({
            path: e.path.join("."),
            message: e.message
          })) 
        });
      }
      res.status(500).json({ message: "Error updating security settings: " + error.message });
    }
  });
  
  // Update notification preferences
  app.put("/api/user/notifications", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      // Validate incoming data
      const notificationsSchema = z.object({
        email: z.boolean().optional(),
        sms: z.boolean().optional(),
        browser: z.boolean().optional(),
        payments: z.boolean().optional(),
        updates: z.boolean().optional(),
        marketing: z.boolean().optional(),
      });
      
      const validData = notificationsSchema.parse(req.body);
      
      // Update the user notification preferences
      const updatedUser = await storage.updateUser(req.user.id, {
        notificationPreferences: JSON.stringify(validData),
      });
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Remove password from response
      const userResponse = { ...updatedUser };
      delete userResponse.password;
      
      res.json(userResponse);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: error.errors.map(e => ({
            path: e.path.join("."),
            message: e.message
          })) 
        });
      }
      res.status(500).json({ message: "Error updating notification preferences: " + error.message });
    }
  });
  
  // Change password endpoint
  app.put("/api/user/change-password", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      // Validate incoming data
      const passwordSchema = z.object({
        currentPassword: z.string().min(1, "Current password is required"),
        newPassword: z.string().min(6, "New password must be at least 6 characters"),
        confirmPassword: z.string().min(6, "Confirm password must be at least 6 characters").optional(),
      }).superRefine((data, ctx) => {
        // Only check password match if confirmPassword is provided
        if (data.confirmPassword && data.newPassword !== data.confirmPassword) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Passwords do not match",
            path: ["confirmPassword"],
          });
        }
      });
      
      const validData = passwordSchema.parse(req.body);
      
      // Verify current password
      const user = await storage.getUser(req.user.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const passwordValid = await comparePasswords(validData.currentPassword, user.password);
      if (!passwordValid) {
        return res.status(400).json({ message: "Current password is incorrect" });
      }
      
      // Update password
      const updatedUser = await storage.updateUser(req.user.id, {
        password: await hashPassword(validData.newPassword),
      });
      
      res.json({ message: "Password changed successfully" });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: error.errors.map(e => ({
            path: e.path.join("."),
            message: e.message
          })) 
        });
      }
      res.status(500).json({ message: "Error changing password: " + error.message });
    }
  });

  // Admin API routes
  // Admin middleware to check admin permissions
  const isAdmin = (req: Request, res: Response, next: NextFunction) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Forbidden - Admin access required" });
    }
    next();
  };

  // Admin User Management APIs
  app.get("/api/admin/users", isAdmin, async (req, res) => {
    try {
      const users = await db.select().from(users);
      res.json(users);
    } catch (error: any) {
      res.status(500).json({ message: "Error fetching users: " + error.message });
    }
  });

  app.get("/api/admin/users/:id", isAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Fetch additional user data
      const userSubscriptions = await storage.getUserSubscriptions(userId);
      const userPayments = await storage.getUserPayments(userId);
      
      // Create comprehensive user profile
      const userProfile = {
        ...user,
        subscriptions: userSubscriptions,
        payments: userPayments
      };
      
      res.json(userProfile);
    } catch (error: any) {
      res.status(500).json({ message: "Error fetching user details: " + error.message });
    }
  });

  app.put("/api/admin/users/:id", isAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Update user data with validation
      const updateSchema = z.object({
        username: z.string().optional(),
        email: z.string().email().optional(),
        role: z.enum(["user", "admin"]).optional(),
        isEmailVerified: z.boolean().optional()
      });
      
      const validatedData = updateSchema.parse(req.body);
      const updatedUser = await storage.updateUser(userId, validatedData);
      
      res.json(updatedUser);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: error.errors.map(e => ({
            path: e.path.join("."),
            message: e.message
          })) 
        });
      }
      res.status(500).json({ message: "Error updating user: " + error.message });
    }
  });

  // Manual email verification by admin
  app.post("/api/admin/users/:id/verify-email", isAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const updatedUser = await storage.updateUser(userId, { isEmailVerified: true });
      res.json({ 
        message: "User email manually verified by admin", 
        user: updatedUser 
      });
    } catch (error: any) {
      res.status(500).json({ message: "Error verifying user email: " + error.message });
    }
  });

  // Reset user password (admin function)
  app.post("/api/admin/users/:id/reset-password", isAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Validate new password
      const resetSchema = z.object({
        newPassword: z.string().min(8)
      });
      
      const { newPassword } = resetSchema.parse(req.body);
      const hashedPassword = await hashPassword(newPassword);
      
      const updatedUser = await storage.updateUser(userId, { password: hashedPassword });
      res.json({ 
        message: "User password reset successfully",
        success: true
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: error.errors.map(e => ({
            path: e.path.join("."),
            message: e.message
          }))
        });
      }
      res.status(500).json({ message: "Error resetting password: " + error.message });
    }
  });

  // Admin Payment APIs
  app.get("/api/admin/payments", isAdmin, async (req, res) => {
    try {
      const payments = await db.select().from(payments);
      res.json(payments);
    } catch (error: any) {
      res.status(500).json({ message: "Error fetching payments: " + error.message });
    }
  });

  // Admin Subscription APIs
  app.get("/api/admin/subscriptions", isAdmin, async (req, res) => {
    try {
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
  
  // Billing Info API Endpoints
  
  // Stripe Payment Methods API
  
  // Get user payment methods
  app.get("/api/payment-methods", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    if (!stripe) {
      return res.status(500).json({ message: "Stripe is not configured." });
    }
    
    try {
      const user = req.user;
      
      if (!user.stripeCustomerId) {
        return res.json([]);
      }
      
      const paymentMethods = await stripe.paymentMethods.list({
        customer: user.stripeCustomerId,
        type: 'card',
      });
      
      res.json(paymentMethods.data);
    } catch (error: any) {
      res.status(500).json({ message: "Error fetching payment methods: " + error.message });
    }
  });
  
  // Add a new payment method
  app.post("/api/payment-methods", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    if (!stripe) {
      return res.status(500).json({ message: "Stripe is not configured." });
    }
    
    try {
      const { paymentMethodId } = req.body;
      
      if (!paymentMethodId) {
        return res.status(400).json({ message: "Payment method ID is required" });
      }
      
      let user = req.user;
      let customerId = user.stripeCustomerId;
      
      // Create customer if it doesn't exist
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: user.email,
          name: user.username,
        });
        
        customerId = customer.id;
        user = await storage.updateStripeCustomerId(user.id, customerId);
      }
      
      // Attach payment method to customer
      await stripe.paymentMethods.attach(paymentMethodId, {
        customer: customerId,
      });
      
      // Set as default payment method
      await stripe.customers.update(customerId, {
        invoice_settings: {
          default_payment_method: paymentMethodId,
        },
      });
      
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ message: "Error adding payment method: " + error.message });
    }
  });
  
  // Delete a payment method
  app.delete("/api/payment-methods/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    if (!stripe) {
      return res.status(500).json({ message: "Stripe is not configured." });
    }
    
    try {
      const paymentMethodId = req.params.id;
      
      // Get the payment method to check ownership
      const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);
      
      if (paymentMethod.customer !== req.user.stripeCustomerId) {
        return res.status(403).json({ message: "This payment method does not belong to your account" });
      }
      
      // Detach the payment method
      await stripe.paymentMethods.detach(paymentMethodId);
      
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ message: "Error removing payment method: " + error.message });
    }
  });
  
  // Set default payment method
  app.post("/api/payment-methods/:id/set-default", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    if (!stripe) {
      return res.status(500).json({ message: "Stripe is not configured." });
    }
    
    try {
      const paymentMethodId = req.params.id;
      const customerId = req.user.stripeCustomerId;
      
      if (!customerId) {
        return res.status(400).json({ message: "No Stripe customer found for this user" });
      }
      
      // Get the payment method to check ownership
      const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);
      
      if (paymentMethod.customer !== customerId) {
        return res.status(403).json({ message: "This payment method does not belong to your account" });
      }
      
      // Set as default payment method
      await stripe.customers.update(customerId, {
        invoice_settings: {
          default_payment_method: paymentMethodId,
        },
      });
      
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ message: "Error setting default payment method: " + error.message });
    }
  });
  
  // Setup Intent for adding new cards
  app.post("/api/setup-intent", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    if (!stripe) {
      return res.status(500).json({ message: "Stripe is not configured." });
    }
    
    try {
      let user = req.user;
      let customerId = user.stripeCustomerId;
      
      // Create customer if it doesn't exist
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: user.email,
          name: user.username,
        });
        
        customerId = customer.id;
        user = await storage.updateStripeCustomerId(user.id, customerId);
      }
      
      // Create setup intent
      const setupIntent = await stripe.setupIntents.create({
        customer: customerId,
        payment_method_types: ['card'],
      });
      
      res.json({
        clientSecret: setupIntent.client_secret,
      });
    } catch (error: any) {
      res.status(500).json({ message: "Error creating setup intent: " + error.message });
    }
  });
  
  // Get billing history (invoices)
  app.get("/api/billing-history", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    if (!stripe) {
      return res.status(500).json({ message: "Stripe is not configured." });
    }
    
    try {
      const user = req.user;
      
      if (!user.stripeCustomerId) {
        return res.json([]);
      }
      
      const invoices = await stripe.invoices.list({
        customer: user.stripeCustomerId,
        limit: 10,
        expand: ['data.charge', 'data.payment_intent']
      });
      
      res.json(invoices.data);
    } catch (error: any) {
      res.status(500).json({ message: "Error fetching billing history: " + error.message });
    }
  });
  
  // Sync customer billing details with Stripe
  app.post("/api/sync-billing-with-stripe", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const user = req.user;
      
      if (!user.stripeCustomerId) {
        return res.status(404).json({ message: "No Stripe customer found" });
      }
      
      // Get current billing info
      const currentUser = await storage.getUser(user.id);
      if (!currentUser || !currentUser.billingInfo) {
        return res.status(400).json({ message: "No billing information to sync" });
      }
      
      const billingInfo = JSON.parse(currentUser.billingInfo);
      
      // Update customer in Stripe
      await stripe.customers.update(user.stripeCustomerId, {
        name: billingInfo.fullName || user.username,
        email: billingInfo.email || user.email,
        address: billingInfo.address1 ? {
          line1: billingInfo.address1,
          line2: billingInfo.address2 || '',
          city: billingInfo.city || '',
          state: billingInfo.state || '',
          postal_code: billingInfo.zip || '',
          country: billingInfo.country || '',
        } : undefined,
        metadata: {
          isCompany: billingInfo.isCompany ? 'true' : 'false',
          companyName: billingInfo.companyName || '',
          companyRegistrationNumber: billingInfo.companyRegistrationNumber || '',
          companyVatNumber: billingInfo.companyVatNumber || '',
        }
      });
      
      res.json({
        success: true,
        message: "Billing information synchronized with Stripe"
      });
    } catch (error: any) {
      res.status(500).json({ message: "Error syncing billing data with Stripe: " + error.message });
    }
  });
  
  // Endpoint to generate a new invoice PDF
  app.get("/api/invoice/:invoiceId/pdf", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const { invoiceId } = req.params;
      const user = req.user;
      
      // Verify the invoice belongs to this user
      const invoice = await stripe.invoices.retrieve(invoiceId);
      if (invoice.customer !== user.stripeCustomerId) {
        return res.status(403).json({ message: "Access denied to this invoice" });
      }
      
      // Get PDF
      const invoicePdf = await stripe.invoices.retrievePdf(invoiceId);
      
      // Set appropriate headers
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="invoice-${invoiceId}.pdf"`);
      
      // Stream the PDF to the response
      invoicePdf.pipe(res);
    } catch (error: any) {
      res.status(500).json({ message: "Error generating invoice PDF: " + error.message });
    }
  });
  
  // Get upcoming invoice
  app.get("/api/upcoming-invoice", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const user = req.user;
      
      if (!user.stripeSubscriptionId) {
        return res.status(404).json({ message: "No active subscription found" });
      }
      
      if (!user.stripeCustomerId) {
        return res.status(404).json({ message: "No customer ID found" });
      }
      
      const upcomingInvoice = await stripe.invoices.retrieveUpcoming({
        customer: user.stripeCustomerId,
        subscription: user.stripeSubscriptionId,
      });
      
      res.json(upcomingInvoice);
    } catch (error: any) {
      res.status(500).json({ message: "Error retrieving upcoming invoice: " + error.message });
    }
  });
  
  // Get invoice details by ID
  app.get("/api/billing-history/:invoiceId", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    if (!stripe) {
      return res.status(500).json({ message: "Stripe is not configured." });
    }
    
    try {
      const user = req.user;
      const { invoiceId } = req.params;
      
      if (!user.stripeCustomerId) {
        return res.status(404).json({ message: "No billing account found." });
      }
      
      // Fetch the invoice and verify it belongs to this customer
      const invoice = await stripe.invoices.retrieve(invoiceId, {
        expand: ['charge', 'payment_intent', 'customer', 'subscription']
      });
      
      if (invoice.customer.id !== user.stripeCustomerId) {
        return res.status(403).json({ message: "Access denied to this invoice." });
      }
      
      res.json(invoice);
    } catch (error: any) {
      res.status(500).json({ message: "Error fetching invoice details: " + error.message });
    }
  });

  // Billing information routes
  app.get("/api/billing-info", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const user = await storage.getUser(req.user.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Parse billing info from JSON or return default empty object
      let billingInfo = {};
      try {
        if (user.billingInfo) {
          billingInfo = JSON.parse(user.billingInfo);
          console.log("Successfully parsed billing info:", billingInfo);
        }
      } catch (parseError) {
        console.error("Failed to parse billing info JSON:", parseError);
        // Continue with empty billing info
      }
      
      res.json(billingInfo);
    } catch (error: any) {
      console.error("Error fetching billing info:", error);
      res.status(500).json({ message: "Error fetching billing information: " + error.message });
    }
  });

  app.post("/api/billing-info", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const billingInfoSchema = z.object({
        fullName: z.string().optional(),
        email: z.string().email().optional(),
        address1: z.string().optional(),
        address2: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        zip: z.string().optional(),
        country: z.string().optional(),
        isCompany: z.boolean().optional(),
        companyName: z.string().optional(),
        companyRegistrationNumber: z.string().optional(),
        companyVatNumber: z.string().optional(),
      });

      console.log("Raw billing info received (stringified):", JSON.stringify(req.body));
      console.log("Raw billing info received (direct):", req.body);
      
      const validatedData = billingInfoSchema.parse(req.body);
      
      console.log("Validated billing info update:", validatedData);
      
      // Get current user data before update
      const currentUser = await storage.getUser(req.user.id);
      if (!currentUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Get current billing info if it exists
      let currentBillingInfo = {};
      try {
        if (currentUser.billingInfo) {
          currentBillingInfo = JSON.parse(currentUser.billingInfo);
        }
      } catch (e) {
        console.error("Failed to parse existing billing info:", e);
      }
      
      // Merge existing billing info with new data
      const mergedBillingInfo = { ...currentBillingInfo, ...validatedData };
      console.log("Merged billing info to save:", mergedBillingInfo);
      
      // Store billing info as JSON string
      const updatedUser = await storage.updateUser(req.user.id, {
        billingInfo: JSON.stringify(mergedBillingInfo)
      });

      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({ 
        success: true, 
        message: "Billing information updated successfully", 
        billingInfo: mergedBillingInfo 
      });
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({ message: "Invalid billing information format", errors: error.errors });
      }
      res.status(500).json({ message: "Error updating billing information: " + error.message });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
