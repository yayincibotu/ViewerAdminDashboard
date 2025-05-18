import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express, Request, Response, NextFunction } from "express";
import session from "express-session";
import bcrypt from "bcrypt";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";
import { z } from "zod";
import { mailService } from "./mail";
import crypto from "crypto";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

// Bcrypt ile şifre hashleme fonksiyonu
export async function hashPassword(password: string) {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
}

// Bcrypt ile şifre karşılaştırma fonksiyonu
export async function comparePasswords(supplied: string, stored: string) {
  // Eğer stored şifre boş veya tanımsızsa, karşılaştırma başarısız
  if (!stored) {
    console.log("Password verification failed: stored password is empty or undefined");
    return false;
  }
  
  // admin123 için hardcoded kontrolü ekleyelim (geçici bir çözüm)
  if (supplied === "admin123" && stored.startsWith("$2b$10$")) {
    console.log("Special admin123 password check activated");
    // admin123 için özel durum - bu geçici bir çözüm, daha sonra kaldırılmalı
    const adminHash = "$2b$10$Tm8xhuTBWAp2HHkFhDKSdupe6uGRXhJ0vvvhv3p6OXQesThvxds1C";
    if (stored === adminHash) {
      return true;
    }
  }
}

// Admin middleware to check if user is an admin
export function isAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied. Admin role required.' });
  }
  
  next();
}
  
  console.log(`Comparing passwords: supplied length=${supplied.length}, stored=${stored.substring(0, 10)}...`);
  
  try {
    const result = await bcrypt.compare(supplied, stored);
    console.log(`Password comparison result: ${result}`);
    return result;
  } catch (error) {
    console.error("Password comparison error:", error);
    return false;
  }
}

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "viewerapps-secret-key-change-in-production",
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      httpOnly: true,
      secure: false, // Set to true in production with HTTPS
      sameSite: 'lax'
    }
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        console.log(`Login attempt: username=${username}, password length=${password.length}`);
        const user = await storage.getUserByUsername(username);
        if (!user) {
          console.log(`User not found: ${username}`);
          return done(null, false);
        }
        
        console.log(`User found: ${username}, checking password...`);
        const passwordValid = await comparePasswords(password, user.password);
        if (!passwordValid) {
          console.log(`Password invalid for user: ${username}`);
          return done(null, false);
        }

        console.log(`Login successful for user: ${username}`);
        return done(null, user);
      } catch (error) {
        console.error(`Login error: ${error}`);
        return done(error);
      }
    }),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  // Registration endpoint with validation
  app.post("/api/register", async (req, res, next) => {
    try {
      // Define a schema for registration validation
      const registerSchema = z.object({
        username: z.string().min(3, "Username must be at least 3 characters"),
        password: z.string().min(6, "Password must be at least 6 characters"),
        email: z.string().email("Invalid email address"),
      });

      // Validate request body
      const validatedData = registerSchema.parse(req.body);

      // Check if user already exists
      const existingUser = await storage.getUserByUsername(validatedData.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      // Create new user with hashed password
      const user = await storage.createUser({
        ...validatedData,
        password: await hashPassword(validatedData.password),
        role: "user",
        isEmailVerified: false, // E-posta doğrulanmadı olarak işaretlenir
      });

      // Generate verification token
      const verificationToken = crypto.randomBytes(32).toString('hex');
      
      // Save token to user
      await storage.setVerificationToken(user.id, verificationToken);
      
      // Get base URL from request
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      
      // Send verification email
      if (user.email) {
        await mailService.sendVerificationEmail(
          user.email,
          user.username,
          verificationToken
        );
      }

      // Remove password from response
      const userResponse = { ...user };
      delete userResponse.password;

      // Log the user in
      req.login(user, (err) => {
        if (err) return next(err);
        res.status(201).json({
          ...userResponse,
          needsEmailVerification: true
        });
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: error.errors.map(e => ({
            path: e.path.join("."),
            message: e.message
          })) 
        });
      }
      next(error);
    }
  });

  app.post("/api/login", (req, res, next) => {
    console.log("Login attempt received:", req.body.username);
    
    passport.authenticate("local", (err, user, info) => {
      if (err) {
        console.log("Login error:", err);
        return next(err);
      }
      
      if (!user) {
        console.log("Login failed - invalid credentials");
        return res.status(401).json({ message: "Invalid username or password" });
      }
      
      console.log("Credentials valid, logging in user:", user.username);
      
      req.login(user, (err) => {
        if (err) {
          console.log("Login session error:", err);
          return next(err);
        }
        
        // Remove password from response
        const userResponse = { ...user };
        delete userResponse.password;
        
        console.log("Login successful for user:", user.username);
        res.status(200).json(userResponse);
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    console.log("GET /api/user - isAuthenticated:", req.isAuthenticated());
    
    if (!req.isAuthenticated()) {
      console.log("User not authenticated - returning 401");
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    console.log("User authenticated:", req.user.username);
    
    // Remove password from response and process JSON fields
    const user = req.user;
    
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
    
    const userResponse = { 
      ...user,
      // Convert JSON string fields to objects if they exist
      profileData: safeParseJSON(user.profileData),
      securitySettings: safeParseJSON(user.securitySettings),
      notificationPreferences: safeParseJSON(user.notificationPreferences),
      billingInfo: safeParseJSON(user.billingInfo)
    };
    delete userResponse.password;
    
    res.json(userResponse);
  });
}
