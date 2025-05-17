/**
 * SMM Providers API Routes
 * Manages all operations related to SMM Provider integrations
 */
import { Request, Response, Router } from "express";
import { db } from "../db";
import { eq } from "drizzle-orm";
import { smmProviders, digitalProducts, platforms } from "@shared/schema";
import fetch from "node-fetch";

const router = Router();

// Middleware to check admin rights
const requireAdmin = (req: Request, res: Response, next: Function) => {
  if (!req.isAuthenticated() || req.user?.role !== "admin") {
    return res.status(403).json({ message: "Unauthorized access" });
  }
  next();
};

// Helper functions for SMM API integration
async function testSmmApiConnection(apiUrl: string, apiKey: string) {
  try {
    // API endpoint for service list (most SMM providers have this endpoint)
    const endpoint = `${apiUrl.replace(/\/$/, '')}/services`;
    
    // Common parameters for SMM panel APIs
    const params = new URLSearchParams({
      key: apiKey,
      action: 'services'
    });
    
    const response = await fetch(`${endpoint}?${params}`);
    
    if (!response.ok) {
      throw new Error(`API returned status ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error);
    }
    
    return data;
  } catch (error: any) {
    throw new Error(`SMM API connection failed: ${error.message}`);
  }
}

async function getSmmServiceList(provider: any) {
  return testSmmApiConnection(provider.apiUrl, provider.apiKey);
}

// Get all SMM providers
router.get("/", requireAdmin, async (req: Request, res: Response) => {
  try {
    const providers = await db.select().from(smmProviders);
    res.json(providers);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Add a new SMM provider
router.post("/", requireAdmin, async (req: Request, res: Response) => {
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
router.put("/:id", requireAdmin, async (req: Request, res: Response) => {
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
router.delete("/:id", requireAdmin, async (req: Request, res: Response) => {
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
router.post("/test-connection", requireAdmin, async (req: Request, res: Response) => {
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
router.post("/:id/import-services", requireAdmin, async (req: Request, res: Response) => {
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
    
    // Map services to platforms
    const availablePlatforms = await db.select().from(platforms);
    
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

export default router;