import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, hashPassword } from "./auth";
import Stripe from "stripe";
import { z } from "zod";
import { mailService } from "./mail";
import crypto from "crypto";
import { db, pool } from "./db";
import { eq, desc } from "drizzle-orm";
import { getStripe, syncSubscriptionPlansWithStripe, isStripeConfigured, createPaymentIntentForPlan } from "./stripe-helper";
import { 
  users, userSubscriptions, payments, platforms,
  invoices, paymentMethods, securityQuestions, userSecurityQuestions,
  twoFactorAuth, loginAttempts, securitySessions,
  insertPaymentSchema, insertInvoiceSchema, insertPaymentMethodSchema,
  insertTwoFactorAuthSchema, insertUserSecurityQuestionSchema,
  insertSecuritySessionSchema, insertLoginAttemptSchema,
  digitalProducts, smmProviders, digitalProductOrders
} from "@shared/schema";
import { productReviews, reviewVotes } from "./schema/reviews";
import { authenticator } from 'otplib';
import QRCode from 'qrcode';

// Email verification constants
const EMAIL_VERIFICATION = {
  COOLDOWN_PERIOD_MS: 60000, // 1 minute cooldown between email sends
  MAX_ATTEMPTS: 5,           // Maximum 5 attempts per hour
  RESET_PERIOD_MS: 3600000   // 1 hour reset period for attempts counter
};

// Security constants
const SECURITY = {
  // Login attempts
  MAX_LOGIN_ATTEMPTS: 5,     // Maximum failed login attempts before lockout
  LOCKOUT_PERIOD_MS: 900000, // 15 minutes lockout period
  ATTEMPT_WINDOW_MS: 300000, // Track attempts in 5 minute window

  // Two-factor authentication
  TOTP_PERIOD: 30,           // 30-second TOTP period
  TOTP_DIGITS: 6,            // 6-digit TOTP codes
  BACKUP_CODES_COUNT: 10,    // Generate 10 backup codes
  
  // Sessions
  SESSION_TIMEOUT_MS: 1800000, // 30 minute inactive session timeout
  MAX_SESSIONS_PER_USER: 5,   // Maximum concurrent sessions per user
  
  // Security questions
  MIN_SECURITY_QUESTIONS: 2,  // Minimum security questions required
  ANSWER_MIN_LENGTH: 3        // Minimum length for security question answers
};

// Configure TOTP authenticator
authenticator.options = {
  digits: SECURITY.TOTP_DIGITS,
  step: SECURITY.TOTP_PERIOD,
  window: 1
};

// Generate random backup codes
const generateBackupCodes = (count: number = SECURITY.BACKUP_CODES_COUNT): string[] => {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    const code = crypto.randomBytes(4).toString('hex').toUpperCase();
    codes.push(code);
  }
  return codes;
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
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2025-04-30.basil" as any })
  : undefined;

// Admin middleware to check if user is authenticated and has admin role
const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  
  if (req.user?.role !== "admin") {
    return res.status(403).json({ error: "Forbidden - Admin access required" });
  }
  
  next();
};

// Removed duplicated SMM API functions - now using the implementation in server/api/smm-providers.ts

