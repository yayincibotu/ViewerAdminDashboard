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

/**
 * SMM API Client - Inspired by PHP API client
 * This class handles all interactions with SMM provider APIs
 */
class SmmApiClient {
  private apiUrl: string;
  private apiKey: string;
  private useMockData: boolean;

  constructor(apiUrl: string, apiKey: string, useMockData: boolean = false) {
    this.apiUrl = apiUrl.replace(/\/$/, '');
    this.apiKey = apiKey;
    this.useMockData = useMockData || apiUrl.includes('testing') || apiKey.includes('test');
  }

  /**
   * Make a request to the SMM API - Exact PHP cURL implementation
   */
  private async connect(params: Record<string, any>): Promise<any> {
    // Mock response support for testing
    if (this.useMockData) {
      console.log("[SMM API] Using mock data for connection");
      
      // Return appropriate response based on action
      switch (params.action) {
        case 'services':
          return MOCK_SMM_SERVICES;
        case 'balance':
          return { balance: "1000.00", currency: "TRY" };
        case 'add':
          return { order: Math.floor(Math.random() * 10000000) };
        case 'status':
          if (params.order) {
            return {
              status: "Completed",
              charge: "10.80",
              start_count: 0,
              remains: 0,
              currency: "TRY"
            };
          } else if (params.orders) {
            const orders = params.orders.split(',');
            const result: Record<string, any> = {};
            
            orders.forEach((id: string) => {
              result[id] = {
                status: "Completed",
                charge: "10.80",
                start_count: 0,
                remains: 0,
                currency: "TRY"
              };
            });
            
            return result;
          }
          break;
        default:
          return { success: true, message: "API response" };
      }
    }

    try {
      // HepsiSosyal expects these exact parameters
      console.log("[SMM API] Connecting to HepsiSosyal API with:", params.action);
      
      // Create POST fields exactly like PHP code
      const postData = new URLSearchParams();
      
      // Add all parameters to the post fields
      Object.keys(params).forEach(key => {
        postData.append(key, params[key].toString());
      });
      
      console.log("[SMM API] Full request URL:", this.apiUrl);
      console.log("[SMM API] Request body:", postData.toString());
      
      // Use exact PHP curl options for compatibility
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'Mozilla/4.0 (compatible; MSIE 5.01; Windows NT 5.0)'
        },
        body: postData.toString(),
        redirect: 'follow'
      });
      
      const responseText = await response.text();
      
      // Log full API response for debugging
      console.log("[SMM API] Response status:", response.status);
      console.log("[SMM API] Response headers:", JSON.stringify(Object.fromEntries([...response.headers.entries()])));
      console.log("[SMM API] Raw response:", responseText);
      
      // Check if response is valid
      if (!responseText) {
        throw new Error("Empty response from API");
      }
      
      // Check if it's HTML (error page)
      if (responseText.includes('<!DOCTYPE') || responseText.includes('<html')) {
        throw new Error("API returned HTML instead of JSON");
      }
      
      // Parse the JSON response
      try {
        const jsonResult = JSON.parse(responseText);
        
        // Check for API error
        if (jsonResult.error) {
          throw new Error(jsonResult.error);
        }
        
        return jsonResult;
      } catch (parseError) {
        console.error("[SMM API] JSON parse error:", parseError);
        throw new Error(`Invalid JSON response: ${responseText.substring(0, 100)}`);
      }
    } catch (error: any) {
      console.error("[SMM API] Error making API request:", error.message);
      throw error;
    }
  }

  /**
   * Get list of services from the SMM provider
   * Exact implementation of the PHP services() method
   */
  async getServices(): Promise<any> {
    console.log("[SMM API] Getting services with API key:", this.apiKey.substring(0, 5) + '...');
    
    try {
      // Direct implementation of PHP's:
      // return json_decode(
      //   $this->connect([
      //     'key' => $this->api_key,
      //     'action' => 'services',
      //   ])
      // );
      const response = await this.connect({
        key: this.apiKey,
        action: 'services'
      });
      
      console.log("[SMM API] Services response type:", typeof response);
      
      // Successfully retrieved services
      return response;
    } catch (error) {
      console.error("[SMM API] Error getting services:", error);
      
      // Always provide test data when using test credentials
      if (this.useMockData || this.apiUrl.includes('test') || this.apiKey.includes('test')) {
        console.log("[SMM API] Falling back to test data for services");
        return MOCK_SMM_SERVICES;
      }
      
      throw error;
    }
  }

  /**
   * Get account balance from the SMM provider
   */
  async getBalance(): Promise<any> {
    return this.connect({
      key: this.apiKey,
      action: 'balance'
    });
  }

  /**
   * Place a new order with the SMM provider
   */
  async createOrder(orderData: Record<string, any>): Promise<any> {
    return this.connect({
      key: this.apiKey,
      action: 'add',
      ...orderData
    });
  }

  /**
   * Get status of a specific order
   */
  async getOrderStatus(orderId: number): Promise<any> {
    return this.connect({
      key: this.apiKey,
      action: 'status',
      order: orderId
    });
  }

  /**
   * Get status of multiple orders
   */
  async getMultipleOrderStatus(orderIds: number[]): Promise<any> {
    return this.connect({
      key: this.apiKey,
      action: 'status',
      orders: orderIds.join(',')
    });
  }
  
  /**
   * Request a refill for an order
   */
  async refillOrder(orderId: number): Promise<any> {
    return this.connect({
      key: this.apiKey,
      action: 'refill',
      order: orderId
    });
  }
}

