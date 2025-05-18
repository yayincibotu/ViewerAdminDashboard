import express from "express";
import { z } from "zod";
import { db } from "../db";
import { eq } from "drizzle-orm";
import { pgTable, serial, text, boolean, timestamp } from "drizzle-orm/pg-core";

// Ürün kategorileri tablosu tanımı
export const productCategories = pgTable("product_categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

const router = express.Router();
export default router;

// Tüm kategorileri getir
router.get("/", async (req, res) => {
  try {
    const allCategories = await db.select().from(productCategories);
    res.json(allCategories);
  } catch (error: any) {
    console.error("Error fetching product categories:", error);
    res.status(500).json({ error: error.message });
  }
});

// Kategori ID'sine göre getir
router.get("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid category ID" });
    }

    const category = await db.select().from(productCategories).where(eq(productCategories.id, id));
    
    if (!category || category.length === 0) {
      return res.status(404).json({ error: "Category not found" });
    }
    
    res.json(category[0]);
  } catch (error: any) {
    console.error("Error fetching product category:", error);
    res.status(500).json({ error: error.message });
  }
});

// Yeni kategori oluştur - Sadece admin
router.post("/", async (req, res) => {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ error: "Unauthorized" });
  }
  
  try {
    // Request validasyonu
    const categorySchema = z.object({
      name: z.string().min(1, "Kategori adı gereklidir"),
      slug: z.string().min(1, "Slug değeri gereklidir"),
      description: z.string().optional(),
      isActive: z.boolean().optional().default(true),
    });
    
    const validatedData = categorySchema.parse(req.body);
    
    // Aynı slug ile kategori var mı kontrol et
    const existingCategory = await db
      .select()
      .from(productCategories)
      .where(eq(productCategories.slug, validatedData.slug));
    
    if (existingCategory && existingCategory.length > 0) {
      return res.status(400).json({ error: "Bu slug değeri ile bir kategori zaten mevcut" });
    }
    
    // Kategori oluştur
    const newCategory = await db.insert(productCategories).values({
      name: validatedData.name,
      slug: validatedData.slug,
      description: validatedData.description || null,
      isActive: validatedData.isActive,
    }).returning();
    
    res.status(201).json(newCategory[0]);
  } catch (error: any) {
    console.error("Error creating product category:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    res.status(500).json({ error: error.message });
  }
});

// Kategori güncelle - Sadece admin
router.patch("/:id", async (req, res) => {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ error: "Unauthorized" });
  }
  
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid category ID" });
    }
    
    // Request validasyonu
    const categorySchema = z.object({
      name: z.string().min(1).optional(),
      slug: z.string().min(1).optional(),
      description: z.string().optional().nullable(),
      isActive: z.boolean().optional(),
    });
    
    const validatedData = categorySchema.parse(req.body);
    
    // Kategori var mı kontrol et
    const existingCategory = await db
      .select()
      .from(productCategories)
      .where(eq(productCategories.id, id));
    
    if (!existingCategory || existingCategory.length === 0) {
      return res.status(404).json({ error: "Kategori bulunamadı" });
    }
    
    // Slug değişiyorsa, yeni slug kullanılıyor mu kontrol et
    if (validatedData.slug && validatedData.slug !== existingCategory[0].slug) {
      const slugCheck = await db
        .select()
        .from(productCategories)
        .where(eq(productCategories.slug, validatedData.slug));
      
      if (slugCheck && slugCheck.length > 0) {
        return res.status(400).json({ error: "Bu slug değeri ile bir kategori zaten mevcut" });
      }
    }
    
    // Kategoriyi güncelle
    const updatedCategory = await db
      .update(productCategories)
      .set({
        name: validatedData.name !== undefined ? validatedData.name : existingCategory[0].name,
        slug: validatedData.slug !== undefined ? validatedData.slug : existingCategory[0].slug,
        description: validatedData.description !== undefined ? validatedData.description : existingCategory[0].description,
        isActive: validatedData.isActive !== undefined ? validatedData.isActive : existingCategory[0].isActive,
        updatedAt: new Date(),
      })
      .where(eq(productCategories.id, id))
      .returning();
    
    res.json(updatedCategory[0]);
  } catch (error: any) {
    console.error("Error updating product category:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    res.status(500).json({ error: error.message });
  }
});

// Kategori sil - Sadece admin
productCategoriesRouter.delete("/:id", async (req, res) => {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ error: "Unauthorized" });
  }
  
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid category ID" });
    }
    
    // Kategori var mı kontrol et
    const existingCategory = await db
      .select()
      .from(productCategories)
      .where(eq(productCategories.id, id));
    
    if (!existingCategory || existingCategory.length === 0) {
      return res.status(404).json({ error: "Kategori bulunamadı" });
    }
    
    // Kategori sil
    await db.delete(productCategories).where(eq(productCategories.id, id));
    
    res.json({ success: true, message: "Kategori başarıyla silindi" });
  } catch (error: any) {
    console.error("Error deleting product category:", error);
    res.status(500).json({ error: error.message });
  }
});