export async function registerRoutes(app: Express): Promise<Server> {
  // Import required functions and modules
  const { hashPassword, comparePasswords } = await import('./auth');
  const digitalProductsRouter = await import('./api/digital-products').then(m => m.default);
  const smmProvidersRouter = await import('./api/smm-providers').then(m => m.default);
  
  // Register the public digital products API route
  // app.use('/api', digitalProductsRouter); // Commented out to avoid route conflicts
  const platformsRouter = await import('./api/platforms').then(m => m.default);
  const productCategoriesRouter = await import('./api/product-categories').then(m => m.default);
  
  // Sets up /api/register, /api/login, /api/logout, /api/user
  setupAuth(app);
  
  // SMM module API routes
  app.use('/api/admin/digital-products', digitalProductsRouter);
  app.use('/api/admin/smm-providers', smmProvidersRouter);
  app.use('/api/platforms', platformsRouter);
  app.use('/api/product-categories', productCategoriesRouter);
  
  // SMM PROVIDERS API
  // Get all SMM providers
  app.get("/api/admin/smm-providers", requireAdmin, async (req, res) => {
    try {
      const providers = await db.select().from(smmProviders);
      res.json(providers);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // Add a new SMM provider
  app.post("/api/admin/smm-providers", requireAdmin, async (req, res) => {
    try {
      const { name, apiUrl, apiKey, isActive } = req.body;
      
      if (!name || !apiUrl || !apiKey) {
        return res.status(400).json({ message: "Name, API URL and API key are required" });
      }
      
      const [provider] = await db.insert(smmProviders)
        .values({
          name,
          apiUrl,
          apiKey,
          isActive: isActive !== undefined ? isActive : true,
        })
        .returning();
      
      res.status(201).json(provider);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // Update a SMM provider
  app.put("/api/admin/smm-providers/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { name, apiUrl, apiKey, isActive } = req.body;
      
      if (!name || !apiUrl || !apiKey) {
        return res.status(400).json({ message: "Name, API URL and API key are required" });
      }
      
      const [provider] = await db.update(smmProviders)
        .set({
          name,
          apiUrl,
          apiKey,
          isActive,
          updatedAt: new Date(),
        })
        .where(eq(smmProviders.id, id))
        .returning();
      
      if (!provider) {
        return res.status(404).json({ message: "SMM provider not found" });
      }
      
      res.json(provider);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // Delete a SMM provider
  app.delete("/api/admin/smm-providers/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      const [provider] = await db.delete(smmProviders)
        .where(eq(smmProviders.id, id))
        .returning();
      
      if (!provider) {
        return res.status(404).json({ message: "SMM provider not found" });
      }
      
      res.json({ message: "SMM provider deleted successfully" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // Test SMM provider connection
  app.post("/api/admin/smm-providers/test-connection", requireAdmin, async (req, res) => {
    try {
      const { apiUrl, apiKey } = req.body;
      
      if (!apiUrl || !apiKey) {
        return res.status(400).json({ message: "API URL and API key are required" });
      }
      
      const result = await testSmmApiConnection(apiUrl, apiKey);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });
  
  // Import services from SMM provider
  app.post("/api/admin/smm-providers/:id/import-services", requireAdmin, async (req, res) => {
    try {
      const providerId = parseInt(req.params.id);
      
      // Get the provider
      const [provider] = await db.select().from(smmProviders)
        .where(eq(smmProviders.id, providerId));
      
      if (!provider) {
        return res.status(404).json({ message: "SMM provider not found" });
      }
      
      // Get services from the SMM provider
      const services = await getSmmServiceList(provider);
      
      // Get all platforms for mapping services
      const platformsData = await db.select().from(platforms);
      const availablePlatforms = platformsData || [];
      
      // Track number of imported services
      let importedCount = 0;
      
      // Process each service
      for (const service of services) {
        // Skip if service doesn't have necessary fields
        if (!service.name || !service.category || !service.rate) {
          continue;
        }
        
        // Find matching platform
        let platformId = null;
        for (const platform of availablePlatforms) {
          if (service.name.toLowerCase().includes(platform.name.toLowerCase())) {
            platformId = platform.id;
            break;
          }
        }
        
        // Skip if no matching platform found
        if (!platformId) {
          continue;
        }
        
        try {
          // Check if product already exists with this external service ID
          const existingProduct = await db.select()
            .from(digitalProducts)
            .where(eq(digitalProducts.externalServiceId, service.service.toString()))
            .limit(1);
            
          if (existingProduct.length > 0) {
            // Update existing product
            await db.update(digitalProducts)
              .set({
                name: service.name,
                price: Math.round(service.rate * 100), // Convert to cents
                minQuantity: service.min || 1,
                maxQuantity: service.max || 1000,
                updatedAt: new Date(),
              })
              .where(eq(digitalProducts.externalServiceId, service.service.toString()));
              
            importedCount++;
          } else {
            // Determine category (followers, likes, etc.)
            let category = "other";
            const name = service.name.toLowerCase();
            
            if (name.includes("follower")) {
              category = "followers";
            } else if (name.includes("like")) {
              category = "likes";
            } else if (name.includes("view")) {
              category = "views";
            } else if (name.includes("comment")) {
              category = "comments";
            } else if (name.includes("subscriber")) {
              category = "subscribers";
            }
            
            // Create new product
            await db.insert(digitalProducts)
              .values({
                name: service.name,
                description: service.name,
                price: Math.round(service.rate * 100), // Convert to cents
                platformId,
                category,
                serviceType: "instant", // Default to instant
                externalProductId: service.id?.toString() || null,
                externalServiceId: service.service.toString(),
                providerName: provider.name,
                minQuantity: service.min || 1,
                maxQuantity: service.max || 1000,
                isActive: true,
              });
              
            importedCount++;
          }
        } catch (err) {
          console.error(`Error importing service ${service.name}:`, err);
          // Continue with next service even if one fails
        }
      }
      
      res.json({ 
        message: `Successfully imported ${importedCount} services from ${provider.name}`,
        importedCount 
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // DIGITAL PRODUCTS API
  // Get all digital products
  app.get("/api/admin/digital-products", requireAdmin, async (req, res) => {
    try {
      const products = await db.select().from(digitalProducts);
      res.json(products);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // Add a new digital product
  app.post("/api/admin/digital-products", requireAdmin, async (req, res) => {
    try {
      const {
        name,
        description,
        price,
        platformId,
        category,
        serviceType,
        externalProductId,
        externalServiceId,
        providerName,
        minQuantity,
        maxQuantity,
        isActive,
        sortOrder,
      } = req.body;
      
      if (!name || !description || price === undefined || !platformId || !category || !serviceType) {
        return res.status(400).json({ message: "Missing required fields" });
      }
      
      const [product] = await db.insert(digitalProducts)
        .values({
          name,
          description,
          price,
          platformId,
          category,
          serviceType,
          externalProductId,
          externalServiceId,
          providerName,
          minQuantity: minQuantity || 1,
          maxQuantity: maxQuantity || 1000,
          isActive: isActive !== undefined ? isActive : true,
          sortOrder: sortOrder || 0,
        })
        .returning();
      
      res.status(201).json(product);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // Update a digital product
  app.put("/api/admin/digital-products/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const {
        name,
        description,
        price,
        platformId,
        category,
        serviceType,
        externalProductId,
        externalServiceId,
        providerName,
        minQuantity,
        maxQuantity,
        isActive,
        sortOrder,
      } = req.body;
      
      if (!name || !description || price === undefined || !platformId || !category || !serviceType) {
        return res.status(400).json({ message: "Missing required fields" });
      }
      
      const [product] = await db.update(digitalProducts)
        .set({
          name,
          description,
          price,
          platformId,
          category,
          serviceType,
          externalProductId,
          externalServiceId,
          providerName,
          minQuantity: minQuantity || 1,
          maxQuantity: maxQuantity || 1000,
          isActive,
          sortOrder: sortOrder || 0,
          updatedAt: new Date(),
        })
        .where(eq(digitalProducts.id, id))
        .returning();
      
      if (!product) {
        return res.status(404).json({ message: "Digital product not found" });
      }
      
      res.json(product);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // Delete a digital product
  app.delete("/api/admin/digital-products/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      const [product] = await db.delete(digitalProducts)
        .where(eq(digitalProducts.id, id))
        .returning();
      
      if (!product) {
        return res.status(404).json({ message: "Digital product not found" });
      }
      
      res.json({ message: "Digital product deleted successfully" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // Middleware to check for active session and apply timeout
  const checkSessionTimeout = async (req: Request, res: Response, next: NextFunction) => {
    if (!req.isAuthenticated() || !req.user) {
      return next();
    }

    try {
      // For now, we'll just use the built-in session capability
      // Later we can implement custom session tracking in the database
      if (req.session) {
        // Touch the session to update its expiration
        req.session.touch();
      }
      
      next();
    } catch (error) {
      console.error("Session check error:", error);
      next();
    }
  };

  // Simple session timeout check to update session expiration
  app.use('/api', checkSessionTimeout);
  
  // Register digital products router
  app.use('/api/digital-products', digitalProductsRouter);
  
  // ============== SECURITY FEATURE ROUTES ==============
  
  // Two-Factor Authentication (2FA) Routes
  
  // Generate 2FA setup details
  app.post("/api/security/2fa/generate", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    try {
      const user = req.user;
      
      // Generate a secret key
      const secret = authenticator.generateSecret();
      
      // Generate backup codes
      const backupCodes = generateBackupCodes();
      
      // Save 2FA setup (not enabled yet until verified)
      await storage.createTwoFactorAuth({
        userId: user.id,
        secret,
        backupCodes: JSON.stringify(backupCodes),
        enabled: false
      });
      
      // Generate QR code
      const otpAuthUrl = authenticator.keyuri(user.email, 'ViewerApps', secret);
      const qrCodeUrl = await QRCode.toDataURL(otpAuthUrl);
      
      res.json({
        secret,
        qrCodeUrl,
        backupCodes,
        message: "Two-factor authentication setup initiated"
      });
    } catch (error: any) {
      console.error("2FA setup error:", error);
      res.status(500).json({ message: "Failed to set up two-factor authentication" });
    }
  });
  
  // Verify and enable 2FA
  app.post("/api/security/2fa/verify", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    try {
      const { token } = req.body;
      if (!token) {
        return res.status(400).json({ message: "Token is required" });
      }
      
      const user = req.user;
      const twoFactorAuth = await storage.getTwoFactorAuthByUserId(user.id);
      
      if (!twoFactorAuth) {
        return res.status(404).json({ message: "Two-factor authentication not set up" });
      }
      
      const isValid = authenticator.verify({ 
        token, 
        secret: twoFactorAuth.secret 
      });
      
      if (!isValid) {
        return res.status(400).json({ message: "Invalid verification code" });
      }
      
      // Enable 2FA after successful verification
      await storage.updateTwoFactorAuth(twoFactorAuth.id, {
        enabled: true,
        lastVerified: new Date()
      });
      
      res.json({ 
        message: "Two-factor authentication enabled successfully",
        enabled: true
      });
    } catch (error: any) {
      console.error("2FA verification error:", error);
      res.status(500).json({ message: "Failed to verify two-factor authentication" });
    }
  });
  
  // Disable 2FA (requires current password)
  app.post("/api/security/2fa/disable", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    try {
      const { password } = req.body;
      if (!password) {
        return res.status(400).json({ message: "Current password is required" });
      }
      
      const user = req.user;
      
      // Verify password
      const isPasswordValid = await comparePasswords(password, user.password);
      if (!isPasswordValid) {
        return res.status(400).json({ message: "Incorrect password" });
      }
      
      // Check if 2FA exists
      const twoFactorAuth = await storage.getTwoFactorAuthByUserId(user.id);
      if (!twoFactorAuth) {
        return res.status(404).json({ message: "Two-factor authentication not set up" });
      }
      
      // Disable 2FA
      await storage.updateTwoFactorAuth(twoFactorAuth.id, {
        enabled: false
      });
      
      res.json({ 
        message: "Two-factor authentication disabled successfully",
        enabled: false
      });
    } catch (error: any) {
      console.error("2FA disable error:", error);
      res.status(500).json({ message: "Failed to disable two-factor authentication" });
    }
  });
  
  // Get 2FA status
  app.get("/api/security/2fa/status", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    try {
      const user = req.user;
      const twoFactorAuth = await storage.getTwoFactorAuthByUserId(user.id);
      
      if (!twoFactorAuth) {
        return res.json({ 
          enabled: false, 
          setup: false 
        });
      }
      
      res.json({ 
        enabled: !!twoFactorAuth.enabled, 
        setup: true,
        lastVerified: twoFactorAuth.lastVerified
      });
    } catch (error: any) {
      console.error("2FA status check error:", error);
      res.status(500).json({ message: "Failed to check two-factor authentication status" });
    }
  });
  
  // Verify 2FA with backup code
  app.post("/api/security/2fa/verify-backup", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    try {
      const { backupCode } = req.body;
      if (!backupCode) {
        return res.status(400).json({ message: "Backup code is required" });
      }
      
      const user = req.user;
      const twoFactorAuth = await storage.getTwoFactorAuthByUserId(user.id);
      
      if (!twoFactorAuth || !twoFactorAuth.backupCodes) {
        return res.status(404).json({ message: "Two-factor authentication not set up or no backup codes available" });
      }
      
      // Parse backup codes and verify
      const backupCodes = JSON.parse(twoFactorAuth.backupCodes);
      const normalizedCode = backupCode.trim().toUpperCase();
      
      if (!backupCodes.includes(normalizedCode)) {
        return res.status(400).json({ message: "Invalid backup code" });
      }
      
      // Remove used backup code
      const updatedBackupCodes = backupCodes.filter(code => code !== normalizedCode);
      
      // Update backup codes
      await storage.updateTwoFactorAuth(twoFactorAuth.id, {
        backupCodes: JSON.stringify(updatedBackupCodes),
        lastVerified: new Date()
      });
      
      res.json({ 
        message: "Backup code verified successfully",
        backupCodesRemaining: updatedBackupCodes.length
      });
    } catch (error: any) {
      console.error("2FA backup verification error:", error);
      res.status(500).json({ message: "Failed to verify backup code" });
    }
  });
  
  // Generate new backup codes (requires current password)
  app.post("/api/security/2fa/new-backup-codes", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    try {
      const { password } = req.body;
      if (!password) {
        return res.status(400).json({ message: "Current password is required" });
      }
      
      const user = req.user;
      
      // Verify password
      const isPasswordValid = await comparePasswords(password, user.password);
      if (!isPasswordValid) {
        return res.status(400).json({ message: "Incorrect password" });
      }
      
      // Check if 2FA exists
      const twoFactorAuth = await storage.getTwoFactorAuthByUserId(user.id);
      if (!twoFactorAuth) {
        return res.status(404).json({ message: "Two-factor authentication not set up" });
      }
      
      // Generate new backup codes
      const newBackupCodes = generateBackupCodes();
      
      // Update backup codes
      await storage.updateTwoFactorAuth(twoFactorAuth.id, {
        backupCodes: JSON.stringify(newBackupCodes)
      });
      
      res.json({ 
        message: "New backup codes generated successfully",
        backupCodes: newBackupCodes
      });
    } catch (error: any) {
      console.error("2FA new backup codes error:", error);
      res.status(500).json({ message: "Failed to generate new backup codes" });
    }
  });
  
  // Security Questions Routes
  
  // TODO: Complete implementation of these routes after extending the storage class
  /*
  // Get all available security questions
  app.get("/api/security/questions", async (req, res) => {
    try {
      const questions = await storage.getSecurityQuestions();
      res.json(questions);
    } catch (error: any) {
      console.error("Error fetching security questions:", error);
      res.status(500).json({ message: "Failed to fetch security questions" });
    }
  });
  
  // Get user's security questions
  app.get("/api/security/my-questions", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    try {
      const userId = req.user.id;
      const userQuestions = await storage.getUserSecurityQuestions(userId);
      
      // Return only question IDs to client, not answers
      const sanitizedQuestions = userQuestions.map(q => ({
        id: q.id,
        questionId: q.questionId,
        question: q.question
      }));
      
      res.json(sanitizedQuestions);
    } catch (error: any) {
      console.error("Error fetching user security questions:", error);
      res.status(500).json({ message: "Failed to fetch your security questions" });
    }
  });
  
  // Set user's security questions (requires password verification)
  app.post("/api/security/set-questions", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    try {
      const { password, questions } = req.body;
      
      // Validate input
      if (!password) {
        return res.status(400).json({ message: "Current password is required" });
      }
      
      if (!questions || !Array.isArray(questions) || questions.length < SECURITY.MIN_SECURITY_QUESTIONS) {
        return res.status(400).json({ 
          message: `At least ${SECURITY.MIN_SECURITY_QUESTIONS} security questions are required` 
        });
      }
      
      const user = req.user;
      
      // Verify password
      const isPasswordValid = await comparePasswords(password, user.password);
      if (!isPasswordValid) {
        return res.status(400).json({ message: "Incorrect password" });
      }
      
      // Validate each question and answer
      for (const q of questions) {
        if (!q.questionId || !q.answer || q.answer.length < SECURITY.ANSWER_MIN_LENGTH) {
          return res.status(400).json({ 
            message: `Each answer must be at least ${SECURITY.ANSWER_MIN_LENGTH} characters long` 
          });
        }
      }
      
      // Remove existing questions first
      // await storage.removeAllUserSecurityQuestions(user.id);
      
      // Insert new questions
      const questionPromises = questions.map(q => 
        storage.createUserSecurityQuestion({
          userId: user.id,
          questionId: q.questionId,
          answerHash: q.answer.toLowerCase().trim() // Normalize answers for easier comparison later
        })
      );
      
      await Promise.all(questionPromises);
      
      res.json({ 
        message: "Security questions updated successfully", 
        count: questions.length 
      });
    } catch (error: any) {
      console.error("Error setting security questions:", error);
      res.status(500).json({ message: "Failed to set security questions" });
    }
  });
  
  // Verify user's security answers (for account recovery)
  app.post("/api/security/verify-answers", async (req, res) => {
    try {
      const { username, questionAnswers } = req.body;
      
      if (!username || !questionAnswers || !Array.isArray(questionAnswers)) {
        return res.status(400).json({ message: "Username and answers are required" });
      }
      
      // Get user
      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Get user's security questions
      const userQuestions = await storage.getUserSecurityQuestions(user.id);
      if (!userQuestions || userQuestions.length === 0) {
        return res.status(404).json({ message: "No security questions found for this user" });
      }
      
      // Check if we have answers for all questions
      if (questionAnswers.length !== userQuestions.length) {
        return res.status(400).json({ message: "Please answer all security questions" });
      }
      
      // Verify each answer
      let correctAnswers = 0;
      for (const qa of questionAnswers) {
        const question = userQuestions.find(q => q.id === qa.questionId);
        if (question && question.answerHash === qa.answer.toLowerCase().trim()) {
          correctAnswers++;
        }
      }
      
      // All answers must be correct
      if (correctAnswers !== userQuestions.length) {
        return res.status(400).json({ message: "One or more security answers are incorrect" });
      }
      
      // Generate password reset token
      const resetToken = crypto.randomBytes(32).toString('hex');
      // await storage.createPasswordResetToken(user.id, resetToken);
      
      res.json({ 
        message: "Security questions verified successfully", 
        resetToken 
      });
    } catch (error: any) {
      console.error("Error verifying security answers:", error);
      res.status(500).json({ message: "Failed to verify security answers" });
    }
  });
  
  // Login Attempts and Account Lockout Routes
  
  // Get login attempts for the current user
  app.get("/api/security/login-attempts", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    try {
      const userId = req.user.id;
      // const attempts = await storage.getLoginAttemptsByUserId(userId);
      const attempts = await storage.getLoginAttempts();
      
      res.json(attempts);
    } catch (error: any) {
      console.error("Error fetching login attempts:", error);
      res.status(500).json({ message: "Failed to fetch login attempts" });
    }
  });
  
  // Get account lockout status for the current user
  app.get("/api/security/lockout-status", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    try {
      const userId = req.user.id;
      // const isLocked = await storage.isAccountLocked(userId);
      const isLocked = false; // TODO: Implement account lockout
      
      res.json({ 
        locked: isLocked,
        maxAttempts: SECURITY.MAX_LOGIN_ATTEMPTS,
        lockoutPeriod: SECURITY.LOCKOUT_PERIOD_MS
      });
    } catch (error: any) {
      console.error("Error checking lockout status:", error);
      res.status(500).json({ message: "Failed to check account lockout status" });
    }
  });
  
  // Session Management Routes
  
  // Get active sessions for the current user
  app.get("/api/security/active-sessions", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    try {
      const userId = req.user.id;
      // const sessions = await storage.getActiveSessionsByUserId(userId);
      
      // Sanitize session data to remove sensitive information
      const sanitizedSessions = [
        {
          id: 1,
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
          createdAt: new Date(),
          lastActive: new Date(),
          isCurrentSession: true
        }
      ];
      
      res.json(sanitizedSessions);
    } catch (error: any) {
      console.error("Error fetching active sessions:", error);
      res.status(500).json({ message: "Failed to fetch active sessions" });
    }
  });
  
  // Terminate a specific session
  app.delete("/api/security/sessions/:sessionId", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    try {
      const { sessionId } = req.params;
      const userId = req.user.id;
      
      // TODO: Implement session termination
      
      res.json({ message: "Session terminated successfully" });
    } catch (error: any) {
      console.error("Error terminating session:", error);
      res.status(500).json({ message: "Failed to terminate session" });
    }
  });
  
  // Terminate all other sessions except the current one
  app.post("/api/security/terminate-other-sessions", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    try {
      const userId = req.user.id;
      
      // TODO: Implement termination of all sessions
      
      res.json({ message: "All other sessions terminated successfully" });
    } catch (error: any) {
      console.error("Error terminating other sessions:", error);
      res.status(500).json({ message: "Failed to terminate other sessions" });
    }
  });
  
  // Admin security routes
  
  // Get all security questions (admin only)
  app.get("/api/admin/security/questions", requireAdmin, async (req, res) => {
    try {
      const questions = await storage.getSecurityQuestions();
      res.json(questions);
    } catch (error: any) {
      console.error("Error fetching security questions:", error);
      res.status(500).json({ message: "Failed to fetch security questions" });
    }
  });
  
  // Add a new security question (admin only)
  app.post("/api/admin/security/questions", requireAdmin, async (req, res) => {
    try {
      const { question } = req.body;
      
      if (!question) {
        return res.status(400).json({ message: "Question text is required" });
      }
      
      const newQuestion = await storage.createSecurityQuestion({ 
        question,
        isActive: true
      });
      
      res.status(201).json(newQuestion);
    } catch (error: any) {
      console.error("Error creating security question:", error);
      res.status(500).json({ message: "Failed to create security question" });
    }
  });
  
  // Update a security question (admin only)
  app.put("/api/admin/security/questions/:id", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { question, isActive } = req.body;
      
      if (!question && isActive === undefined) {
        return res.status(400).json({ message: "No updates provided" });
      }
      
      const updatedQuestion = await storage.updateSecurityQuestion(
        parseInt(id), 
        { question, isActive }
      );
      
      if (!updatedQuestion) {
        return res.status(404).json({ message: "Security question not found" });
      }
      
      res.json(updatedQuestion);
    } catch (error: any) {
      console.error("Error updating security question:", error);
      res.status(500).json({ message: "Failed to update security question" });
    }
  });
  
  // Delete a security question (admin only)
  app.delete("/api/admin/security/questions/:id", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      
      // Check if question is used by any user
      // const inUse = await storage.isSecurityQuestionInUse(parseInt(id));
      const inUse = false; // TODO: Implement check
      
      if (inUse) {
        return res.status(400).json({ 
          message: "Cannot delete question that is in use. Deactivate it instead."
        });
      }
      
      await storage.deleteSecurityQuestion(parseInt(id));
      
      res.json({ message: "Security question deleted successfully" });
    } catch (error: any) {
      console.error("Error deleting security question:", error);
      res.status(500).json({ message: "Failed to delete security question" });
    }
  });
  */
  
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
      // Sort plans by sortOrder field
      const sortedPlans = plans.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
      res.json(sortedPlans);
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
    // 1. Authentication check
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      // 2. Get and validate parameters
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ 
          message: "Invalid subscription ID", 
          details: "The subscription ID must be a valid number" 
        });
      }
      
      const userId = req.user?.id;
      if (!userId) {
        console.error('User ID not found in authenticated session');
        return res.status(401).json({ 
          message: "User information missing", 
          details: "Authentication validated but user ID is missing" 
        });
      }
      
      console.log(`Fetching subscription details for ID: ${id}, requested by user: ${userId}`);
      
      // 3. Get subscription with error handling
      try {
        const subscriptionWithPlan = await storage.getUserSubscriptionWithPlan(id);
        
        // 4. Check if subscription exists
        if (!subscriptionWithPlan) {
          return res.status(404).json({ 
            message: "Subscription not found",
            details: "The requested subscription does not exist"
          });
        }
        
        // 5. Security: Check if the subscription belongs to the logged-in user
        if (subscriptionWithPlan.subscription.userId !== userId) {
          console.warn(`Unauthorized attempt to access subscription: User ${userId} tried to access subscription ${id} belonging to user ${subscriptionWithPlan.subscription.userId}`);
          return res.status(403).json({ 
            message: "Forbidden",
            details: "You do not have permission to access this subscription"
          });
        }
        
        // 6. Return successful response
        return res.json(subscriptionWithPlan);
      } catch (dbError: any) {
        console.error(`Database error fetching subscription ${id}:`, dbError);
        return res.status(500).json({ 
          message: "Database error: " + dbError.message,
          details: "Failed to fetch subscription details from database"
        });
      }
    } catch (error: any) {
      // 7. Handle any uncaught errors
      console.error('Uncaught error in subscription fetch:', error);
      return res.status(500).json({ 
        message: "Error fetching subscription: " + error.message,
        details: "An unexpected error occurred while processing your request"
      });
    }
  });
  
  // Update Twitch channel for subscription
  app.put("/api/user-subscriptions/:id/twitch-channel", async (req, res) => {
    // 1. Authentication check
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      // 2. Get and validate parameters
      const subscriptionId = parseInt(req.params.id);
      if (isNaN(subscriptionId)) {
        return res.status(400).json({ 
          message: "Invalid subscription ID", 
          details: "The subscription ID must be a valid number" 
        });
      }
      
      const userId = req.user?.id;
      if (!userId) {
        console.error('User ID not found in authenticated session');
        return res.status(401).json({ 
          message: "User information missing", 
          details: "Authentication validated but user ID is missing" 
        });
      }
      
      // 3. Validate request data
      const { twitchChannel } = req.body;
      if (!twitchChannel) {
        return res.status(400).json({ 
          message: "Twitch channel is required",
          details: "You must provide a valid Twitch channel name"
        });
      }
      
      console.log(`Updating Twitch channel for subscription ID: ${subscriptionId}, user: ${userId}, new channel: ${twitchChannel}`);
      
      // 4. Get subscription with error handling
      try {
        // Get the subscription to verify ownership
        const subscription = await storage.getUserSubscriptionWithPlan(subscriptionId);
        
        // 5. Check if subscription exists
        if (!subscription) {
          return res.status(404).json({ 
            message: "Subscription not found",
            details: "The requested subscription does not exist"
          });
        }
        
        // 6. Security: Check if the subscription belongs to the logged-in user
        if (subscription.subscription.userId !== userId) {
          console.warn(`Unauthorized attempt to update subscription: User ${userId} tried to update subscription ${subscriptionId} belonging to user ${subscription.subscription.userId}`);
          return res.status(403).json({ 
            message: "Forbidden",
            details: "You do not have permission to update this subscription"
          });
        }
        
        // 7. Update the subscription with proper error handling
        try {
          const updated = await storage.updateSubscriptionTwitchChannel(subscriptionId, twitchChannel);
          
          if (!updated) {
            return res.status(500).json({ 
              message: "Failed to update Twitch channel",
              details: "The database operation did not return an updated subscription"
            });
          }
          
          // 8. Return successful response
          return res.json(updated);
        } catch (updateError: any) {
          console.error(`Database error updating Twitch channel for subscription ${subscriptionId}:`, updateError);
          return res.status(500).json({ 
            message: "Database error: " + updateError.message,
            details: "Failed to update Twitch channel in database"
          });
        }
      } catch (fetchError: any) {
        console.error(`Database error fetching subscription ${subscriptionId}:`, fetchError);
        return res.status(500).json({ 
          message: "Database error: " + fetchError.message,
          details: "Failed to fetch subscription details from database"
        });
      }
    } catch (error: any) {
      // 9. Handle any uncaught errors
      console.error('Uncaught error in Twitch channel update:', error);
      return res.status(500).json({ 
        message: "Error updating Twitch channel: " + error.message,
        details: "An unexpected error occurred while processing your request"
      });
    }
  });
  
  // Toggle subscription activation
  app.put("/api/user-subscriptions/:id/toggle", async (req, res) => {
    // 1. Authentication check
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      // 2. Get and validate parameters
      const subscriptionId = parseInt(req.params.id);
      if (isNaN(subscriptionId)) {
        return res.status(400).json({ 
          message: "Invalid subscription ID", 
          details: "The subscription ID must be a valid number" 
        });
      }
      
      const userId = req.user?.id;
      if (!userId) {
        console.error('User ID not found in authenticated session');
        return res.status(401).json({ 
          message: "User information missing", 
          details: "Authentication validated but user ID is missing" 
        });
      }
      
      // 3. Validate request data
      const { isActive } = req.body;
      if (isActive === undefined) {
        return res.status(400).json({ 
          message: "Active status is required",
          details: "You must specify whether the subscription should be active or not"
        });
      }
      
      console.log(`Toggling subscription status for ID: ${subscriptionId}, user: ${userId}, new status: ${isActive ? 'active' : 'inactive'}`);
      
      // 4. Get subscription with error handling
      try {
        // Get the subscription to verify ownership
        const subscription = await storage.getUserSubscriptionWithPlan(subscriptionId);
        
        // 5. Check if subscription exists
        if (!subscription) {
          return res.status(404).json({ 
            message: "Subscription not found",
            details: "The requested subscription does not exist"
          });
        }
        
        // 6. Security: Check if the subscription belongs to the logged-in user
        if (subscription.subscription.userId !== userId) {
          console.warn(`Unauthorized attempt to toggle subscription: User ${userId} tried to toggle subscription ${subscriptionId} belonging to user ${subscription.subscription.userId}`);
          return res.status(403).json({ 
            message: "Forbidden",
            details: "You do not have permission to update this subscription"
          });
        }
        
        // 7. Business rules: Check if the channel is set
        if (isActive && !subscription.subscription.twitchChannel) {
          return res.status(400).json({ 
            message: "Twitch channel required",
            details: "You must set a Twitch channel before activating this subscription"
          });
        }
        
        // 8. Toggle subscription with proper error handling
        try {
          const updated = await storage.toggleSubscriptionStatus(subscriptionId, isActive);
          
          if (!updated) {
            return res.status(500).json({ 
              message: "Failed to toggle subscription status",
              details: "The database operation did not return an updated subscription"
            });
          }
          
          // 9. Return successful response
          return res.json(updated);
        } catch (updateError: any) {
          console.error(`Database error toggling subscription ${subscriptionId}:`, updateError);
          return res.status(500).json({ 
            message: "Database error: " + updateError.message,
            details: "Failed to update subscription status in database"
          });
        }
      } catch (fetchError: any) {
        console.error(`Database error fetching subscription ${subscriptionId}:`, fetchError);
        return res.status(500).json({ 
          message: "Database error: " + fetchError.message,
          details: "Failed to fetch subscription details from database"
        });
      }
    } catch (error: any) {
      // 10. Handle any uncaught errors
      console.error('Uncaught error in subscription toggle:', error);
      return res.status(500).json({ 
        message: "Error toggling subscription: " + error.message,
        details: "An unexpected error occurred while processing your request"
      });
    }
  });
  
  // Update Viewer Settings
  app.put("/api/user-subscriptions/:id/viewer-settings", async (req, res) => {
    // 1. Authentication check
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      // 2. Get and validate parameters
      const subscriptionId = parseInt(req.params.id);
      if (isNaN(subscriptionId)) {
        return res.status(400).json({ 
          message: "Invalid subscription ID", 
          details: "The subscription ID must be a valid number" 
        });
      }
      
      const userId = req.user?.id;
      if (!userId) {
        console.error('User ID not found in authenticated session');
        return res.status(401).json({ 
          message: "User information missing", 
          details: "Authentication validated but user ID is missing" 
        });
      }
      
      // 3. Validate request data
      const { settings } = req.body;
      if (!settings) {
        return res.status(400).json({ 
          message: "Settings data is required",
          details: "You must provide viewer settings to update"
        });
      }
      
      console.log(`Updating viewer settings for subscription ID: ${subscriptionId}, user: ${userId}`);
      
      // 4. Get subscription with error handling
      try {
        // Get the subscription to verify ownership
        const subscription = await storage.getUserSubscriptionWithPlan(subscriptionId);
        
        // 5. Check if subscription exists
        if (!subscription) {
          return res.status(404).json({ 
            message: "Subscription not found",
            details: "The requested subscription does not exist"
          });
        }
        
        // 6. Security: Check if the subscription belongs to the logged-in user
        if (subscription.subscription.userId !== userId) {
          console.warn(`Unauthorized attempt to update viewer settings: User ${userId} tried to update subscription ${subscriptionId} belonging to user ${subscription.subscription.userId}`);
          return res.status(403).json({ 
            message: "Forbidden",
            details: "You do not have permission to update this subscription"
          });
        }
        
        // 7. Validate settings schema
        try {
          const settingsSchema = z.object({
            viewerCount: z.number().min(1).max(subscription.plan.viewerCount),
            chatMode: z.enum(["quiet", "moderate", "active"]),
            autoMessages: z.boolean(),
            customMessages: z.array(z.string()).optional(),
          });
          
          try {
            const parsedSettings = typeof settings === 'string' ? JSON.parse(settings) : settings;
            settingsSchema.parse(parsedSettings);
          } catch (validationError: any) {
            console.error('Settings validation error:', validationError);
            return res.status(400).json({ 
              message: "Invalid settings format", 
              error: validationError.errors || validationError.message,
              details: "The provided settings do not match the required format"
            });
          }
          
          // 8. Update the settings with proper error handling
          try {
            // Ensure settings is a string for storage
            const settingsString = typeof settings === 'string' 
              ? settings 
              : JSON.stringify(settings);
              
            const updated = await storage.updateViewerSettings(subscriptionId, settingsString);
            
            if (!updated) {
              return res.status(500).json({ 
                message: "Failed to update viewer settings",
                details: "The database operation did not return an updated subscription"
              });
            }
            
            // 9. Return successful response
            return res.json(updated);
          } catch (updateError: any) {
            console.error(`Database error updating viewer settings for subscription ${subscriptionId}:`, updateError);
            return res.status(500).json({ 
              message: "Database error: " + updateError.message,
              details: "Failed to update viewer settings in database"
            });
          }
        } catch (schemaError: any) {
          console.error('Error creating validation schema:', schemaError);
          return res.status(500).json({ 
            message: "Server error processing validation", 
            details: "An error occurred while validating your settings"
          });
        }
      } catch (fetchError: any) {
        console.error(`Database error fetching subscription ${subscriptionId}:`, fetchError);
        return res.status(500).json({ 
          message: "Database error: " + fetchError.message,
          details: "Failed to fetch subscription details from database"
        });
      }
    } catch (error: any) {
      // 10. Handle any uncaught errors
      console.error('Uncaught error in viewer settings update:', error);
      return res.status(500).json({ 
        message: "Error updating viewer settings: " + error.message,
        details: "An unexpected error occurred while processing your request"
      });
    }
  });
  
  // Update Chat Settings
  app.put("/api/user-subscriptions/:id/chat-settings", async (req, res) => {
    // 1. Authentication check
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      // 2. Get and validate parameters
      const subscriptionId = parseInt(req.params.id);
      if (isNaN(subscriptionId)) {
        return res.status(400).json({ 
          message: "Invalid subscription ID", 
          details: "The subscription ID must be a valid number" 
        });
      }
      
      const userId = req.user?.id;
      if (!userId) {
        console.error('User ID not found in authenticated session');
        return res.status(401).json({ 
          message: "User information missing", 
          details: "Authentication validated but user ID is missing" 
        });
      }
      
      // 3. Validate request data
      const { settings } = req.body;
      if (!settings) {
        return res.status(400).json({ 
          message: "Settings data is required",
          details: "You must provide chat settings to update"
        });
      }
      
      console.log(`Updating chat settings for subscription ID: ${subscriptionId}, user: ${userId}`);
      
      // 4. Get subscription with error handling
      try {
        // Get the subscription to verify ownership
        const subscription = await storage.getUserSubscriptionWithPlan(subscriptionId);
        
        // 5. Check if subscription exists
        if (!subscription) {
          return res.status(404).json({ 
            message: "Subscription not found",
            details: "The requested subscription does not exist"
          });
        }
        
        // 6. Security: Check if the subscription belongs to the logged-in user
        if (subscription.subscription.userId !== userId) {
          console.warn(`Unauthorized attempt to update chat settings: User ${userId} tried to update subscription ${subscriptionId} belonging to user ${subscription.subscription.userId}`);
          return res.status(403).json({ 
            message: "Forbidden",
            details: "You do not have permission to update this subscription"
          });
        }
        
        // 7. Validate settings schema
        try {
          const settingsSchema = z.object({
            chatCount: z.number().min(1).max(subscription.plan.chatCount),
            messageFrequency: z.enum(["low", "medium", "high"]),
            autoRespond: z.boolean(),
            chatBotNames: z.array(z.string()).optional(),
            customResponses: z.record(z.string(), z.string()).optional(),
          });
          
          try {
            const parsedSettings = typeof settings === 'string' ? JSON.parse(settings) : settings;
            settingsSchema.parse(parsedSettings);
          } catch (validationError: any) {
            console.error('Chat settings validation error:', validationError);
            return res.status(400).json({ 
              message: "Invalid settings format", 
              error: validationError.errors || validationError.message,
              details: "The provided settings do not match the required format"
            });
          }
          
          // 8. Update the settings with proper error handling
          try {
            // Ensure settings is a string for storage
            const settingsString = typeof settings === 'string' 
              ? settings 
              : JSON.stringify(settings);
              
            const updated = await storage.updateChatSettings(subscriptionId, settingsString);
            
            if (!updated) {
              return res.status(500).json({ 
                message: "Failed to update chat settings",
                details: "The database operation did not return an updated subscription"
              });
            }
            
            // 9. Return successful response
            return res.json(updated);
          } catch (updateError: any) {
            console.error(`Database error updating chat settings for subscription ${subscriptionId}:`, updateError);
            return res.status(500).json({ 
              message: "Database error: " + updateError.message,
              details: "Failed to update chat settings in database"
            });
          }
        } catch (schemaError: any) {
          console.error('Error creating validation schema:', schemaError);
          return res.status(500).json({ 
            message: "Server error processing validation", 
            details: "An error occurred while validating your settings"
          });
        }
      } catch (fetchError: any) {
        console.error(`Database error fetching subscription ${subscriptionId}:`, fetchError);
        return res.status(500).json({ 
          message: "Database error: " + fetchError.message,
          details: "Failed to fetch subscription details from database"
        });
      }
    } catch (error: any) {
      // 10. Handle any uncaught errors
      console.error('Uncaught error in chat settings update:', error);
      return res.status(500).json({ 
        message: "Error updating chat settings: " + error.message,
        details: "An unexpected error occurred while processing your request"
      });
    }
  });
  
  // Update Follower Settings
  app.put("/api/user-subscriptions/:id/follower-settings", async (req, res) => {
    // 1. Authentication check
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      // 2. Get and validate parameters
      const subscriptionId = parseInt(req.params.id);
      if (isNaN(subscriptionId)) {
        return res.status(400).json({ 
          message: "Invalid subscription ID", 
          details: "The subscription ID must be a valid number" 
        });
      }
      
      const userId = req.user?.id;
      if (!userId) {
        console.error('User ID not found in authenticated session');
        return res.status(401).json({ 
          message: "User information missing", 
          details: "Authentication validated but user ID is missing" 
        });
      }
      
      // 3. Validate request data
      const { settings } = req.body;
      if (!settings) {
        return res.status(400).json({ 
          message: "Settings data is required",
          details: "You must provide follower settings to update"
        });
      }
      
      console.log(`Updating follower settings for subscription ID: ${subscriptionId}, user: ${userId}`);
      
      // 4. Get subscription with error handling
      try {
        // Get the subscription to verify ownership
        const subscription = await storage.getUserSubscriptionWithPlan(subscriptionId);
        
        // 5. Check if subscription exists
        if (!subscription) {
          return res.status(404).json({ 
            message: "Subscription not found",
            details: "The requested subscription does not exist"
          });
        }
        
        // 6. Security: Check if the subscription belongs to the logged-in user
        if (subscription.subscription.userId !== userId) {
          console.warn(`Unauthorized attempt to update follower settings: User ${userId} tried to update subscription ${subscriptionId} belonging to user ${subscription.subscription.userId}`);
          return res.status(403).json({ 
            message: "Forbidden",
            details: "You do not have permission to update this subscription"
          });
        }
        
        // 7. Validate settings schema
        try {
          const settingsSchema = z.object({
            followerCount: z.number().min(1).max(subscription.plan.followerCount),
            deliverySpeed: z.enum(["slow", "normal", "fast"]),
            scheduleDelivery: z.boolean(),
            scheduleTime: z.string().optional(),
          });
          
          try {
            const parsedSettings = typeof settings === 'string' ? JSON.parse(settings) : settings;
            settingsSchema.parse(parsedSettings);
          } catch (validationError: any) {
            console.error('Follower settings validation error:', validationError);
            return res.status(400).json({ 
              message: "Invalid settings format", 
              error: validationError.errors || validationError.message,
              details: "The provided settings do not match the required format"
            });
          }
          
          // 8. Update the settings with proper error handling
          try {
            // Ensure settings is a string for storage
            const settingsString = typeof settings === 'string' 
              ? settings 
              : JSON.stringify(settings);
              
            const updated = await storage.updateFollowerSettings(subscriptionId, settingsString);
            
            if (!updated) {
              return res.status(500).json({ 
                message: "Failed to update follower settings",
                details: "The database operation did not return an updated subscription"
              });
            }
            
            // 9. Return successful response
            return res.json(updated);
          } catch (updateError: any) {
            console.error(`Database error updating follower settings for subscription ${subscriptionId}:`, updateError);
            return res.status(500).json({ 
              message: "Database error: " + updateError.message,
              details: "Failed to update follower settings in database"
            });
          }
        } catch (schemaError: any) {
          console.error('Error creating validation schema:', schemaError);
          return res.status(500).json({ 
            message: "Server error processing validation", 
            details: "An error occurred while validating your settings"
          });
        }
      } catch (fetchError: any) {
        console.error(`Database error fetching subscription ${subscriptionId}:`, fetchError);
        return res.status(500).json({ 
          message: "Database error: " + fetchError.message,
          details: "Failed to fetch subscription details from database"
        });
      }
    } catch (error: any) {
      // 10. Handle any uncaught errors
      console.error('Uncaught error in follower settings update:', error);
      return res.status(500).json({ 
        message: "Error updating follower settings: " + error.message,
        details: "An unexpected error occurred while processing your request"
      });
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

  // Stripe payment route for subscription payments
  app.post("/api/create-payment-intent", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const stripe = getStripe();
    if (!stripe) {
      return res.status(500).json({ 
        message: "Stripe is not configured. Card payments are not available at this time.",
        error: "stripe_not_configured"
      });
    }

    try {
      const { planId, subscriptionPlan } = req.body;
      
      // Check if this is a subscription payment
      if (planId && subscriptionPlan) {
        try {
          // Get the plan details
          const plan = await storage.getSubscriptionPlan(Number(planId));
          
          if (!plan) {
            return res.status(404).json({ message: "Subscription plan not found" });
          }

          if (!req.user.email) {
            return res.status(400).json({ message: 'No user email on file' });
          }

          // Create or use existing Stripe customer
          let customerId = req.user.stripeCustomerId;
          
          if (!customerId) {
            const customer = await stripe.customers.create({
              email: req.user.email,
              name: req.user.username,
            });
            
            customerId = customer.id;
            await storage.updateStripeCustomerId(req.user.id, customerId);
          }
          
          // Create a payment intent for the subscription
          const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(plan.price * 100), // convert to cents
            currency: 'usd',
            customer: customerId,
            description: `Payment for ${plan.name} subscription`,
            metadata: {
              plan_id: planId.toString(),
              user_id: req.user.id.toString(),
              subscription_payment: 'true'
            },
          });
          
          console.log(`Created payment intent ${paymentIntent.id} for plan ${planId} for user ${req.user.id}`);
          
          // Create a payment record
          await storage.createPayment({
            userId: req.user.id,
            amount: Math.round(plan.price * 100),
            currency: "usd",
            status: "pending",
            paymentMethod: "stripe",
            stripePaymentIntentId: paymentIntent.id,
            metadata: JSON.stringify({
              planId: Number(planId),
              planName: plan.name
            })
          });
          
          // Return the client secret to the client
          return res.json({
            clientSecret: paymentIntent.client_secret,
            paymentIntentId: paymentIntent.id
          });
        } catch (error) {
          console.error("Error creating subscription payment intent:", error);
          return res.status(500).json({ 
            message: "Failed to create payment: " + (error instanceof Error ? error.message : String(error)),
            error: error instanceof Error ? error.message : String(error)
          });
        }
      }
      // For direct amount payments (not subscriptions)
      else if (req.body.amount) {
        const amount = req.body.amount;
        
        if (amount <= 0) {
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

        return res.json({ clientSecret: paymentIntent.client_secret });
      } 
      else {
        return res.status(400).json({ 
          message: "Required parameters are missing. For subscription payments, 'planId' and 'subscriptionPlan=true' are required. For one-time payments, 'amount' is required.",
          error: "missing_parameters"
        });
      }
    } catch (error: any) {
      console.error("Error creating payment intent:", error);
      res.status(500).json({ message: "Error creating payment intent: " + error.message });
    }
  });
  
  // Dedicated endpoint for subscription payments
  app.post("/api/create-subscription-payment", async (req, res) => {
    console.log("Create subscription payment request received:", req.body);
    console.log("Session information:", req.session?.id);
    console.log("User authenticated:", req.isAuthenticated());
    
    if (!req.isAuthenticated()) {
      console.log("User not authenticated, returning 401");
      return res
        .status(401)
        .contentType('application/json')
        .send({ message: "Unauthorized", error: "not_authenticated", success: false });
    }
    
    const stripe = getStripe();
    if (!stripe) {
      return res.status(500).json({ 
        message: "Stripe is not configured. Card payments are not available at this time.",
        error: "stripe_not_configured"
      });
    }
    
    try {
      const { planId } = req.body;
      
      if (!planId) {
        return res.status(400).json({ message: "Plan ID is required" });
      }
      
      // Get the plan details
      const plan = await storage.getSubscriptionPlan(Number(planId));
      
      if (!plan) {
        return res.status(404).json({ message: "Subscription plan not found" });
      }

      if (!req.user.email) {
        return res.status(400).json({ message: 'No user email on file' });
      }

      // Create or use existing Stripe customer
      let customerId = req.user.stripeCustomerId;
      
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: req.user.email,
          name: req.user.username,
        });
        
        customerId = customer.id;
        await storage.updateStripeCustomerId(req.user.id, customerId);
      }
      
      // Create a payment intent for the subscription
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(plan.price * 100), // convert to cents
        currency: 'usd',
        customer: customerId,
        description: `Payment for ${plan.name} subscription`,
        metadata: {
          plan_id: planId.toString(),
          user_id: req.user.id.toString(),
          subscription_payment: 'true'
        },
      });
      
      console.log(`Created payment intent ${paymentIntent.id} for plan ${planId} for user ${req.user.id}`);
      
      // Create a payment record
      await storage.createPayment({
        userId: req.user.id,
        amount: Math.round(plan.price * 100),
        currency: "usd",
        status: "pending",
        paymentMethod: "stripe",
        stripePaymentIntentId: paymentIntent.id,
        metadata: JSON.stringify({
          planId: Number(planId),
          planName: plan.name
        })
      });
      
      // Ensure proper JSON response with explicit content type
      return res
        .status(200)
        .contentType('application/json')
        .json({
          clientSecret: paymentIntent.client_secret,
          paymentIntentId: paymentIntent.id,
          success: true
        });
    } catch (error: any) {
      console.error("Error creating subscription payment:", error);
      return res
        .status(500)
        .contentType('application/json')
        .json({ 
          message: "Failed to create payment: " + error.message,
          error: error.message,
          success: false
        });
    }
  });

  // Subscription creation
  app.post('/api/get-or-create-subscription', async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    let user = req.user;
    const { planId, paymentMethod = 'card' } = req.body;
    
    if (!planId) {
      return res.status(400).json({ message: "Plan ID is required" });
    }
    
    const plan = await storage.getSubscriptionPlan(parseInt(planId));
    
    if (!plan) {
      return res.status(404).json({ message: "Subscription plan not found" });
    }
    
    // If using cryptocurrency payment method
    if (paymentMethod === 'crypto') {
      try {
        const coinpaymentsEnabled = await storage.getSystemConfigByKey('coinpayments_enabled');
        if (!coinpaymentsEnabled || coinpaymentsEnabled.value !== 'true') {
          return res.status(400).json({ message: "Cryptocurrency payments are not enabled" });
        }
        
        // Generate a unique transaction identifier
        const transactionId = `CP-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        
        // Create pending subscription for crypto payment
        const now = new Date();
        const endDate = new Date();
        endDate.setMonth(endDate.getMonth() + 1);
        
        await storage.createUserSubscription({
          userId: user.id,
          planId: plan.id,
          status: 'pending',
          startDate: now,
          endDate: endDate,
          paymentMethod: 'crypto',
          paymentReference: transactionId,
          price: plan.price,
          recurring: false,
        });
        
        // Get accepted cryptocurrencies 
        const acceptedCoins = await storage.getSystemConfigByKey('coinpayments_accepted_coins');
        const acceptedCoinsList = acceptedCoins ? acceptedCoins.value.split(',') : ['BTC'];
        
        // Log an audit
        await storage.createAuditLog({
          userId: user.id,
          action: 'crypto_payment_initiated',
          details: JSON.stringify({
            planId: plan.id,
            planName: plan.name,
            transactionId,
            paymentMethod: 'crypto',
          }),
        });

        // Return crypto payment details
        return res.json({
          paymentMethod: 'crypto',
          transactionId,
          acceptedCoins: acceptedCoinsList,
          amount: plan.price,
          status: 'pending'
        });
      } catch (error) {
        console.error("Error creating crypto payment:", error);
        return res.status(500).json({ message: "Error setting up cryptocurrency payment" });
      }
    }

    // For card payment, check if Stripe is configured
    if (paymentMethod === 'card') {
      if (!stripe) {
        return res.status(500).json({ 
          message: "Stripe is not configured. Card payments are not available at this time.",
          error: "stripe_not_configured"
        });
      }

      // If user already has a subscription
      if (user.stripeSubscriptionId) {
        try {
          const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);

          res.json({
            paymentMethod: 'card',
            subscriptionId: subscription.id,
            clientSecret: subscription.latest_invoice?.payment_intent?.client_secret,
          });
          return;
        } catch (error) {
          // If there was an error retrieving the subscription, continue to create a new one
          console.error("Error retrieving subscription:", error);
        }
      }
    }
    
    if (!user.email) {
      return res.status(400).json({ message: 'No user email on file' });
    }

    try {
      
      // If payment method is card, we need a valid Stripe price ID
      const stripePriceId = plan.stripePriceId;
      if (paymentMethod === 'card' && !stripePriceId) {
        return res.status(400).json({ 
          message: "This plan does not support credit card payments. Please contact an administrator to set up Stripe pricing.",
          error: "missing_stripe_price_id"
        });
      }

      // Create or use existing Stripe customer
      let customerId = user.stripeCustomerId;
      
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: user.email,
          name: user.username,
        });
        
        customerId = customer.id;
        await storage.updateStripeCustomerId(user.id, customerId);
      }

      try {
        // Make sure stripe is initialized
        if (!stripe) {
          return res.status(500).json({ 
            message: "Stripe is not configured. Card payments are not available at this time.",
            error: "stripe_not_configured"
          });
        }
        
        // Get the actual Stripe price ID from the system config if it's using a placeholder
        let actualPriceId = stripePriceId;
        
        // Verify the price exists in Stripe
        try {
          // Try to retrieve the price from Stripe to validate it exists
          if (actualPriceId) {
            await stripe.prices.retrieve(actualPriceId);
          } else {
            throw new Error("No price ID provided");
          }
        } catch (priceError: any) {
          console.error(`Stripe price validation error: ${priceError.message}`, priceError);
          return res.status(400).json({ 
            message: "The payment system is not properly configured for this plan. Please contact an administrator.",
            error: "invalid_stripe_price",
            details: priceError.message
          });
        }
        
        // Create subscription with Stripe - handle expanding properly
        // First create the subscription
        const subscription = await stripe.subscriptions.create({
          customer: customerId,
          items: [{
            price: actualPriceId,
          }],
          payment_behavior: 'default_incomplete',
          // Do not expand here as it causes issues with older Stripe API versions
          expand: ['latest_invoice'],
        });
        
        // If we have an invoice, fetch the payment intent separately
        let paymentIntent = null;
        if (subscription.latest_invoice && typeof subscription.latest_invoice !== 'string') {
          try {
            // Get the payment intent ID from the invoice
            const invoice = await stripe.invoices.retrieve(subscription.latest_invoice.id, {
              expand: ['payment_intent']
            });
            if (invoice.payment_intent && typeof invoice.payment_intent !== 'string') {
              paymentIntent = invoice.payment_intent;
            }
          } catch (err) {
            console.error("Error retrieving payment intent from invoice:", err);
          }
        }

        // Update user with subscription info
        await storage.updateUserStripeInfo(user.id, customerId, subscription.id);
        
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
        
        // Make sure we properly handle the potential nulls/undefined in the response
        let clientSecret = null;
        
        // First try to get from our separate payment intent fetch
        if (paymentIntent && typeof paymentIntent !== 'string' && paymentIntent.client_secret) {
          clientSecret = paymentIntent.client_secret;
          console.log("Got client secret from separately fetched payment intent");
        }
        // Fall back to subscription.latest_invoice.payment_intent if available (for older Stripe API versions)
        else if (subscription.latest_invoice && 
            typeof subscription.latest_invoice !== 'string' && 
            subscription.latest_invoice.payment_intent && 
            typeof subscription.latest_invoice.payment_intent !== 'string') {
          clientSecret = subscription.latest_invoice.payment_intent.client_secret;
          console.log("Got client secret from subscription.latest_invoice.payment_intent");
        }
        
        // If still no client secret, try to create a payment intent manually
        if (!clientSecret) {
          try {
            console.log("No client secret found. Creating a new payment intent manually...");
            
            // Create a payment intent manually
            const newPaymentIntent = await stripe.paymentIntents.create({
              amount: Math.round(plan.price * 100), // convert to cents
              currency: 'usd',
              customer: customerId,
              description: `Subscription for ${plan.name}`,
              setup_future_usage: 'off_session',
              metadata: {
                subscription_id: subscription.id,
                plan_id: plan.id.toString(),
              },
            });
            
            clientSecret = newPaymentIntent.client_secret;
            console.log("Successfully created new payment intent with client secret");
          } catch (paymentError) {
            console.error("Failed to create payment intent:", paymentError);
            // Continue and return what we have - the client will show an error
          }
        }
        
        // Even if we couldn't get a client secret, return the subscription ID
        // This will let the client show an appropriate error
        
        res.json({
          paymentMethod: 'card',
          subscriptionId: subscription.id,
          clientSecret: clientSecret,
        });
      } catch (stripeError) {
        console.error("Stripe subscription creation error:", stripeError);
        throw new Error(`Stripe Error: ${stripeError instanceof Error ? stripeError.message : 'Unknown error'}`);
      }
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

  // Password reset endpoint - TEMPORARY, REMOVE IN PRODUCTION
  app.post("/api/reset-admin-password", async (req, res) => {
    try {
      // Reset admin user password to "admin123"
      const adminUser = await storage.getUserByUsername("admin");
      
      if (!adminUser) {
        return res.status(404).json({ message: "Admin user not found" });
      }
      
      const hashedPassword = await hashPassword("admin123");
      
      await db.update(users)
        .set({ password: hashedPassword })
        .where(eq(users.id, adminUser.id));
      
      console.log("Admin password has been reset");
      
      res.status(200).json({ message: "Admin password has been reset to 'admin123'" });
    } catch (error) {
      console.error("Error resetting admin password:", error);
      res.status(500).json({ message: "Error resetting admin password" });
    }
  });
  
  // Admin API routes
  // Admin middleware to check admin permissions
  const isAdmin = (req: Request, res: Response, next: NextFunction) => {
    console.log("Admin middleware check - isAuthenticated:", req.isAuthenticated());
    
    if (!req.isAuthenticated()) {
      console.log("Admin access denied - not authenticated");
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    console.log("User role check:", req.user.role);
    
    if (req.user.role !== "admin") {
      console.log("Admin access denied - not an admin user");
      return res.status(403).json({ message: "Forbidden - Admin access required" });
    }
    
    console.log("Admin access granted for user:", req.user.username);
    next();
  };

  // Admin User Management APIs
  app.get("/api/admin/users", isAdmin, async (req, res) => {
    try {
      const allUsers = await db.query.users.findMany();
      res.json(allUsers);
    } catch (error: any) {
      res.status(500).json({ message: "Error fetching users: " + error.message });
    }
  });
  
  // Admin user creation endpoint
  app.post("/api/admin/users", isAdmin, async (req, res) => {
    try {
      // Validate the user data
      const userSchema = z.object({
        username: z.string().min(3),
        email: z.string().email(),
        password: z.string().min(8),
        role: z.enum(["user", "admin"]).default("user")
      });
      
      const validatedData = userSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByUsername(validatedData.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }
      
      const existingEmail = await storage.getUserByEmail(validatedData.email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email already in use" });
      }
      
      // Hash the password
      const hashedPassword = await hashPassword(validatedData.password);
      
      // Create the user with admin-specified role
      const user = await storage.createUser({
        ...validatedData,
        password: hashedPassword,
        isEmailVerified: true // Admins create pre-verified users
      });
      
      // Remove sensitive data before sending response
      const { password, ...userWithoutPassword } = user;
      
      res.status(201).json(userWithoutPassword);
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
      res.status(500).json({ message: "Error creating user: " + error.message });
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
      let userSubscriptions = await storage.getUserSubscriptions(userId);
      
      // Filtre: Yalnızca aktif ve "cancelled" olmayan abonelikleri göster
      // Veya status parametresi ile tüm abonelikler istenirse, hepsini göster
      if (req.query.includeAll !== 'true') {
        userSubscriptions = userSubscriptions.filter(sub => 
          sub.status !== 'cancelled' || sub.isActive === true
        );
      }
      
      const userPayments = await storage.getUserPayments(userId);
      
      // Enrich subscriptions with plan information
      const enrichedSubscriptions = await Promise.all(
        userSubscriptions.map(async (subscription) => {
          // Get the plan for this subscription
          const plan = await storage.getSubscriptionPlan(subscription.planId);
          
          return {
            ...subscription,
            planName: plan ? plan.name : "Unknown Plan",
            planPrice: plan ? plan.price : 0,
            planExists: !!plan,
            currentPrice: subscription.currentPrice || (plan ? plan.price : 0)
          };
        })
      );
      
      // JSON string alanlarını JavaScript nesnelerine dönüştür
      // Function to safely parse JSON
      const safeParseJSON = (jsonString: string | null) => {
        if (!jsonString) return null;
        try {
          return JSON.parse(jsonString);
        } catch (error) {
          console.error('Error parsing JSON:', error);
          return null;
        }
      };
      
      const processedUser = {
        ...user,
        profileData: safeParseJSON(user.profileData),
        securitySettings: safeParseJSON(user.securitySettings),
        notificationPreferences: safeParseJSON(user.notificationPreferences),
        billingInfo: safeParseJSON(user.billingInfo)
      };

      // Create comprehensive user profile
      const userProfile = {
        ...processedUser,
        subscriptions: enrichedSubscriptions,
        payments: userPayments
      };
      
      res.json(userProfile);
    } catch (error: any) {
      res.status(500).json({ message: "Error fetching user details: " + error.message });
    }
  });
  
  // Admin API: Assign subscription plan to user
  app.post("/api/admin/users/:id/subscriptions", isAdmin, async (req, res) => {
    try {
      // 1. Validate user existence
      const userId = parseInt(req.params.id);
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // 2. Validate request data
      const { 
        planId, 
        twitchChannel = null, 
        geographicTargeting = null, 
        status = "active", 
        paymentStatus,
        startDate: startDateString, 
        endDate: endDateString,
        discountPercentage = 0
      } = req.body;
      
      if (!planId) {
        return res.status(400).json({ message: "Plan ID is required" });
      }
      
      // 3. Validate plan existence
      const plan = await storage.getSubscriptionPlan(Number(planId));
      if (!plan) {
        return res.status(400).json({ message: "Subscription plan not found" });
      }
      
      // 4. Prepare dates and data
      // Parse dates from client or use defaults
      const startDate = startDateString ? new Date(startDateString) : new Date();
      let endDate;
      
      if (endDateString) {
        endDate = new Date(endDateString);
      } else {
        // Default to 30 days if no end date was provided
        endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 30);
      }
      
      // 5. Create subscription data with all fields explicitly set, no undefined values
      // Make sure we have the plan price for current_price field
      const planPrice = plan.price || 0; // Default to 0 if price is missing
      
      const subscriptionData = {
        userId,
        planId: Number(planId),  // Ensure this is a number
        status: paymentStatus || status,
        startDate,
        endDate,
        twitchChannel,
        isActive: true,
        geographicTargeting,
        // Initialize all JSON settings properly
        viewerSettings: '{}',
        chatSettings: '{}',
        followerSettings: '{}',
        // Required field that was missing - use camelCase field name to match schema.ts
        currentPrice: planPrice,
        // Set billing cycle from the plan
        billingCycle: plan.billingCycle || 'monthly' // Default to monthly
      };
      
      // Log what we're about to insert
      console.log('Creating subscription with data:', subscriptionData);
      
      // 6. Create the subscription
      try {
        const subscription = await storage.createUserSubscription(subscriptionData);
        
        // 7. Log the success action
        await storage.createAuditLog({
          userId: req.user?.id || 0,
          action: "assign_subscription",
          details: JSON.stringify({
            targetUserId: userId,
            planId,
            subscriptionId: subscription?.id
          }),
          ipAddress: req.ip || ""
        });
        
        // 8. Return success response
        return res.status(201).json(subscription);
      } catch (dbError: any) {
        console.error('Database error creating subscription:', dbError);
        return res.status(500).json({ 
          message: "Database error: " + dbError.message,
          details: "Failed to create subscription in database"
        });
      }
    } catch (error: any) {
      // 9. Handle any uncaught errors
      console.error('Uncaught error in subscription creation:', error);
      return res.status(500).json({ 
        message: error.message || "Unknown server error",
        details: "An unexpected error occurred while processing your request"
      });
    }
  });

  // Admin API: Update user subscription
  app.put("/api/admin/users/:userId/subscriptions/:id", isAdmin, async (req, res) => {
    try {
      // 1. Validate parameters
      const userId = parseInt(req.params.userId);
      const subscriptionId = parseInt(req.params.id);
      
      // 2. Check if user exists
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // 3. Check if subscription exists and belongs to user
      const subscriptions = await storage.getUserSubscriptions(userId);
      const subscription = subscriptions.find(sub => sub.id === subscriptionId);
      
      if (!subscription) {
        return res.status(404).json({ message: "Subscription not found or doesn't belong to this user" });
      }
      
      // 4. Prepare update data
      const updateData = { ...req.body };
      
      // 5. Convert date strings to Date objects if they exist
      if (updateData.startDate && typeof updateData.startDate === 'string') {
        updateData.startDate = new Date(updateData.startDate);
      }
      
      if (updateData.endDate && typeof updateData.endDate === 'string') {
        updateData.endDate = new Date(updateData.endDate);
      }
      
      // 6. Log the update operation
      console.log('Updating subscription with data:', {
        subscriptionId,
        userId,
        ...updateData
      });
      
      // 7. Update subscription with full error handling
      try {
        const updatedSubscription = await storage.updateUserSubscription(subscriptionId, updateData);
        
        if (!updatedSubscription) {
          return res.status(500).json({ 
            message: "Failed to update subscription",
            details: "The operation was processed but no updated record was returned"
          });
        }
        
        // 8. Log action in audit log
        await storage.createAuditLog({
          userId: req.user?.id || 0,
          action: "update_subscription",
          details: JSON.stringify({
            targetUserId: userId,
            subscriptionId,
            changes: updateData
          }),
          ipAddress: req.ip || ""
        });
        
        // 9. Return successful response
        return res.json(updatedSubscription);
      } catch (dbError: any) {
        console.error('Database error updating subscription:', dbError);
        return res.status(500).json({ 
          message: "Database error: " + dbError.message,
          details: "Failed to update subscription in database" 
        });
      }
    } catch (error: any) {
      // 10. Handle any uncaught errors
      console.error('Uncaught error in subscription update:', error);
      return res.status(500).json({ 
        message: error.message || "Unknown server error",
        details: "An unexpected error occurred while processing your request" 
      });
    }
  });

  // Admin API: Cancel user subscription
  app.delete("/api/admin/users/:userId/subscriptions/:id", isAdmin, async (req, res) => {
    try {
      // 1. Validate parameters
      const userId = parseInt(req.params.userId);
      const subscriptionId = parseInt(req.params.id);
      
      console.log(`Processing subscription cancellation request: userId=${userId}, subscriptionId=${subscriptionId}`);
      
      // 2. Check if user exists
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // 3. Check if subscription exists and belongs to user
      const subscriptions = await storage.getUserSubscriptions(userId);
      const subscription = subscriptions.find(sub => sub.id === subscriptionId);
      
      if (!subscription) {
        return res.status(404).json({ message: "Subscription not found or doesn't belong to this user" });
      }
      
      // 4. Calculate the proper end date based on billing cycle
      // Default to one month from now if no existing end date
      const defaultEndDate = new Date();
      defaultEndDate.setDate(defaultEndDate.getDate() + 30);
      
      let endDate = subscription.endDate || defaultEndDate;
      let billingPeriodDays = 30; // Default to monthly
      
      try {
        // 5. Fetch subscription plan for billing cycle info
        const subscription_plan = await storage.getSubscriptionPlan(subscription.planId);
        
        // If we have plan info, calculate more precisely based on billing cycle
        if (subscription_plan && subscription_plan.billingCycle) {
          // Calculate billing period days
          billingPeriodDays = 
            subscription_plan.billingCycle === 'day' ? 1 :
            subscription_plan.billingCycle === 'week' ? 7 :
            subscription_plan.billingCycle === 'month' ? 30 :
            subscription_plan.billingCycle === 'year' ? 365 : 30;
            
          console.log(`Billing cycle: ${subscription_plan.billingCycle}, calculated days: ${billingPeriodDays}`);
          
          // Only set a new end date if one doesn't exist
          if (!subscription.endDate) {
            const today = new Date();
            endDate = new Date(today);
            endDate.setDate(today.getDate() + billingPeriodDays);
            console.log(`Setting new end date: ${endDate.toISOString()}`);
          } else {
            console.log(`Using existing end date: ${subscription.endDate}`);
          }
        }
      } catch (planError) {
        console.error('Error fetching subscription plan:', planError);
        // Continue with the default end date if plan lookup fails
      }
      
      // 6. Log the cancellation operation
      console.log('Cancelling subscription with data:', {
        subscriptionId,
        userId,
        currentStatus: subscription.status,
        newStatus: "cancelled",
        currentEndDate: subscription.endDate,
        newEndDate: endDate
      });
      
      // 7. Update subscription with proper error handling
      try {
        const updateData = {
          status: "cancelled",
          isActive: true, // Keep active until the end date
          endDate: endDate
        };
        
        const updatedSubscription = await storage.updateUserSubscription(subscriptionId, updateData);
        
        if (!updatedSubscription) {
          return res.status(500).json({ 
            message: "Failed to cancel subscription",
            details: "The database operation did not return an updated subscription"
          });
        }
        
        // 8. Log action in audit log
        await storage.createAuditLog({
          userId: req.user?.id || 0,
          action: "cancel_subscription",
          details: JSON.stringify({
            targetUserId: userId,
            subscriptionId,
            endDate: endDate.toISOString()
          }),
          ipAddress: req.ip || ""
        });
        
        // 9. Return successful response with clear data
        // Send back both the message and the updated subscription for client-side update
        return res.json({
          success: true, 
          message: "Subscription cancelled successfully",
          subscription: updatedSubscription
        });
      } catch (dbError: any) {
        console.error('Database error cancelling subscription:', dbError);
        return res.status(500).json({ 
          message: "Database error: " + dbError.message,
          details: "Failed to cancel subscription in database"
        });
      }
    } catch (error: any) {
      // 10. Handle any uncaught errors
      console.error('Uncaught error in subscription cancellation:', error);
      return res.status(500).json({
        message: error.message || "Unknown server error",
        details: "An unexpected error occurred while processing your request"
      });
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
        isEmailVerified: z.boolean().optional(),
        profileData: z.any().optional(),        // Kullanıcı profil bilgileri
        securitySettings: z.any().optional(),   // Güvenlik ayarları
        notificationPreferences: z.any().optional()  // Bildirim tercihleri
      });
      
      // JSON verilerini doğru biçimde işle
      let validatedData = updateSchema.parse(req.body);
      
      // Function to safely stringify objects to JSON
      const safeStringifyJSON = (obj: any) => {
        if (!obj) return null;
        if (typeof obj === 'string') return obj; // Already a string, no need to stringify
        
        try {
          return JSON.stringify(obj);
        } catch (error) {
          console.error('Error stringifying object to JSON:', error);
          return null;
        }
      };
      
      // Obje şeklinde gelen alanları JSON string'e dönüştür
      if (validatedData.profileData) {
        validatedData.profileData = safeStringifyJSON(validatedData.profileData);
      }
      
      if (validatedData.securitySettings) {
        validatedData.securitySettings = safeStringifyJSON(validatedData.securitySettings);
      }
      
      if (validatedData.notificationPreferences) {
        validatedData.notificationPreferences = safeStringifyJSON(validatedData.notificationPreferences);
      }
      
      if (validatedData.billingInfo) {
        validatedData.billingInfo = safeStringifyJSON(validatedData.billingInfo);
      }
      
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
  
  // Delete user (admin only)
  app.delete("/api/admin/users/:id", isAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      
      // Check if user exists
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Prevent self-deletion
      if (req.user.id === userId) {
        return res.status(403).json({ message: "You cannot delete your own account" });
      }
      
      // Delete user subscriptions and payments first
      // This would normally be handled by database cascading deletes,
      // but we're handling it explicitly here for clarity
      const userSubscriptions = await storage.getUserSubscriptions(userId);
      for (const subscription of userSubscriptions) {
        // Cancel subscription in Stripe if applicable
        if (subscription.stripeSubscriptionId && stripe) {
          try {
            await stripe.subscriptions.cancel(subscription.stripeSubscriptionId);
          } catch (error) {
            console.error("Error canceling Stripe subscription:", error);
            // Continue with deletion despite Stripe error
          }
        }
      }
      
      // Delete the user
      const success = await storage.deleteUser(userId);
      
      if (!success) {
        return res.status(500).json({ message: "Error deleting user" });
      }
      
      res.json({ 
        message: `User ${user.username} deleted successfully`,
        success: true
      });
    } catch (error: any) {
      res.status(500).json({ message: "Error deleting user: " + error.message });
    }
  });

  // Admin Payment APIs
  app.get("/api/admin/payments", isAdmin, async (req, res) => {
    try {
      const allPayments = await db.query.payments.findMany();
      res.json(allPayments);
    } catch (error: any) {
      res.status(500).json({ message: "Error fetching payments: " + error.message });
    }
  });

  // Admin Subscription APIs
  app.get("/api/admin/subscriptions", isAdmin, async (req, res) => {
    try {
      const allSubscriptions = await db.query.userSubscriptions.findMany();
      res.json(allSubscriptions);
    } catch (error: any) {
      res.status(500).json({ message: "Error fetching subscriptions: " + error.message });
    }
  });

  // Admin Subscription Plan APIs
  app.post("/api/admin/subscription-plans", isAdmin, async (req, res) => {
    try {
      const plan = await storage.createSubscriptionPlan(req.body);
      res.status(201).json(plan);
    } catch (error: any) {
      res.status(500).json({ message: "Error creating subscription plan: " + error.message });
    }
  });
  
  // Update subscription plan
  app.put("/api/admin/subscription-plans/:id", isAdmin, async (req, res) => {
    try {
      const planId = parseInt(req.params.id);
      
      // Check if plan exists
      const existingPlan = await storage.getSubscriptionPlan(planId);
      if (!existingPlan) {
        return res.status(404).json({ message: "Subscription plan not found" });
      }
      
      // Update plan data
      const updatedPlan = await storage.updateSubscriptionPlan(planId, req.body);
      res.json(updatedPlan);
    } catch (error: any) {
      res.status(500).json({ message: "Error updating subscription plan: " + error.message });
    }
  });
  
  // Update plan order
  app.patch("/api/admin/subscription-plans/reorder", isAdmin, async (req, res) => {
    try {
      const { planOrders } = req.body;
      
      if (!Array.isArray(planOrders)) {
        return res.status(400).json({ message: "planOrders must be an array of objects with id and sortOrder" });
      }
      
      const results = [];
      
      // Update each plan's sort order
      for (const item of planOrders) {
        if (!item.id || typeof item.sortOrder !== 'number') {
          continue;
        }
        
        const updated = await storage.updateSubscriptionPlan(item.id, { 
          sortOrder: item.sortOrder 
        });
        
        results.push(updated);
      }
      
      res.json({ 
        success: true, 
        message: "Plan order updated successfully", 
        updatedPlans: results 
      });
    } catch (error: any) {
      res.status(500).json({ 
        success: false, 
        message: "Error updating plan order: " + error.message 
      });
    }
  });
  
  // Update subscription plan visibility
  app.patch("/api/admin/subscription-plans/:id/visibility", isAdmin, async (req, res) => {
    try {
      const planId = parseInt(req.params.id);
      const { isVisible } = req.body;
      
      if (typeof isVisible !== 'boolean') {
        return res.status(400).json({ message: "isVisible must be a boolean" });
      }
      
      // Check if plan exists
      const existingPlan = await storage.getSubscriptionPlan(planId);
      if (!existingPlan) {
        return res.status(404).json({ message: "Subscription plan not found" });
      }
      
      // Update plan visibility
      const updatedPlan = await storage.updateSubscriptionPlan(planId, { isVisible });
      res.json(updatedPlan);
    } catch (error: any) {
      res.status(500).json({ message: "Error updating subscription plan visibility: " + error.message });
    }
  });
  
  // Delete subscription plan
  app.delete("/api/admin/subscription-plans/:id", isAdmin, async (req, res) => {
    try {
      const planId = parseInt(req.params.id);
      
      // Check if plan exists
      const existingPlan = await storage.getSubscriptionPlan(planId);
      if (!existingPlan) {
        return res.status(404).json({ message: "Subscription plan not found" });
      }
      
      // Get all subscriptions using this plan
      const subscriptions = await storage.getUserSubscriptionsByPlan(planId);
      
      // If there are subscriptions, cancel/deactivate them all
      if (subscriptions && subscriptions.length > 0) {
        for (const subscription of subscriptions) {
          await storage.updateUserSubscription(subscription.id, {
            status: "cancelled",
            isActive: false
          });
          
          // Log action for each cancelled subscription
          await storage.createAuditLog({
            userId: req.user.id || 0,
            action: "auto_cancel_subscription_plan_delete",
            details: JSON.stringify({
              targetUserId: subscription.userId,
              subscriptionId: subscription.id,
              planId: planId,
              planName: existingPlan.name
            }),
            ipAddress: req.ip || ""
          });
        }
      }
      
      // Delete the plan
      const success = await storage.deleteSubscriptionPlan(planId);
      
      if (success) {
        res.status(204).send();
      } else {
        res.status(500).json({ message: "Failed to delete subscription plan" });
      }
    } catch (error: any) {
      console.error("Error deleting subscription plan:", error);
      res.status(500).json({ message: "Error deleting subscription plan: " + error.message });
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
  
  // Sync subscription plans with Stripe
  app.post("/api/admin/sync-stripe-plans", requireAdmin, async (req, res) => {
    try {
      if (!isStripeConfigured()) {
        return res.status(400).json({ 
          success: false,
          message: "Stripe API key is not configured. Please add your Stripe API key in the settings." 
        });
      }
      
      // Import the sync function from stripe-helper
      const { syncSubscriptionPlansWithStripe } = await import('./stripe-helper');
      
      // Execute the sync
      const result = await syncSubscriptionPlansWithStripe();
      
      // Return success response
      res.json({
        success: true,
        message: "Subscription plans successfully synchronized with Stripe.",
        result
      });
    } catch (error: any) {
      res.status(500).json({ 
        success: false,
        message: "Error syncing plans with Stripe: " + error.message
      });
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

  // ======== PAYMENT AND BILLING MANAGEMENT ROUTES ========

  // ==== Payment Routes ====
  
  // Get all payments (admin only)
  app.get("/api/admin/payments", isAdmin, async (req, res) => {
    try {
      const { status, startDate, endDate, userId } = req.query;
      
      let paymentRecords = [];
      
      // Filter by status if provided
      if (status) {
        paymentRecords = await storage.getPaymentsByStatus(status as string);
      } 
      // Filter by date range if provided
      else if (startDate && endDate) {
        paymentRecords = await storage.getPaymentsByDateRange(
          new Date(startDate as string),
          new Date(endDate as string)
        );
      } 
      // Filter by user if provided
      else if (userId) {
        paymentRecords = await storage.getUserPayments(parseInt(userId as string));
      }
      // Otherwise get all payments
      else {
        paymentRecords = await db.select().from(payments);
      }
      
      res.json(paymentRecords);
    } catch (error: any) {
      res.status(500).json({ message: "Error retrieving payments: " + error.message });
    }
  });
  
  // Get payment by ID (admin only)
  app.get("/api/admin/payments/:id", isAdmin, async (req, res) => {
    try {
      const paymentId = parseInt(req.params.id);
      const payment = await storage.getPayment(paymentId);
      
      if (!payment) {
        return res.status(404).json({ message: "Payment not found" });
      }
      
      res.json(payment);
    } catch (error: any) {
      res.status(500).json({ message: "Error retrieving payment: " + error.message });
    }
  });
  
  // Get current user's payments
  app.get("/api/payments", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const payments = await storage.getUserPayments(req.user!.id);
      res.json(payments);
    } catch (error: any) {
      res.status(500).json({ message: "Error retrieving payments: " + error.message });
    }
  });
  
  // Process a refund (admin only)
  app.post("/api/admin/payments/:id/refund", isAdmin, async (req, res) => {
    try {
      const paymentId = parseInt(req.params.id);
      const { reason } = req.body;
      
      if (!reason) {
        return res.status(400).json({ message: "Refund reason is required" });
      }
      
      const payment = await storage.getPayment(paymentId);
      
      if (!payment) {
        return res.status(404).json({ message: "Payment not found" });
      }
      
      if (payment.status === 'refunded') {
        return res.status(400).json({ message: "Payment has already been refunded" });
      }
      
      // Process refund in Stripe if it's a Stripe payment
      if (payment.stripePaymentIntentId && stripe) {
        try {
          await stripe.refunds.create({
            payment_intent: payment.stripePaymentIntentId,
            reason: 'requested_by_customer'
          });
        } catch (stripeError: any) {
          return res.status(400).json({ 
            message: "Error processing Stripe refund: " + stripeError.message 
          });
        }
      }
      
      // Process refund in our database
      const refundedPayment = await storage.refundPayment(paymentId, reason);
      
      res.json(refundedPayment);
    } catch (error: any) {
      res.status(500).json({ message: "Error processing refund: " + error.message });
    }
  });

  // ==== Invoice Routes ====
  
  // Get all invoices (admin only)
  app.get("/api/admin/invoices", isAdmin, async (req, res) => {
    try {
      const { status, startDate, endDate, userId } = req.query;
      
      let invoiceRecords = [];
      
      // Filter by status if provided
      if (status) {
        invoiceRecords = await storage.getInvoicesByStatus(status as string);
      } 
      // Filter by date range if provided
      else if (startDate && endDate) {
        invoiceRecords = await storage.getInvoicesByDateRange(
          new Date(startDate as string),
          new Date(endDate as string)
        );
      } 
      // Filter by user if provided
      else if (userId) {
        invoiceRecords = await storage.getUserInvoices(parseInt(userId as string));
      }
      // Otherwise get all invoices
      else {
        invoiceRecords = await db.select().from(invoices);
      }
      
      res.json(invoiceRecords);
    } catch (error: any) {
      res.status(500).json({ message: "Error retrieving invoices: " + error.message });
    }
  });
  
  // Get invoice by ID (admin or invoice owner)
  app.get("/api/invoices/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const invoiceId = parseInt(req.params.id);
      const invoice = await storage.getInvoice(invoiceId);
      
      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }
      
      // Check if user is admin or the invoice owner
      if (req.user!.role !== 'admin' && invoice.userId !== req.user!.id) {
        return res.status(403).json({ message: "Forbidden: You don't have access to this invoice" });
      }
      
      res.json(invoice);
    } catch (error: any) {
      res.status(500).json({ message: "Error retrieving invoice: " + error.message });
    }
  });
  
  // Get current user's invoices
  app.get("/api/invoices", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const invoices = await storage.getUserInvoices(req.user!.id);
      res.json(invoices);
    } catch (error: any) {
      res.status(500).json({ message: "Error retrieving invoices: " + error.message });
    }
  });
  
  // Create new invoice (admin only)
  app.post("/api/admin/invoices", isAdmin, async (req, res) => {
    try {
      const invoiceData = insertInvoiceSchema.parse(req.body);
      
      // Generate invoice number
      if (!invoiceData.invoiceNumber) {
        const date = new Date();
        const timestamp = date.getTime().toString().slice(-6);
        invoiceData.invoiceNumber = `INV-${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, '0')}${timestamp}`;
      }
      
      const newInvoice = await storage.createInvoice(invoiceData);
      res.status(201).json(newInvoice);
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Error creating invoice: " + error.message });
    }
  });
  
  // Update invoice (admin only)
  app.put("/api/admin/invoices/:id", isAdmin, async (req, res) => {
    try {
      const invoiceId = parseInt(req.params.id);
      const existingInvoice = await storage.getInvoice(invoiceId);
      
      if (!existingInvoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }
      
      const updatedInvoice = await storage.updateInvoice(invoiceId, req.body);
      res.json(updatedInvoice);
    } catch (error: any) {
      res.status(500).json({ message: "Error updating invoice: " + error.message });
    }
  });
  
  // Update invoice status (admin only)
  app.patch("/api/admin/invoices/:id/status", isAdmin, async (req, res) => {
    try {
      const invoiceId = parseInt(req.params.id);
      const { status } = req.body;
      
      if (!status) {
        return res.status(400).json({ message: "Status is required" });
      }
      
      // Check if status is valid
      if (!['draft', 'issued', 'paid', 'void', 'overdue'].includes(status)) {
        return res.status(400).json({ message: "Invalid status value" });
      }
      
      const existingInvoice = await storage.getInvoice(invoiceId);
      
      if (!existingInvoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }
      
      const updatedInvoice = await storage.updateInvoiceStatus(invoiceId, status);
      res.json(updatedInvoice);
    } catch (error: any) {
      res.status(500).json({ message: "Error updating invoice status: " + error.message });
    }
  });
  
  // Delete invoice (admin only)
  app.delete("/api/admin/invoices/:id", isAdmin, async (req, res) => {
    try {
      const invoiceId = parseInt(req.params.id);
      const existingInvoice = await storage.getInvoice(invoiceId);
      
      if (!existingInvoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }
      
      const success = await storage.deleteInvoice(invoiceId);
      
      if (!success) {
        return res.status(400).json({ 
          message: "Cannot delete this invoice as it has associated payments" 
        });
      }
      
      res.json({ success: true, message: "Invoice deleted successfully" });
    } catch (error: any) {
      res.status(500).json({ message: "Error deleting invoice: " + error.message });
    }
  });
  
  // ==== Payment Method Routes ====
  
  // Get current user's payment methods
  app.get("/api/payment-methods", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const paymentMethods = await storage.getUserPaymentMethods(req.user!.id);
      res.json(paymentMethods);
    } catch (error: any) {
      res.status(500).json({ message: "Error retrieving payment methods: " + error.message });
    }
  });
  
  // Add a new payment method
  app.post("/api/payment-methods", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      // Parse and validate request data
      const methodData = req.body;
      methodData.userId = req.user!.id;
      
      // Handle Stripe payment method if applicable
      if (methodData.type === 'card' && methodData.stripePaymentMethodId && stripe) {
        try {
          // Attach payment method to customer in Stripe
          if (req.user!.stripeCustomerId) {
            await stripe.paymentMethods.attach(
              methodData.stripePaymentMethodId,
              { customer: req.user!.stripeCustomerId }
            );
            
            // If set as default in our system, set as default in Stripe too
            if (methodData.isDefault) {
              await stripe.customers.update(
                req.user!.stripeCustomerId,
                { invoice_settings: { default_payment_method: methodData.stripePaymentMethodId } }
              );
            }
          }
        } catch (stripeError: any) {
          return res.status(400).json({ 
            message: "Error attaching payment method in Stripe: " + stripeError.message 
          });
        }
      }
      
      const newMethod = await storage.createPaymentMethod(methodData);
      res.status(201).json(newMethod);
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Error adding payment method: " + error.message });
    }
  });
  
  // Update payment method
  app.put("/api/payment-methods/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const methodId = parseInt(req.params.id);
      const method = await storage.getPaymentMethod(methodId);
      
      if (!method) {
        return res.status(404).json({ message: "Payment method not found" });
      }
      
      // Check if user owns this payment method
      if (method.userId !== req.user!.id) {
        return res.status(403).json({ message: "Forbidden: You don't own this payment method" });
      }
      
      // Parse and validate request data
      const methodData = req.body;
      
      // Update in Stripe if needed
      if (method.type === 'card' && method.stripePaymentMethodId && methodData.isDefault && stripe) {
        try {
          if (req.user!.stripeCustomerId) {
            await stripe.customers.update(
              req.user!.stripeCustomerId,
              { invoice_settings: { default_payment_method: method.stripePaymentMethodId } }
            );
          }
        } catch (stripeError: any) {
          console.error("Stripe error updating default payment method:", stripeError);
          // Continue with our update even if Stripe update fails
        }
      }
      
      const updatedMethod = await storage.updatePaymentMethod(methodId, methodData);
      res.json(updatedMethod);
    } catch (error: any) {
      res.status(500).json({ message: "Error updating payment method: " + error.message });
    }
  });
  
  // Set default payment method
  app.post("/api/payment-methods/:id/set-default", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const methodId = parseInt(req.params.id);
      const method = await storage.getPaymentMethod(methodId);
      
      if (!method) {
        return res.status(404).json({ message: "Payment method not found" });
      }
      
      // Check if user owns this payment method
      if (method.userId !== req.user!.id) {
        return res.status(403).json({ message: "Forbidden: You don't own this payment method" });
      }
      
      // Update in Stripe if needed
      if (method.type === 'card' && method.stripePaymentMethodId && stripe) {
        try {
          if (req.user!.stripeCustomerId) {
            await stripe.customers.update(
              req.user!.stripeCustomerId,
              { invoice_settings: { default_payment_method: method.stripePaymentMethodId } }
            );
          }
        } catch (stripeError: any) {
          console.error("Stripe error setting default payment method:", stripeError);
          // Continue with our update even if Stripe update fails
        }
      }
      
      const updatedMethod = await storage.setDefaultPaymentMethod(methodId, req.user!.id);
      res.json(updatedMethod);
    } catch (error: any) {
      res.status(500).json({ message: "Error setting default payment method: " + error.message });
    }
  });
  
  // Delete payment method
  app.delete("/api/payment-methods/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const methodId = parseInt(req.params.id);
      const method = await storage.getPaymentMethod(methodId);
      
      if (!method) {
        return res.status(404).json({ message: "Payment method not found" });
      }
      
      // Check if user owns this payment method
      if (method.userId !== req.user!.id && req.user!.role !== 'admin') {
        return res.status(403).json({ message: "Forbidden: You don't own this payment method" });
      }
      
      // Detach from Stripe if needed
      if (method.type === 'card' && method.stripePaymentMethodId && stripe) {
        try {
          await stripe.paymentMethods.detach(method.stripePaymentMethodId);
        } catch (stripeError: any) {
          console.error("Stripe error detaching payment method:", stripeError);
          // Continue with our deletion even if Stripe detach fails
        }
      }
      
      const success = await storage.deletePaymentMethod(methodId);
      
      if (!success) {
        return res.status(400).json({ 
          message: "Cannot delete this payment method as it's required for active subscriptions" 
        });
      }
      
      res.json({ success: true, message: "Payment method deleted successfully" });
    } catch (error: any) {
      res.status(500).json({ message: "Error deleting payment method: " + error.message });
    }
  });

  // ==== Financial Reports Routes ====
  
  // Get financial summary (admin only)
  app.get("/api/admin/reports/financial-summary", isAdmin, async (req, res) => {
    try {
      // Get query parameters
      const { period } = req.query;
      const periodType = (period as string) || 'month'; // Default to month
      
      // Calculate date range
      const now = new Date();
      let startDate: Date;
      
      switch (periodType) {
        case 'week':
          // Current week (starting from Sunday)
          const dayOfWeek = now.getDay();
          startDate = new Date(now);
          startDate.setDate(now.getDate() - dayOfWeek);
          startDate.setHours(0, 0, 0, 0);
          break;
        case 'month':
          // Current month
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case 'quarter':
          // Current quarter
          const currentQuarter = Math.floor(now.getMonth() / 3);
          startDate = new Date(now.getFullYear(), currentQuarter * 3, 1);
          break;
        case 'year':
          // Current year
          startDate = new Date(now.getFullYear(), 0, 1);
          break;
        default:
          startDate = new Date(now.getFullYear(), now.getMonth(), 1); // Default to current month
      }
      
      // Get all payments in the given period
      const periodPayments = await storage.getPaymentsByDateRange(startDate, now);
      
      // Calculate income
      const income = periodPayments
        .filter(p => p.status === 'completed' && p.paymentType !== 'refund')
        .reduce((sum, payment) => sum + payment.amount, 0);
      
      // Calculate refunds
      const refunds = periodPayments
        .filter(p => p.status === 'refunded' || p.paymentType === 'refund')
        .reduce((sum, payment) => sum + Math.abs(payment.amount), 0);
      
      // Get active subscriptions
      const activeSubscriptions = await db
        .select()
        .from(userSubscriptions)
        .where(eq(userSubscriptions.status, 'active'))
        .execute();
      
      // Calculate subscription metrics
      const subscriptionCount = activeSubscriptions.length;
      
      // Get plans for the active subscriptions
      const planIds = Array.from(new Set(activeSubscriptions.map(sub => sub.planId)));
      const plans = await Promise.all(
        planIds.map(id => storage.getSubscriptionPlan(id))
      );
      
      // Calculate recurring revenue (monthly basis)
      const mrr = activeSubscriptions.reduce((sum, sub) => {
        const plan = plans.find(p => p?.id === sub.planId);
        if (plan) {
          // For annual plans, divide by 12 to get monthly value
          const monthlyPrice = plan.billingCycle === 'yearly' 
            ? plan.price / 12
            : plan.price;
          return sum + monthlyPrice;
        }
        return sum;
      }, 0);
      
      // Calculate average revenue per user
      const arpu = subscriptionCount > 0 ? mrr / subscriptionCount : 0;
      
      // Return the financial summary
      res.json({
        period: periodType,
        startDate,
        endDate: now,
        income,
        refunds,
        netIncome: income - refunds,
        activeSubscriptions: subscriptionCount,
        monthlyRecurringRevenue: mrr,
        averageRevenuePerUser: arpu,
      });
    } catch (error: any) {
      res.status(500).json({ message: "Error generating financial summary: " + error.message });
    }
  });

  // Content Management API Routes
  
  // Page Content Management
  app.get("/api/admin/page-contents", requireAdmin, async (req, res) => {
    try {
      const contents = await storage.getPageContents();
      res.status(200).json(contents);
    } catch (error) {
      console.error("[API Error] Failed to get page contents:", error);
      res.status(500).json({ error: "Failed to get page contents" });
    }
  });
  
  app.get("/api/admin/page-contents/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid page content ID" });
      }
      
      const content = await storage.getPageContent(id);
      if (!content) {
        return res.status(404).json({ error: "Page content not found" });
      }
      
      res.status(200).json(content);
    } catch (error) {
      console.error("[API Error] Failed to get page content:", error);
      res.status(500).json({ error: "Failed to get page content" });
    }
  });
  
  app.get("/api/page-content/:slug", async (req, res) => {
    try {
      const slug = req.params.slug;
      const content = await storage.getPageContentBySlug(slug);
      
      if (!content) {
        return res.status(404).json({ error: "Page content not found" });
      }
      
      if (!content.isActive) {
        return res.status(404).json({ error: "Page content not found or inactive" });
      }
      
      res.status(200).json(content);
    } catch (error) {
      console.error("[API Error] Failed to get page content by slug:", error);
      res.status(500).json({ error: "Failed to get page content" });
    }
  });
  
  app.post("/api/admin/page-contents", requireAdmin, async (req, res) => {
    try {
      const contentData = req.body;
      
      // Add the current user as the last updated by
      contentData.lastUpdatedBy = req.user?.id;
      
      const newContent = await storage.createPageContent(contentData);
      res.status(201).json(newContent);
    } catch (error) {
      console.error("[API Error] Failed to create page content:", error);
      res.status(500).json({ error: "Failed to create page content" });
    }
  });
  
  app.put("/api/admin/page-contents/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid page content ID" });
      }
      
      const contentData = req.body;
      
      // Add the current user as the last updated by
      contentData.lastUpdatedBy = req.user?.id;
      
      const updatedContent = await storage.updatePageContent(id, contentData);
      
      if (!updatedContent) {
        return res.status(404).json({ error: "Page content not found" });
      }
      
      res.status(200).json(updatedContent);
    } catch (error) {
      console.error("[API Error] Failed to update page content:", error);
      res.status(500).json({ error: "Failed to update page content" });
    }
  });
  
  app.delete("/api/admin/page-contents/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid page content ID" });
      }
      
      const success = await storage.deletePageContent(id);
      
      if (!success) {
        return res.status(404).json({ error: "Page content not found or could not be deleted" });
      }
      
      res.status(200).json({ message: "Page content deleted successfully" });
    } catch (error) {
      console.error("[API Error] Failed to delete page content:", error);
      res.status(500).json({ error: "Failed to delete page content" });
    }
  });
  
  // Blog Category Management
  app.get("/api/admin/blog-categories", requireAdmin, async (req, res) => {
    try {
      const categories = await storage.getBlogCategories();
      res.status(200).json(categories);
    } catch (error) {
      console.error("[API Error] Failed to get blog categories:", error);
      res.status(500).json({ error: "Failed to get blog categories" });
    }
  });
  
  app.get("/api/blog-categories", async (req, res) => {
    try {
      // Only return active categories for public API
      const categories = await storage.getBlogCategories();
      const activeCategories = categories.filter(category => category.isActive);
      res.status(200).json(activeCategories);
    } catch (error) {
      console.error("[API Error] Failed to get blog categories:", error);
      res.status(500).json({ error: "Failed to get blog categories" });
    }
  });
  
  app.get("/api/admin/blog-categories/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid blog category ID" });
      }
      
      const category = await storage.getBlogCategory(id);
      
      if (!category) {
        return res.status(404).json({ error: "Blog category not found" });
      }
      
      res.status(200).json(category);
    } catch (error) {
      console.error("[API Error] Failed to get blog category:", error);
      res.status(500).json({ error: "Failed to get blog category" });
    }
  });
  
  app.post("/api/admin/blog-categories", requireAdmin, async (req, res) => {
    try {
      const categoryData = req.body;
      const newCategory = await storage.createBlogCategory(categoryData);
      res.status(201).json(newCategory);
    } catch (error) {
      console.error("[API Error] Failed to create blog category:", error);
      res.status(500).json({ error: "Failed to create blog category" });
    }
  });
  
  app.put("/api/admin/blog-categories/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid blog category ID" });
      }
      
      const categoryData = req.body;
      const updatedCategory = await storage.updateBlogCategory(id, categoryData);
      
      if (!updatedCategory) {
        return res.status(404).json({ error: "Blog category not found" });
      }
      
      res.status(200).json(updatedCategory);
    } catch (error) {
      console.error("[API Error] Failed to update blog category:", error);
      res.status(500).json({ error: "Failed to update blog category" });
    }
  });
  
  app.delete("/api/admin/blog-categories/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid blog category ID" });
      }
      
      const success = await storage.deleteBlogCategory(id);
      
      if (!success) {
        return res.status(404).json({ error: "Blog category not found or could not be deleted. Make sure it doesn't contain any posts." });
      }
      
      res.status(200).json({ message: "Blog category deleted successfully" });
    } catch (error) {
      console.error("[API Error] Failed to delete blog category:", error);
      res.status(500).json({ error: "Failed to delete blog category" });
    }
  });
  
  // Blog Post Management
  app.get("/api/admin/blog-posts", requireAdmin, async (req, res) => {
    try {
      const filters = {
        categoryId: req.query.categoryId ? parseInt(req.query.categoryId as string) : undefined,
        status: req.query.status as string,
        tag: req.query.tag as string
      };
      
      const posts = await storage.getBlogPosts(filters);
      res.status(200).json(posts);
    } catch (error) {
      console.error("[API Error] Failed to get blog posts:", error);
      res.status(500).json({ error: "Failed to get blog posts" });
    }
  });
  
  app.get("/api/blog-posts", async (req, res) => {
    try {
      // Only return published posts for public API
      const filters = {
        categoryId: req.query.categoryId ? parseInt(req.query.categoryId as string) : undefined,
        status: "published", // Force published status for public API
        tag: req.query.tag as string
      };
      
      const posts = await storage.getBlogPosts(filters);
      res.status(200).json(posts);
    } catch (error) {
      console.error("[API Error] Failed to get blog posts:", error);
      res.status(500).json({ error: "Failed to get blog posts" });
    }
  });
  
  app.get("/api/admin/blog-posts/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid blog post ID" });
      }
      
      const post = await storage.getBlogPost(id);
      
      if (!post) {
        return res.status(404).json({ error: "Blog post not found" });
      }
      
      res.status(200).json(post);
    } catch (error) {
      console.error("[API Error] Failed to get blog post:", error);
      res.status(500).json({ error: "Failed to get blog post" });
    }
  });
  
  app.get("/api/blog-posts/:slug", async (req, res) => {
    try {
      const slug = req.params.slug;
      const post = await storage.getBlogPostBySlug(slug);
      
      if (!post) {
        return res.status(404).json({ error: "Blog post not found" });
      }
      
      // Only return published posts for public API
      if (post.status !== "published") {
        return res.status(404).json({ error: "Blog post not found or not published" });
      }
      
      res.status(200).json(post);
    } catch (error) {
      console.error("[API Error] Failed to get blog post by slug:", error);
      res.status(500).json({ error: "Failed to get blog post" });
    }
  });
  
  app.post("/api/admin/blog-posts", requireAdmin, async (req, res) => {
    try {
      const postData = req.body;
      
      // Add the current user as the author
      postData.authorId = req.user?.id;
      
      const newPost = await storage.createBlogPost(postData);
      res.status(201).json(newPost);
    } catch (error) {
      console.error("[API Error] Failed to create blog post:", error);
      res.status(500).json({ error: "Failed to create blog post" });
    }
  });
  
  app.put("/api/admin/blog-posts/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid blog post ID" });
      }
      
      const postData = req.body;
      const updatedPost = await storage.updateBlogPost(id, postData);
      
      if (!updatedPost) {
        return res.status(404).json({ error: "Blog post not found" });
      }
      
      res.status(200).json(updatedPost);
    } catch (error) {
      console.error("[API Error] Failed to update blog post:", error);
      res.status(500).json({ error: "Failed to update blog post" });
    }
  });
  
  app.post("/api/admin/blog-posts/:id/publish", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid blog post ID" });
      }
      
      const publishedPost = await storage.publishBlogPost(id);
      
      if (!publishedPost) {
        return res.status(404).json({ error: "Blog post not found" });
      }
      
      res.status(200).json(publishedPost);
    } catch (error) {
      console.error("[API Error] Failed to publish blog post:", error);
      res.status(500).json({ error: "Failed to publish blog post" });
    }
  });
  
  app.post("/api/admin/blog-posts/:id/unpublish", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid blog post ID" });
      }
      
      const unpublishedPost = await storage.unpublishBlogPost(id);
      
      if (!unpublishedPost) {
        return res.status(404).json({ error: "Blog post not found" });
      }
      
      res.status(200).json(unpublishedPost);
    } catch (error) {
      console.error("[API Error] Failed to unpublish blog post:", error);
      res.status(500).json({ error: "Failed to unpublish blog post" });
    }
  });
  
  app.delete("/api/admin/blog-posts/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid blog post ID" });
      }
      
      const success = await storage.deleteBlogPost(id);
      
      if (!success) {
        return res.status(404).json({ error: "Blog post not found or could not be deleted" });
      }
      
      res.status(200).json({ message: "Blog post deleted successfully" });
    } catch (error) {
      console.error("[API Error] Failed to delete blog post:", error);
      res.status(500).json({ error: "Failed to delete blog post" });
    }
  });
  
  // FAQ Category Management
  app.get("/api/admin/faq-categories", requireAdmin, async (req, res) => {
    try {
      const categories = await storage.getFaqCategories();
      res.status(200).json(categories);
    } catch (error) {
      console.error("[API Error] Failed to get FAQ categories:", error);
      res.status(500).json({ error: "Failed to get FAQ categories" });
    }
  });
  
  app.get("/api/faq-categories", async (req, res) => {
    try {
      // Only return active categories for public API
      const categories = await storage.getFaqCategories();
      const activeCategories = categories.filter(category => category.isActive);
      res.status(200).json(activeCategories);
    } catch (error) {
      console.error("[API Error] Failed to get FAQ categories:", error);
      res.status(500).json({ error: "Failed to get FAQ categories" });
    }
  });
  
  app.get("/api/admin/faq-categories/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid FAQ category ID" });
      }
      
      const category = await storage.getFaqCategory(id);
      
      if (!category) {
        return res.status(404).json({ error: "FAQ category not found" });
      }
      
      res.status(200).json(category);
    } catch (error) {
      console.error("[API Error] Failed to get FAQ category:", error);
      res.status(500).json({ error: "Failed to get FAQ category" });
    }
  });
  
  app.post("/api/admin/faq-categories", requireAdmin, async (req, res) => {
    try {
      const categoryData = req.body;
      const newCategory = await storage.createFaqCategory(categoryData);
      res.status(201).json(newCategory);
    } catch (error) {
      console.error("[API Error] Failed to create FAQ category:", error);
      res.status(500).json({ error: "Failed to create FAQ category" });
    }
  });
  
  app.put("/api/admin/faq-categories/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid FAQ category ID" });
      }
      
      const categoryData = req.body;
      const updatedCategory = await storage.updateFaqCategory(id, categoryData);
      
      if (!updatedCategory) {
        return res.status(404).json({ error: "FAQ category not found" });
      }
      
      res.status(200).json(updatedCategory);
    } catch (error) {
      console.error("[API Error] Failed to update FAQ category:", error);
      res.status(500).json({ error: "Failed to update FAQ category" });
    }
  });
  
  app.delete("/api/admin/faq-categories/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid FAQ category ID" });
      }
      
      const success = await storage.deleteFaqCategory(id);
      
      if (!success) {
        return res.status(404).json({ error: "FAQ category not found or could not be deleted. Make sure it doesn't contain any FAQs." });
      }
      
      res.status(200).json({ message: "FAQ category deleted successfully" });
    } catch (error) {
      console.error("[API Error] Failed to delete FAQ category:", error);
      res.status(500).json({ error: "Failed to delete FAQ category" });
    }
  });
  
  // FAQ Management
  app.get("/api/admin/faqs", requireAdmin, async (req, res) => {
    try {
      const categoryId = req.query.categoryId ? parseInt(req.query.categoryId as string) : undefined;
      const faqs = await storage.getFaqs(categoryId);
      res.status(200).json(faqs);
    } catch (error) {
      console.error("[API Error] Failed to get FAQs:", error);
      res.status(500).json({ error: "Failed to get FAQs" });
    }
  });
  
  app.get("/api/faqs", async (req, res) => {
    try {
      const categoryId = req.query.categoryId ? parseInt(req.query.categoryId as string) : undefined;
      const faqs = await storage.getFaqs(categoryId);
      
      // Only return active FAQs for public API
      const activeFaqs = faqs.filter(faq => faq.isActive);
      
      res.status(200).json(activeFaqs);
    } catch (error) {
      console.error("[API Error] Failed to get FAQs:", error);
      res.status(500).json({ error: "Failed to get FAQs" });
    }
  });
  
  // Product Review Routes
  app.get("/api/product-reviews", async (req, res) => {
    try {
      // Direct database approach for product reviews
      const productId = Number(req.query.productId);
      
      if (isNaN(productId)) {
        return res.status(400).json({ error: "Valid productId is required" });
      }
      
      // Use a direct SQL query to bypass ORM issues
      const { rows } = await pool.query(
        `SELECT * FROM product_reviews 
         WHERE product_id = $1 AND status = 'published' 
         ORDER BY created_at DESC`,
        [productId]
      );
      
      console.log(`Successfully retrieved ${rows.length} reviews for product ${productId}`);
      return res.json(rows);
    } catch (error) {
      console.error("Error fetching product reviews:", error);
      return res.status(500).json({ error: "Failed to fetch reviews" });
    }
  });
  
  app.post("/api/product-reviews", async (req, res) => {
    try {
      const { createProductReview } = await import("./api/simple-reviews");
      return createProductReview(req, res);
    } catch (error) {
      console.error("Error in create review route:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });
  
  app.post("/api/review-votes", async (req, res) => {
    try {
      const { voteOnReview } = await import("./api/simple-reviews");
      return voteOnReview(req, res);
    } catch (error) {
      console.error("Error in review vote route:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });
  
  // Admin Review Management Routes
  app.get("/api/admin/reviews", requireAdmin, async (req, res) => {
    try {
      const { getAdminReviews } = await import("./api/admin/reviews");
      return getAdminReviews(req, res);
    } catch (error) {
      console.error("Error in admin reviews route:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });
  
  app.get("/api/admin/reviews/:id", requireAdmin, async (req, res) => {
    try {
      const { getAdminReviewById } = await import("./api/admin/reviews");
      return getAdminReviewById(req, res);
    } catch (error) {
      console.error("Error in admin review by id route:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });
  
  app.patch("/api/admin/reviews/:id", requireAdmin, async (req, res) => {
    try {
      const { updateAdminReview } = await import("./api/admin/reviews");
      return updateAdminReview(req, res);
    } catch (error) {
      console.error("Error in admin update review route:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });
  
  app.patch("/api/admin/reviews/:id/status", requireAdmin, async (req, res) => {
    try {
      const { updateAdminReviewStatus } = await import("./api/admin/reviews");
      return updateAdminReviewStatus(req, res);
    } catch (error) {
      console.error("Error in admin update review status route:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });
  
  app.delete("/api/admin/reviews/:id", requireAdmin, async (req, res) => {
    try {
      const { deleteAdminReview } = await import("./api/admin/reviews");
      return deleteAdminReview(req, res);
    } catch (error) {
      console.error("Error in admin delete review route:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });
  
  app.post("/api/admin/generate-reviews", async (req, res) => {
    try {
      const { generateProductReviews } = await import("./api/simple-reviews");
      return generateProductReviews(req, res);
    } catch (error) {
      console.error("Error in generate reviews route:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });
  
  app.get("/api/admin/faqs/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid FAQ ID" });
      }
      
      const faq = await storage.getFaq(id);
      
      if (!faq) {
        return res.status(404).json({ error: "FAQ not found" });
      }
      
      res.status(200).json(faq);
    } catch (error) {
      console.error("[API Error] Failed to get FAQ:", error);
      res.status(500).json({ error: "Failed to get FAQ" });
    }
  });
  
  app.post("/api/admin/faqs", requireAdmin, async (req, res) => {
    try {
      const faqData = req.body;
      const newFaq = await storage.createFaq(faqData);
      res.status(201).json(newFaq);
    } catch (error) {
      console.error("[API Error] Failed to create FAQ:", error);
      res.status(500).json({ error: "Failed to create FAQ" });
    }
  });
  
  app.put("/api/admin/faqs/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid FAQ ID" });
      }
      
      const faqData = req.body;
      const updatedFaq = await storage.updateFaq(id, faqData);
      
      if (!updatedFaq) {
        return res.status(404).json({ error: "FAQ not found" });
      }
      
      res.status(200).json(updatedFaq);
    } catch (error) {
      console.error("[API Error] Failed to update FAQ:", error);
      res.status(500).json({ error: "Failed to update FAQ" });
    }
  });
  
  app.post("/api/admin/faqs/:id/toggle-status", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid FAQ ID" });
      }
      
      const { isActive } = req.body;
      
      if (typeof isActive !== "boolean") {
        return res.status(400).json({ error: "isActive must be a boolean value" });
      }
      
      const updatedFaq = await storage.toggleFaqStatus(id, isActive);
      
      if (!updatedFaq) {
        return res.status(404).json({ error: "FAQ not found" });
      }
      
      res.status(200).json(updatedFaq);
    } catch (error) {
      console.error("[API Error] Failed to toggle FAQ status:", error);
      res.status(500).json({ error: "Failed to toggle FAQ status" });
    }
  });
  
  app.delete("/api/admin/faqs/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid FAQ ID" });
      }
      
      const success = await storage.deleteFaq(id);
      
      if (!success) {
        return res.status(404).json({ error: "FAQ not found or could not be deleted" });
      }
      
      res.status(200).json({ message: "FAQ deleted successfully" });
    } catch (error) {
      console.error("[API Error] Failed to delete FAQ:", error);
      res.status(500).json({ error: "Failed to delete FAQ" });
    }
  });
  
  // Contact Message Management
  app.get("/api/admin/contact-messages", requireAdmin, async (req, res) => {
    try {
      const filters = {
        status: req.query.status as string
      };
      
      const messages = await storage.getContactMessages(filters);
      res.status(200).json(messages);
    } catch (error) {
      console.error("[API Error] Failed to get contact messages:", error);
      res.status(500).json({ error: "Failed to get contact messages" });
    }
  });
  
  app.get("/api/admin/contact-messages/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid contact message ID" });
      }
      
      const message = await storage.getContactMessage(id);
      
      if (!message) {
        return res.status(404).json({ error: "Contact message not found" });
      }
      
      res.status(200).json(message);
    } catch (error) {
      console.error("[API Error] Failed to get contact message:", error);
      res.status(500).json({ error: "Failed to get contact message" });
    }
  });
  
  app.post("/api/contact", async (req, res) => {
    try {
      const messageData = req.body;
      
      // Add the IP address if available
      if (req.ip) {
        messageData.ipAddress = req.ip;
      }
      
      const newMessage = await storage.createContactMessage(messageData);
      res.status(201).json({ message: "Contact message sent successfully" });
    } catch (error) {
      console.error("[API Error] Failed to create contact message:", error);
      res.status(500).json({ error: "Failed to send contact message" });
    }
  });
  
  app.post("/api/admin/contact-messages/:id/update-status", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid contact message ID" });
      }
      
      const { status } = req.body;
      
      if (!status || !["unread", "read", "replied"].includes(status)) {
        return res.status(400).json({ error: "Status must be one of: unread, read, replied" });
      }
      
      let updatedMessage;
      
      if (status === "replied") {
        updatedMessage = await storage.replyToContactMessage(id, req.user?.id as number);
      } else {
        updatedMessage = await storage.updateContactMessageStatus(id, status);
      }
      
      if (!updatedMessage) {
        return res.status(404).json({ error: "Contact message not found" });
      }
      
      res.status(200).json(updatedMessage);
    } catch (error) {
      console.error("[API Error] Failed to update contact message status:", error);
      res.status(500).json({ error: "Failed to update contact message status" });
    }
  });
  
  app.delete("/api/admin/contact-messages/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid contact message ID" });
      }
      
      const success = await storage.deleteContactMessage(id);
      
      if (!success) {
        return res.status(404).json({ error: "Contact message not found or could not be deleted" });
      }
      
      res.status(200).json({ message: "Contact message deleted successfully" });
    } catch (error) {
      console.error("[API Error] Failed to delete contact message:", error);
      res.status(500).json({ error: "Failed to delete contact message" });
    }
  });

  // System Configuration API endpoints
  app.get("/api/admin/system-configs", requireAdmin, async (req, res) => {
    try {
      const configs = await storage.getAllSystemConfigs();
      res.json(configs);
    } catch (error: any) {
      res.status(500).json({ message: "Error fetching system configurations: " + error.message });
    }
  });
  
  app.get("/api/admin/system-configs/category/:category", requireAdmin, async (req, res) => {
    try {
      const category = req.params.category;
      const configs = await storage.getSystemConfigsByCategory(category);
      res.json(configs);
    } catch (error: any) {
      res.status(500).json({ message: "Error fetching system configurations by category: " + error.message });
    }
  });
  
  app.get("/api/admin/system-configs/:id", requireAdmin, async (req, res) => {
    try {
      const config = await storage.getSystemConfig(parseInt(req.params.id));
      if (!config) {
        return res.status(404).json({ message: "System configuration not found" });
      }
      res.json(config);
    } catch (error: any) {
      res.status(500).json({ message: "Error fetching system configuration: " + error.message });
    }
  });
  
  app.patch("/api/admin/system-configs/:id", requireAdmin, async (req, res) => {
    try {
      const { value } = req.body;
      const config = await storage.updateSystemConfig(parseInt(req.params.id), { value });
      if (!config) {
        return res.status(404).json({ message: "System configuration not found" });
      }
      res.json(config);
    } catch (error: any) {
      res.status(500).json({ message: "Error updating system configuration: " + error.message });
    }
  });

  /**
   * Synchronize subscription plans with Stripe
   * Creates products and prices in Stripe based on database plans
   */
  app.post("/api/admin/stripe/sync-plans", requireAdmin, async (req, res) => {
    try {
      // Check if Stripe is configured
      if (!isStripeConfigured()) {
        return res.status(400).json({ 
          success: false,
          message: "Stripe is not configured. Please check your API keys in the settings." 
        });
      }
      
      // Synchronize plans with Stripe
      const result = await syncSubscriptionPlansWithStripe();
      
      return res.status(200).json(result);
    } catch (error: any) {
      console.error("Error syncing plans with Stripe:", error);
      return res.status(500).json({ 
        success: false,
        message: `Error syncing plans with Stripe: ${error.message}` 
      });
    }
  });
  
  // Email Templates API endpoints
  app.get("/api/admin/email-templates", requireAdmin, async (req, res) => {
    try {
      const templates = await storage.getAllEmailTemplates();
      res.json(templates);
    } catch (error: any) {
      res.status(500).json({ message: "Error fetching email templates: " + error.message });
    }
  });
  
  app.get("/api/admin/email-templates/:id", requireAdmin, async (req, res) => {
    try {
      const template = await storage.getEmailTemplate(parseInt(req.params.id));
      if (!template) {
        return res.status(404).json({ message: "Email template not found" });
      }
      res.json(template);
    } catch (error: any) {
      res.status(500).json({ message: "Error fetching email template: " + error.message });
    }
  });
  
  app.post("/api/admin/email-templates", requireAdmin, async (req, res) => {
    try {
      const template = await storage.createEmailTemplate(req.body);
      res.status(201).json(template);
    } catch (error: any) {
      res.status(500).json({ message: "Error creating email template: " + error.message });
    }
  });
  
  app.patch("/api/admin/email-templates/:id", requireAdmin, async (req, res) => {
    try {
      const template = await storage.updateEmailTemplate(parseInt(req.params.id), req.body);
      if (!template) {
        return res.status(404).json({ message: "Email template not found" });
      }
      res.json(template);
    } catch (error: any) {
      res.status(500).json({ message: "Error updating email template: " + error.message });
    }
  });
  
  app.delete("/api/admin/email-templates/:id", requireAdmin, async (req, res) => {
    try {
      const success = await storage.deleteEmailTemplate(parseInt(req.params.id));
      if (!success) {
        return res.status(404).json({ message: "Email template not found" });
      }
      res.json({ message: "Email template deleted successfully" });
    } catch (error: any) {
      res.status(500).json({ message: "Error deleting email template: " + error.message });
    }
  });
  
  // IP Restrictions API endpoints
  app.get("/api/admin/ip-restrictions", requireAdmin, async (req, res) => {
    try {
      const restrictions = await storage.getAllIpRestrictions();
      res.json(restrictions);
    } catch (error: any) {
      res.status(500).json({ message: "Error fetching IP restrictions: " + error.message });
    }
  });
  
  app.get("/api/admin/ip-restrictions/:id", requireAdmin, async (req, res) => {
    try {
      const restriction = await storage.getIpRestriction(parseInt(req.params.id));
      if (!restriction) {
        return res.status(404).json({ message: "IP restriction not found" });
      }
      res.json(restriction);
    } catch (error: any) {
      res.status(500).json({ message: "Error fetching IP restriction: " + error.message });
    }
  });
  
  app.post("/api/admin/ip-restrictions", requireAdmin, async (req, res) => {
    try {
      const restriction = await storage.createIpRestriction(req.body);
      res.status(201).json(restriction);
    } catch (error: any) {
      res.status(500).json({ message: "Error creating IP restriction: " + error.message });
    }
  });
  
  app.patch("/api/admin/ip-restrictions/:id", requireAdmin, async (req, res) => {
    try {
      const restriction = await storage.updateIpRestriction(parseInt(req.params.id), req.body);
      if (!restriction) {
        return res.status(404).json({ message: "IP restriction not found" });
      }
      res.json(restriction);
    } catch (error: any) {
      res.status(500).json({ message: "Error updating IP restriction: " + error.message });
    }
  });
  
  app.delete("/api/admin/ip-restrictions/:id", requireAdmin, async (req, res) => {
    try {
      const success = await storage.deleteIpRestriction(parseInt(req.params.id));
      if (!success) {
        return res.status(404).json({ message: "IP restriction not found" });
      }
      res.json({ message: "IP restriction deleted successfully" });
    } catch (error: any) {
      res.status(500).json({ message: "Error deleting IP restriction: " + error.message });
    }
  });

  // SECURITY MANAGEMENT ROUTES
  
  // Admin Notifications API endpoints
  app.get("/api/admin/notifications", requireAdmin, async (req, res) => {
    try {
      console.log("[API] Fetching admin notifications for user:", req.user?.id);
      
      // Use Drizzle ORM
      const notifications = await storage.getAdminNotifications(req.user?.id);
      console.log("[API] Notifications results:", notifications);
      
      res.json(notifications);
    } catch (error: any) {
      console.error("[API] Error fetching notifications:", error);
      res.status(500).json({ message: "Error fetching notifications: " + error.message });
    }
  });
  
  app.post("/api/admin/notifications/mark-read", requireAdmin, async (req, res) => {
    try {
      const { notificationIds } = req.body;
      const success = await storage.markNotificationsAsRead(notificationIds);
      res.json({ success });
    } catch (error: any) {
      res.status(500).json({ message: "Error marking notifications as read: " + error.message });
    }
  });
  
  app.delete("/api/admin/notifications", requireAdmin, async (req, res) => {
    try {
      const { notificationIds } = req.body;
      const success = await storage.deleteNotifications(notificationIds);
      res.json({ success });
    } catch (error: any) {
      res.status(500).json({ message: "Error deleting notifications: " + error.message });
    }
  });
  
  // Login Attempts Management
  app.get("/api/admin/security/login-attempts", requireAdmin, async (req, res) => {
    try {
      const { limit, username } = req.query;
      
      let loginAttempts;
      if (username) {
        loginAttempts = await storage.getLoginAttempts(username as string, 24 * 60 * 60 * 1000);
      } else {
        // Get most recent login attempts
        loginAttempts = await storage.getAllLoginAttempts(parseInt(limit as string) || 100);
      }
      
      res.json(loginAttempts);
    } catch (error: any) {
      res.status(500).json({ message: "Error fetching login attempts: " + error.message });
    }
  });
  
  // Account Lock/Unlock Management
  // Get all locked accounts
  app.get("/api/admin/security/locked-accounts", requireAdmin, async (req, res) => {
    try {
      const lockedAccounts = await storage.getLockedAccounts();
      res.json(lockedAccounts);
    } catch (error: any) {
      res.status(500).json({ message: "Error fetching locked accounts: " + error.message });
    }
  });
  
  // Unlock an account
  app.post("/api/admin/security/unlock-account", requireAdmin, async (req, res) => {
    try {
      const { username } = req.body;
      
      if (!username) {
        return res.status(400).json({ message: "Username is required" });
      }
      
      // Method to unlock an account
      const result = await storage.unlockUserAccount(username);
      
      if (result) {
        // Log the action for audit
        await storage.createAuditLog({
          userId: req.user!.id,
          action: "unlock_account",
          details: `Account ${username} unlocked manually by admin`,
          ipAddress: req.ip || undefined,
          userAgent: req.get("User-Agent") || undefined
        });
        
        res.json({ message: "Account unlocked successfully" });
      } else {
        res.status(404).json({ message: "User not found or account is not locked" });
      }
    } catch (error: any) {
      res.status(500).json({ message: "Error unlocking account: " + error.message });
    }
  });
  
  // Active Sessions Management for admins
  app.get("/api/admin/security/user-sessions/:userId", requireAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Valid User ID is required" });
      }
      
      const sessions = await storage.getUserActiveSessions(userId);
      res.json(sessions);
    } catch (error: any) {
      res.status(500).json({ message: "Error fetching user sessions: " + error.message });
    }
  });
  
  // Get all active sessions across the platform for admin dashboard
  app.get("/api/admin/security/active-sessions", requireAdmin, async (req, res) => {
    try {
      // Get all active sessions from the database
      const sessions = await storage.getAllActiveSessions();
      
      // Add the current admin session if it's not already included
      const currentSessionExists = sessions.some(s => 
        s.sessionToken === req.sessionID || 
        (s.userId === req.user.id && s.ipAddress === req.ip)
      );
      
      if (!currentSessionExists) {
        // Include current admin session in the response
        const currentAdminSession = {
          id: 0, // Will be overridden if there's an ID collision
          sessionToken: req.sessionID,
          userId: req.user.id,
          username: req.user.username,
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
          isActive: true,
          createdAt: new Date(),
          lastActive: new Date(),
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 1 day from now
        };
        
        sessions.unshift(currentAdminSession);
      }
      
      res.json(sessions);
    } catch (error: any) {
      res.status(500).json({ message: "Error fetching active sessions: " + error.message });
    }
  });
  
  // User's view of their own sessions
  app.get("/api/user/sessions", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const sessions = await storage.getUserActiveSessions(req.user.id);
      res.json(sessions);
    } catch (error: any) {
      res.status(500).json({ message: "Error fetching sessions: " + error.message });
    }
  });
  
  // Terminate a specific session
  app.delete("/api/user/sessions/:sessionId", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const sessionId = parseInt(req.params.sessionId);
      
      if (isNaN(sessionId)) {
        return res.status(400).json({ message: "Invalid session ID" });
      }
      
      // Get all user's sessions
      const sessions = await storage.getUserActiveSessions(req.user.id);
      const session = sessions.find(s => s.id === sessionId);
      
      if (!session) {
        return res.status(404).json({ message: "Session not found or doesn't belong to you" });
      }
      
      // Don't allow terminating the current session through this endpoint
      if (session.sessionToken === req.sessionID) {
        return res.status(400).json({ message: "Cannot terminate current session via this endpoint" });
      }
      
      const result = await storage.terminateSession(sessionId);
      
      if (result) {
        res.json({ message: "Session terminated successfully" });
      } else {
        res.status(500).json({ message: "Failed to terminate session" });
      }
    } catch (error: any) {
      res.status(500).json({ message: "Error terminating session: " + error.message });
    }
  });
  
  // Terminate all sessions for a user except the current one
  app.delete("/api/user/sessions", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      // Get the current session token
      const currentSessionToken = req.sessionID;
      
      // Terminate all other sessions
      const result = await storage.terminateAllUserSessionsExcept(req.user.id, currentSessionToken);
      
      res.json({ message: `${result} session(s) terminated successfully` });
    } catch (error: any) {
      res.status(500).json({ message: "Error terminating sessions: " + error.message });
    }
  });
  
  // Admin can terminate all sessions for a user
  app.delete("/api/admin/security/user-sessions/:userId", requireAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Valid User ID is required" });
      }
      
      const result = await storage.terminateAllUserSessions(userId);
      
      res.json({ message: `${result} session(s) terminated successfully` });
    } catch (error: any) {
      res.status(500).json({ message: "Error terminating sessions: " + error.message });
    }
  });
  
  // Admin can terminate a specific session
  app.delete("/api/admin/security/session/:sessionId", requireAdmin, async (req, res) => {
    try {
      const sessionId = parseInt(req.params.sessionId);
      
      if (isNaN(sessionId)) {
        return res.status(400).json({ message: "Valid Session ID is required" });
      }
      
      // Don't allow admin to terminate their own session through this endpoint
      const sessions = await storage.getAllActiveSessions();
      const session = sessions.find(s => s.id === sessionId);
      
      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }
      
      if (session.sessionToken === req.sessionID) {
        return res.status(400).json({ message: "Cannot terminate your current session via this endpoint" });
      }
      
      const result = await storage.terminateSession(sessionId);
      
      if (result) {
        // Create audit log for this admin action
        await storage.createAuditLog({
          userId: req.user!.id,
          action: "terminate_session",
          details: `Session ${sessionId} for user ${session.username || session.userId} terminated by admin`,
          ipAddress: req.ip || undefined,
          userAgent: req.get("User-Agent") || undefined
        });
        
        res.json({ message: "Session terminated successfully" });
      } else {
        res.status(500).json({ message: "Failed to terminate session" });
      }
    } catch (error: any) {
      res.status(500).json({ message: "Error terminating session: " + error.message });
    }
  });

  // Dijital ürün için ödeme niyeti oluşturma endpoint'i
  app.post("/api/create-digital-product-payment", async (req, res) => {
    try {
      const { productId, quantity } = req.body;
      
      if (!productId || !quantity) {
        return res.status(400).json({ error: "Ürün ID ve miktar gereklidir" });
      }
      
      // Ürünü veritabanından al
      const [product] = await db.select()
        .from(digitalProducts)
        .where(eq(digitalProducts.id, productId));
      
      if (!product) {
        return res.status(404).json({ error: "Ürün bulunamadı" });
      }
      
      // Miktarı kontrol et
      if (quantity < product.minQuantity || quantity > product.maxQuantity) {
        return res.status(400).json({ 
          error: `Miktar ${product.minQuantity} ile ${product.maxQuantity} arasında olmalıdır`
        });
      }
      
      // Toplam fiyatı hesapla (cent olarak)
      const totalAmount = product.price * quantity;
      
      // Ödeme niyeti oluştur
      const stripe = getStripe();
      
      if (!stripe) {
        return res.status(500).json({ error: "Ödeme sistemi yapılandırması eksik" });
      }
      
      const paymentIntent = await stripe.paymentIntents.create({
        amount: totalAmount,
        currency: "try", // Türk Lirası
        metadata: {
          productId: product.id.toString(),
          productName: product.name,
          quantity: quantity.toString(),
          type: "digital_product"
        }
      });
      
      res.json({
        clientSecret: paymentIntent.client_secret,
        productDetails: {
          id: product.id,
          name: product.name,
          price: product.price / 100, // TL olarak göster
          quantity,
          totalAmount: totalAmount / 100, // TL olarak göster
        }
      });
    } catch (error: any) {
      console.error("Ödeme niyeti oluşturma hatası:", error);
      res.status(500).json({ error: "Ödeme başlatılırken bir hata oluştu" });
    }
  });
  
  // Ödeme başarılı webhook işleyicisi
  app.post("/webhook/stripe", async (req, res) => {
    const stripe = getStripe();
    if (!stripe) {
      return res.status(500).send("Stripe yapılandırması eksik");
    }
    
    const sig = req.headers["stripe-signature"];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
    
    if (!sig || !endpointSecret) {
      return res.status(400).send("Webhook imzası eksik");
    }
    
    let event;
    
    try {
      event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } catch (err: any) {
      console.error(`Webhook Error: ${err.message}`);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }
    
    if (event.type === "payment_intent.succeeded") {
      const paymentIntent = event.data.object;
      
      // Ödeme başarılı olduğunda siparişi işle
      if (paymentIntent.metadata.type === "digital_product") {
        try {
          const productId = parseInt(paymentIntent.metadata.productId);
          const quantity = parseInt(paymentIntent.metadata.quantity);
          const userId = req.user?.id || null;
          
          // Sipariş oluştur
          await db.insert(digitalProductOrders).values({
            userId,
            productId,
            quantity,
            totalPrice: paymentIntent.amount,
            status: "completed",
            paymentIntentId: paymentIntent.id,
            createdAt: new Date(),
            updatedAt: new Date()
          });
          
          // SMM API'sine siparişi gönderme işlemleri burada yapılacak
          // Bu işlemler ayrı bir API endpointi veya arka plan işi olarak da yapılabilir
        } catch (error) {
          console.error("Sipariş kaydetme hatası:", error);
        }
      }
    }
    
    res.json({ received: true });
  });

  const httpServer = createServer(app);

  return httpServer;
}