// Helper function to test SMM API connection and get services
async function testSmmApiConnection(apiUrl: string, apiKey: string, useMockData: boolean = false) {
  try {
    const client = new SmmApiClient(apiUrl, apiKey, useMockData);
    return await client.getServices();
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
  try {
    // Ensure provider data is valid
    if (!provider || !provider.apiUrl || !provider.apiKey) {
      console.error("[SMM API] Invalid provider configuration:", provider);
      // Return mock data if API configuration is invalid
      if (useMockData || (provider && (provider.apiUrl?.includes('testing') || provider.apiKey?.includes('test')))) {
        console.log("[SMM API] Using mock data due to invalid provider config");
        return MOCK_SMM_SERVICES;
      }
      throw new Error("Invalid SMM provider configuration");
    }
    
    console.log("[SMM API] Getting services for provider:", provider.name);
    console.log("[SMM API] API URL:", provider.apiUrl);
    
    // Create client and get services
    const client = new SmmApiClient(provider.apiUrl, provider.apiKey, useMockData);
    const services = await client.getServices();
    
    // Add some debug info for troubleshooting
    console.log("[SMM API] Successfully retrieved services:", 
                Array.isArray(services) ? `${services.length} services found` : "Not an array");
    
    return services;
  } catch (error: any) {
    console.error("[SMM API] Error in getSmmServiceList:", error);
    
    // Return mock data if using test environment
    if (useMockData || (provider && (provider.apiUrl?.includes('testing') || provider.apiKey?.includes('test')))) {
      console.log("[SMM API] Using mock data due to error");
      return MOCK_SMM_SERVICES;
    }
    
    throw error;
  }
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
    const useMockData = req.query.mock === 'true' || apiUrl.includes('testing') || apiKey.includes('test');
    
    if (!apiUrl || !apiKey) {
      return res.status(400).json({ message: "API URL and API key are required" });
    }
    
    console.log("[SMM API] Testing connection with mock data:", useMockData);
    const result = await testSmmApiConnection(apiUrl, apiKey, useMockData);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

// Get available services from SMM provider without importing
router.get("/:id/services", requireAdmin, async (req: Request, res: Response) => {
  try {
    const providerId = parseInt(req.params.id);
    const testMode = req.query.mock === 'true';
    
    console.log("[SMM API] Getting services for provider ID:", providerId);
    
    // Get the provider from database
    const [provider] = await db.select().from(smmProviders)
      .where(eq(smmProviders.id, providerId));
    
    // Validate provider exists
    if (!provider) {
      return res.status(404).json({ message: "SMM provider not found" });
    }
    
    console.log("[SMM API] Provider details:", {
      name: provider.name,
      apiUrl: provider.apiUrl,
      keyExists: !!provider.apiKey
    });
    
    try {
      // Force test mode for specific URLs or when requested
      const useTestData = testMode || 
        provider.apiUrl.includes('test') || 
        provider.apiKey.includes('test');
      
      console.log("[SMM API] Test mode enabled:", useTestData);
      
      // Get services from provider
      const client = new SmmApiClient(provider.apiUrl, provider.apiKey, useTestData);
      const services = await client.getServices();
      
      console.log("[SMM API] Services retrieved:", typeof services, 
        Array.isArray(services) ? `Count: ${services.length}` : "Not an array");
      
      // Process and group services
      const groupedServices: {[key: string]: any[]} = {};
      
      if (Array.isArray(services)) {
        for (const service of services) {
          if (!service.name || !service.rate) {
            continue;
          }
          
          // Use the category from the service or extract from name or use default
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
      } else {
        console.error("[SMM API] Invalid services data format");
        throw new Error("Invalid services data format from API");
      }
      
      // Get available platforms from database
      const platformList = await db.select().from(platforms);
      
      return res.json({ 
        services: groupedServices,
        platforms: platformList
      });
    } catch (serviceError: any) {
      console.error("[SMM API] Error fetching services:", serviceError);
      
      // Always use test data for testing endpoints
      if (testMode || provider.apiUrl.includes('test') || provider.apiKey.includes('test')) {
        console.log("[SMM API] Using test data after error");
        
        // Group test services by category
        const groupedTestServices: {[key: string]: any[]} = {};
        
        for (const service of MOCK_SMM_SERVICES) {
          const category = service.category || 'Other';
          
          if (!groupedTestServices[category]) {
            groupedTestServices[category] = [];
          }
          
          groupedTestServices[category].push({
            id: service.service,
            name: service.name,
            rate: parseFloat(service.rate),
            min: service.min || 1,
            max: service.max || 1000,
            type: service.type || 'Default',
            category
          });
        }
        
        // Get platforms from database
        const platformList = await db.select().from(platforms);
        
        return res.json({ 
          services: groupedTestServices,
          platforms: platformList
        });
      }
      
      // Forward the error for actual API endpoints (not test)
      throw serviceError;
    }
  } catch (error: any) {
    console.error("[SMM API] Handler error:", error);
    res.status(500).json({ message: error.message || "Unknown error" });
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

// Get balance from SMM provider
router.get("/:id/balance", requireAdmin, async (req: Request, res: Response) => {
  try {
    const providerId = parseInt(req.params.id);
    const useMockData = req.query.mock === 'true';
    
    // Get the provider
    const [provider] = await db.select().from(smmProviders)
      .where(eq(smmProviders.id, providerId));
    
    if (!provider) {
      return res.status(404).json({ message: "SMM provider not found" });
    }
    
    try {
      // Create API client
      const apiClient = new SmmApiClient(provider.apiUrl, provider.apiKey, useMockData);
      
      // Get balance
      const balance = await apiClient.getBalance();
      
      return res.json(balance);
    } catch (error: any) {
      console.error("[SMM API] Error fetching balance:", error);
      res.status(400).json({ message: error.message });
    }
  } catch (error: any) {
    console.error("[SMM API] Handler error:", error);
    res.status(500).json({ message: error.message });
  }
});

// Create order with SMM provider
router.post("/:id/order", requireAdmin, async (req: Request, res: Response) => {
  try {
    const providerId = parseInt(req.params.id);
    const { serviceId, link, quantity, ...otherParams } = req.body;
    const useMockData = req.query.mock === 'true';
    
    // Validate input
    if (!serviceId || !link) {
      return res.status(400).json({ message: "Service ID and link are required" });
    }
    
    // Get the provider
    const [provider] = await db.select().from(smmProviders)
      .where(eq(smmProviders.id, providerId));
    
    if (!provider) {
      return res.status(404).json({ message: "SMM provider not found" });
    }
    
    try {
      // Create API client
      const apiClient = new SmmApiClient(provider.apiUrl, provider.apiKey, useMockData);
      
      // Prepare order data
      const orderData: Record<string, any> = {
        service: serviceId,
        link: link,
        ...otherParams
      };
      
      if (quantity) {
        orderData.quantity = quantity;
      }
      
      // Create order
      const orderResult = await apiClient.createOrder(orderData);
      
      return res.json(orderResult);
    } catch (error: any) {
      console.error("[SMM API] Error creating order:", error);
      res.status(400).json({ message: error.message });
    }
  } catch (error: any) {
    console.error("[SMM API] Handler error:", error);
    res.status(500).json({ message: error.message });
  }
});

// Get order status from SMM provider
router.get("/:id/order/:orderId", requireAdmin, async (req: Request, res: Response) => {
  try {
    const providerId = parseInt(req.params.id);
    const orderId = parseInt(req.params.orderId);
    const useMockData = req.query.mock === 'true';
    
    // Get the provider
    const [provider] = await db.select().from(smmProviders)
      .where(eq(smmProviders.id, providerId));
    
    if (!provider) {
      return res.status(404).json({ message: "SMM provider not found" });
    }
    
    try {
      // Create API client
      const apiClient = new SmmApiClient(provider.apiUrl, provider.apiKey, useMockData);
      
      // Get order status
      const orderStatus = await apiClient.getOrderStatus(orderId);
      
      return res.json(orderStatus);
    } catch (error: any) {
      console.error("[SMM API] Error fetching order status:", error);
      res.status(400).json({ message: error.message });
    }
  } catch (error: any) {
    console.error("[SMM API] Handler error:", error);
    res.status(500).json({ message: error.message });
  }
});

// Get multiple order statuses from SMM provider
router.post("/:id/orders/status", requireAdmin, async (req: Request, res: Response) => {
  try {
    const providerId = parseInt(req.params.id);
    const { orderIds } = req.body;
    const useMockData = req.query.mock === 'true';
    
    // Validate input
    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
      return res.status(400).json({ message: "Order IDs are required" });
    }
    
    // Get the provider
    const [provider] = await db.select().from(smmProviders)
      .where(eq(smmProviders.id, providerId));
    
    if (!provider) {
      return res.status(404).json({ message: "SMM provider not found" });
    }
    
    try {
      // Create API client
      const apiClient = new SmmApiClient(provider.apiUrl, provider.apiKey, useMockData);
      
      // Get multiple order statuses
      const orderStatuses = await apiClient.getMultipleOrderStatus(orderIds);
      
      return res.json(orderStatuses);
    } catch (error: any) {
      console.error("[SMM API] Error fetching order statuses:", error);
      res.status(400).json({ message: error.message });
    }
  } catch (error: any) {
    console.error("[SMM API] Handler error:", error);
    res.status(500).json({ message: error.message });
  }
});

// Request refill for an order
router.post("/:id/order/:orderId/refill", requireAdmin, async (req: Request, res: Response) => {
  try {
    const providerId = parseInt(req.params.id);
    const orderId = parseInt(req.params.orderId);
    const useMockData = req.query.mock === 'true';
    
    // Get the provider
    const [provider] = await db.select().from(smmProviders)
      .where(eq(smmProviders.id, providerId));
    
    if (!provider) {
      return res.status(404).json({ message: "SMM provider not found" });
    }
    
    try {
      // Create API client
      const apiClient = new SmmApiClient(provider.apiUrl, provider.apiKey, useMockData);
      
      // Request refill
      const refillResult = await apiClient.refillOrder(orderId);
      
      return res.json(refillResult);
    } catch (error: any) {
      console.error("[SMM API] Error requesting refill:", error);
      res.status(400).json({ message: error.message });
    }
  } catch (error: any) {
    console.error("[SMM API] Handler error:", error);
    res.status(500).json({ message: error.message });
  }
});

export default router;