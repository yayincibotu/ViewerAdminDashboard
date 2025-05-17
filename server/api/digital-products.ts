/**
 * Digital Products API Routes
 * Manages all operations related to digital products in the SMM module
 */
import { Request, Response, Router } from "express";
import { db } from "../db";
import { eq } from "drizzle-orm";
import { digitalProducts, platforms } from "@shared/schema";

const router = Router();

// Middleware to check admin rights
const requireAdmin = (req: Request, res: Response, next: Function) => {
  if (!req.isAuthenticated() || req.user?.role !== "admin") {
    return res.status(403).json({ message: "Unauthorized access" });
  }
  next();
};

// Get all digital products
router.get("/", requireAdmin, async (req: Request, res: Response) => {
  try {
    const products = await db.select().from(digitalProducts);
    res.json(products);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Add a new digital product
router.post("/", requireAdmin, async (req: Request, res: Response) => {
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
router.put("/:id", requireAdmin, async (req: Request, res: Response) => {
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
router.delete("/:id", requireAdmin, async (req: Request, res: Response) => {
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

export default router;