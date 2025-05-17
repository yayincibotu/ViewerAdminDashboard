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

// Mock data for testing without real SMM API
const MOCK_SMM_SERVICES = [
  { service: 1, name: "Instagram Takipçiler | Max: 5K | Hızlı", category: "Instagram", type: "Default", rate: "10.80", min: 100, max: 5000 },
  { service: 2, name: "Instagram Beğeniler | Max: 10K | Normal", category: "Instagram", type: "Default", rate: "5.20", min: 50, max: 10000 },
  { service: 3, name: "Instagram Yorumlar | Max: 500 | Yavaş", category: "Instagram", type: "Custom Comments", rate: "25.00", min: 10, max: 500 },
  { service: 4, name: "Twitch Takipçiler | Max: 1K | Gerçek", category: "Twitch", type: "Default", rate: "18.00", min: 100, max: 1000 },
  { service: 5, name: "Twitch İzleyiciler | Max: 500 | Canlı", category: "Twitch", type: "Default", rate: "30.00", min: 10, max: 500 },
  { service: 6, name: "Twitch Sohbet Mesajları | Max: 200 | Gerçek", category: "Twitch", type: "Default", rate: "15.00", min: 10, max: 200 },
  { service: 7, name: "YouTube Aboneler | Max: 2K | Yüksek Kaliteli", category: "YouTube", type: "Default", rate: "45.00", min: 100, max: 2000 },
  { service: 8, name: "YouTube İzlenmeler | Max: 50K | Garantili", category: "YouTube", type: "Default", rate: "8.00", min: 500, max: 50000 },
  { service: 9, name: "YouTube Beğeniler | Max: 5K | Hızlı", category: "YouTube", type: "Default", rate: "12.50", min: 50, max: 5000 },
  { service: 10, name: "TikTok Takipçiler | Max: 10K | Normal", category: "TikTok", type: "Default", rate: "15.80", min: 100, max: 10000 },
  { service: 11, name: "TikTok Beğeniler | Max: 20K | Hızlı", category: "TikTok", type: "Default", rate: "6.40", min: 100, max: 20000 },
  { service: 12, name: "TikTok İzlenmeler | Max: 100K | Bot", category: "TikTok", type: "Default", rate: "3.20", min: 1000, max: 100000 },
  { service: 13, name: "Facebook Sayfa Beğenileri | Max: 3K | Garantili", category: "Facebook", type: "Default", rate: "35.00", min: 100, max: 3000 },
  { service: 14, name: "Facebook Gönderi Beğenileri | Max: 5K | Hızlı", category: "Facebook", type: "Default", rate: "8.50", min: 50, max: 5000 },
  { service: 15, name: "Twitter Takipçiler | Max: 2K | Kaliteli", category: "Twitter", type: "Default", rate: "20.00", min: 100, max: 2000 },
  { service: 16, name: "Twitter Retweet | Max: 1K | Normal", category: "Twitter", type: "Default", rate: "12.00", min: 10, max: 1000 },
  { service: 17, name: "Twitter Beğeniler | Max: 5K | Hızlı", category: "Twitter", type: "Default", rate: "7.50", min: 50, max: 5000 },
  { service: 18, name: "Kick İzleyiciler | Max: 300 | Gerçek", category: "Kick", type: "Default", rate: "50.00", min: 10, max: 300 },
  { service: 19, name: "Kick Takipçiler | Max: 1K | Normal", category: "Kick", type: "Default", rate: "25.00", min: 100, max: 1000 },
  { service: 20, name: "VK Play İzleyiciler | Max: 200 | Kaliteli", category: "VKPlay", type: "Default", rate: "40.00", min: 10, max: 200 }
];

// Helper functions for SMM API integration
async function testSmmApiConnection(apiUrl: string, apiKey: string, useMockData: boolean = false) {
  try {
    if (useMockData || apiUrl.includes('testing') || apiKey.includes('test')) {
      console.log("[SMM API] Using mock data for testing");
      // Return mock data for testing purposes
      return MOCK_SMM_SERVICES;
    }
    
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
    // If there's an error but useMockData is true or test keys are being used, provide mock data
    if (useMockData || apiUrl.includes('testing') || apiKey.includes('test')) {
      console.log("[SMM API] Error encountered but providing mock data");
      return MOCK_SMM_SERVICES;
    }
    throw new Error(`SMM API connection failed: ${error.message}`);
  }
}

