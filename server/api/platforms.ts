import express from "express";
import { z } from "zod";
import { db } from "../db";
import { platforms } from "@shared/schema";
import { eq } from "drizzle-orm";

export const platformsRouter = express.Router();

// Get all platforms
platformsRouter.get("/", async (req, res) => {
  try {
    const allPlatforms = await db.select().from(platforms);
    res.json(allPlatforms);
  } catch (error: any) {
    console.error("Error fetching platforms:", error);
    res.status(500).json({ error: error.message });
  }
});

// Get platform by ID
platformsRouter.get("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid platform ID" });
    }

    const platform = await db.select().from(platforms).where(eq(platforms.id, id));
    
    if (!platform || platform.length === 0) {
      return res.status(404).json({ error: "Platform not found" });
    }
    
    res.json(platform[0]);
  } catch (error: any) {
    console.error("Error fetching platform:", error);
    res.status(500).json({ error: error.message });
  }
});

// Create new platform - Admin only
platformsRouter.post("/", async (req, res) => {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ error: "Unauthorized" });
  }
  
  try {
    // Validate request body
    const platformSchema = z.object({
      name: z.string().min(1, "Platform name is required"),
      slug: z.string().min(1, "Slug is required"),
      description: z.string().optional(),
      iconClass: z.string().optional(),
      bgColor: z.string().optional(),
      isActive: z.boolean().optional().default(true),
    });
    
    const validatedData = platformSchema.parse(req.body);
    
    // Check if platform with this slug already exists
    const existingPlatform = await db
      .select()
      .from(platforms)
      .where(eq(platforms.slug, validatedData.slug));
    
    if (existingPlatform && existingPlatform.length > 0) {
      return res.status(400).json({ error: "A platform with this slug already exists" });
    }
    
    // Create platform
    const newPlatform = await db.insert(platforms).values({
      name: validatedData.name,
      slug: validatedData.slug,
      description: validatedData.description || null,
      iconClass: validatedData.iconClass || null,
      bgColor: validatedData.bgColor || null,
      isActive: validatedData.isActive,
    }).returning();
    
    res.status(201).json(newPlatform[0]);
  } catch (error: any) {
    console.error("Error creating platform:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    res.status(500).json({ error: error.message });
  }
});

// Update platform - Admin only
platformsRouter.patch("/:id", async (req, res) => {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ error: "Unauthorized" });
  }
  
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid platform ID" });
    }
    
    // Validate request body
    const platformSchema = z.object({
      name: z.string().min(1).optional(),
      slug: z.string().min(1).optional(),
      description: z.string().optional().nullable(),
      iconClass: z.string().optional().nullable(),
      bgColor: z.string().optional().nullable(),
      isActive: z.boolean().optional(),
    });
    
    const validatedData = platformSchema.parse(req.body);
    
    // Check if platform exists
    const existingPlatform = await db
      .select()
      .from(platforms)
      .where(eq(platforms.id, id));
    
    if (!existingPlatform || existingPlatform.length === 0) {
      return res.status(404).json({ error: "Platform not found" });
    }
    
    // If slug is changing, check if new slug is already in use
    if (validatedData.slug && validatedData.slug !== existingPlatform[0].slug) {
      const slugCheck = await db
        .select()
        .from(platforms)
        .where(eq(platforms.slug, validatedData.slug));
      
      if (slugCheck && slugCheck.length > 0) {
        return res.status(400).json({ error: "A platform with this slug already exists" });
      }
    }
    
    // Update platform
    const updatedPlatform = await db
      .update(platforms)
      .set({
        name: validatedData.name !== undefined ? validatedData.name : existingPlatform[0].name,
        slug: validatedData.slug !== undefined ? validatedData.slug : existingPlatform[0].slug,
        description: validatedData.description !== undefined ? validatedData.description : existingPlatform[0].description,
        iconClass: validatedData.iconClass !== undefined ? validatedData.iconClass : existingPlatform[0].iconClass,
        bgColor: validatedData.bgColor !== undefined ? validatedData.bgColor : existingPlatform[0].bgColor,
        isActive: validatedData.isActive !== undefined ? validatedData.isActive : existingPlatform[0].isActive,
        updatedAt: new Date(),
      })
      .where(eq(platforms.id, id))
      .returning();
    
    res.json(updatedPlatform[0]);
  } catch (error: any) {
    console.error("Error updating platform:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    res.status(500).json({ error: error.message });
  }
});

// Delete platform - Admin only
platformsRouter.delete("/:id", async (req, res) => {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ error: "Unauthorized" });
  }
  
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid platform ID" });
    }
    
    // Check if platform exists
    const existingPlatform = await db
      .select()
      .from(platforms)
      .where(eq(platforms.id, id));
    
    if (!existingPlatform || existingPlatform.length === 0) {
      return res.status(404).json({ error: "Platform not found" });
    }
    
    // Delete platform
    await db.delete(platforms).where(eq(platforms.id, id));
    
    res.json({ success: true, message: "Platform deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting platform:", error);
    res.status(500).json({ error: error.message });
  }
});