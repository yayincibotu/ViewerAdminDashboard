/**
 * Stripe integration helper functions
 * Provides utilities for syncing data between the app database and Stripe
 */
import Stripe from "stripe";
import { db } from "./db";
import { subscription_plans } from "@shared/schema";
import { eq } from "drizzle-orm";
import { storage } from "./storage";

// Initialize Stripe if the API key is available
let stripe: Stripe | undefined;

if (process.env.STRIPE_SECRET_KEY) {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2023-10-16",
  });
}

/**
 * Check if Stripe is properly configured
 */
export function isStripeConfigured(): boolean {
  return !!stripe;
}

/**
 * Get Stripe instance (or undefined if not configured)
 */
export function getStripe(): Stripe | undefined {
  return stripe;
}

/**
 * Sync subscription plans with Stripe
 * Creates or updates products and prices in Stripe based on database plans
 */
export async function syncSubscriptionPlansWithStripe(): Promise<{
  success: boolean;
  message: string;
  results?: Array<{
    planId: number;
    planName: string;
    stripeProductId: string;
    stripePriceId: string;
    status: string;
  }>;
}> {
  if (!stripe) {
    return {
      success: false,
      message: "Stripe is not configured. Unable to sync subscription plans."
    };
  }

  try {
    const subscriptionPlans = await db.select().from(subscription_plans);
    
    const results = [];
    
    for (const plan of subscriptionPlans) {
      try {
        // Check if a product already exists for this plan
        let product;
        const productIdKey = `stripe_product_${plan.id}`;
        const existingProductId = await storage.getSystemConfigByKey(productIdKey);
        
        if (existingProductId?.value) {
          // Try to retrieve existing product
          try {
            product = await stripe.products.retrieve(existingProductId.value);
          } catch (e) {
            // Product doesn't exist, will create new one
            product = null;
          }
        }
        
        // Create a new product if needed
        if (!product) {
          product = await stripe.products.create({
            name: plan.name,
            description: plan.description || `${plan.name} - $${plan.price}`,
            metadata: {
              plan_id: plan.id.toString(),
              is_recurring: "true",
              billing_period: "monthly"
            },
            active: plan.isActive,
          });
          
          // Save the product ID in system_configs
          await storage.updateSystemConfig(productIdKey, product.id, 
            `Stripe product ID for plan: ${plan.name}`, 
            "stripe", false);
        } else {
          // Update existing product
          product = await stripe.products.update(product.id, {
            name: plan.name,
            description: plan.description || `${plan.name} - $${plan.price}`,
            active: plan.isActive,
          });
        }
        
        // Check if a price already exists
        let price;
        const priceIdKey = `stripe_price_${plan.id}`;
        const existingPriceId = await storage.getSystemConfigByKey(priceIdKey);
        
        if (existingPriceId?.value) {
          // Try to retrieve existing price
          try {
            price = await stripe.prices.retrieve(existingPriceId.value);
          } catch (e) {
            // Price doesn't exist, will create new one
            price = null;
          }
        }
        
        // Create a new price if needed
        if (!price) {
          price = await stripe.prices.create({
            product: product.id,
            unit_amount: Math.round(plan.price * 100), // Convert to cents
            currency: "usd",
            recurring: {
              interval: "month"
            },
            metadata: {
              plan_id: plan.id.toString()
            }
          });
          
          // Save the price ID in system_configs
          await storage.updateSystemConfig(priceIdKey, price.id, 
            `Stripe price ID for plan: ${plan.name}`, 
            "stripe", false);
        }
        
        // Update the plan with the Stripe price ID
        await db.update(subscription_plans)
          .set({ stripe_price_id: price.id })
          .where(eq(subscription_plans.id, plan.id));
        
        results.push({
          planId: plan.id,
          planName: plan.name,
          stripeProductId: product.id,
          stripePriceId: price.id,
          status: "success"
        });
      } catch (error: any) {
        console.error(`Error syncing plan ${plan.name} to Stripe:`, error);
        
        results.push({
          planId: plan.id,
          planName: plan.name,
          stripeProductId: "",
          stripePriceId: "",
          status: `error: ${error.message}`
        });
      }
    }
    
    return {
      success: true,
      message: `Synced ${results.filter(r => r.status === "success").length} of ${subscriptionPlans.length} plans successfully.`,
      results
    };
  } catch (error: any) {
    console.error("Error syncing subscription plans with Stripe:", error);
    return {
      success: false,
      message: `Failed to sync subscription plans: ${error.message}`
    };
  }
}

/**
 * Initialize Stripe with the provided API key
 * Updates the configuration and returns the status
 */
export async function initializeStripe(apiKey: string): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    const newStripe = new Stripe(apiKey, {
      apiVersion: "2023-10-16",
    });
    
    // Test the connection
    await newStripe.paymentMethods.list({ limit: 1 });
    
    // Success, update configuration
    stripe = newStripe;
    
    return {
      success: true,
      message: "Stripe successfully initialized with the provided API key."
    };
  } catch (error: any) {
    console.error("Error initializing Stripe:", error);
    return {
      success: false,
      message: `Failed to initialize Stripe: ${error.message}`
    };
  }
}