async function getSmmServiceList(provider: any, useMockData: boolean = false) {
  return testSmmApiConnection(provider.apiUrl, provider.apiKey, useMockData);
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

// Get available services from SMM provider without importing
router.get("/:id/services", requireAdmin, async (req: Request, res: Response) => {
  try {
    const providerId = parseInt(req.params.id);
    const useMockData = req.query.mock === 'true';
    
    // Get the provider
    const [provider] = await db.select().from(smmProviders)
      .where(eq(smmProviders.id, providerId));
    
    if (!provider) {
      return res.status(404).json({ message: "SMM provider not found" });
    }
    
    // Get services from the SMM provider
    const services = await getSmmServiceList(provider, useMockData);
    
    // Group services by platform/category
    const groupedServices: {[key: string]: any[]} = {};
    
    for (const service of services) {
      if (!service.name || !service.category || !service.rate) {
        continue;
      }
      
      // Use the category from the service or extract from name
      const category = service.category || 'Other';
      
      if (!groupedServices[category]) {
        groupedServices[category] = [];
      }
      
      groupedServices[category].push({
        id: service.service,
        name: service.name,
        rate: parseFloat(service.rate),
        min: service.min || 1,
        max: service.max || 1000,
        type: service.type || 'Default',
        category
      });
    }
    
    // Get available platforms
    const platforms = await db.select().from(platforms);
    
    res.json({ 
      services: groupedServices,
      platforms
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Import selected services from SMM provider
router.post("/:id/import-services", requireAdmin, async (req: Request, res: Response) => {
  try {
    const providerId = parseInt(req.params.id);
    const { serviceIds, platformFilter, useMockData } = req.body;
    
    // Validate input
    if (!serviceIds || !Array.isArray(serviceIds) || serviceIds.length === 0) {
      return res.status(400).json({ message: "Service IDs are required for import" });
    }
    
    // Get the provider
    const [provider] = await db.select().from(smmProviders)
      .where(eq(smmProviders.id, providerId));
    
    if (!provider) {
      return res.status(404).json({ message: "SMM provider not found" });
    }
    
    // Get all services from the SMM provider
    const allServices = await getSmmServiceList(provider, useMockData === true);
    
    // Filter services based on provided serviceIds
    const servicesToImport = allServices.filter((service: any) => 
      serviceIds.includes(service.service.toString())
    );
    
    if (servicesToImport.length === 0) {
      return res.status(404).json({ message: "No matching services found to import" });
    }
    
    // Get available platforms
    const availablePlatforms = await db.select().from(platforms);
    
    // Track number of imported services
    let importedCount = 0;
    const importResults = [];
    
    // Process each service
    for (const service of servicesToImport) {
      // Skip if service doesn't have necessary fields
      if (!service.name || !service.rate) {
        importResults.push({
          id: service.service,
          name: service.name || 'Unknown',
          status: 'skipped',
          reason: 'Missing required fields'
        });
        continue;
      }
      
      // Find matching platform
      let platformId = null;
      
      // If a specific platform is requested for this service
      if (platformFilter && platformFilter[service.service]) {
        platformId = platformFilter[service.service];
      } else {
        // Otherwise try to match by name
        for (const platform of availablePlatforms) {
          if (service.name.toLowerCase().includes(platform.name.toLowerCase())) {
            platformId = platform.id;
            break;
          }
        }
      }
      
      // Skip if no matching platform found
      if (!platformId) {
        importResults.push({
          id: service.service,
          name: service.name,
          status: 'skipped',
          reason: 'No matching platform found'
        });
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
              price: Math.round(parseFloat(service.rate) * 100), // Convert to cents
              minQuantity: service.min || 1,
              maxQuantity: service.max || 1000,
              updatedAt: new Date(),
            })
            .where(eq(digitalProducts.externalServiceId, service.service.toString()));
            
          importedCount++;
          importResults.push({
            id: service.service,
            name: service.name,
            status: 'updated'
          });
        } else {
          // Determine category (followers, likes, etc.)
          let category = "other";
          const name = service.name.toLowerCase();
          
          if (name.includes("takipçi") || name.includes("follower")) {
            category = "followers";
          } else if (name.includes("beğeni") || name.includes("like")) {
            category = "likes";
          } else if (name.includes("izlenme") || name.includes("view")) {
            category = "views";
          } else if (name.includes("yorum") || name.includes("comment")) {
            category = "comments";
          } else if (name.includes("abone") || name.includes("subscriber")) {
            category = "subscribers";
          }
          
          // Create new product
          await db.insert(digitalProducts)
            .values({
              name: service.name,
              description: service.name,
              price: Math.round(parseFloat(service.rate) * 100), // Convert to cents
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
          importResults.push({
            id: service.service,
            name: service.name,
            status: 'imported'
          });
        }
      } catch (err: any) {
        console.error(`Error importing service ${service.name}:`, err);
        importResults.push({
          id: service.service,
          name: service.name,
          status: 'error',
          reason: err.message
        });
      }
    }
    
    res.json({ 
      message: `Successfully imported ${importedCount} services from ${provider.name}`,
      importedCount,
      results: importResults
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

export default router;