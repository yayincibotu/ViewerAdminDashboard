import express from "express";
import { z } from "zod";
import { db } from "../db";
import { eq, and, desc, asc, sql } from "drizzle-orm";
import { digitalProducts, platforms, productCategories } from "@shared/schema";

const router = express.Router();

// Tüm dijital ürünleri getir - açık uçlu (public) endpoint
router.get('/digital-products', async (req, res) => {
  try {
    const products = await db.select({
      id: digitalProducts.id,
      name: digitalProducts.name,
      description: digitalProducts.description,
      price: digitalProducts.price,
      category: {
        id: productCategories.id,
        name: productCategories.name,
        slug: productCategories.slug
      },
      platform: {
        id: platforms.id,
        name: platforms.name,
        slug: platforms.slug,
        iconClass: platforms.iconClass
      },
      isActive: digitalProducts.isActive,
      minQuantity: digitalProducts.minQuantity,
      maxQuantity: digitalProducts.maxQuantity,
      serviceType: digitalProducts.serviceType,
      createdAt: digitalProducts.createdAt,
      updatedAt: digitalProducts.updatedAt
    })
    .from(digitalProducts)
    .innerJoin(platforms, eq(digitalProducts.platformId, platforms.id))
    .innerJoin(productCategories, eq(digitalProducts.category, productCategories.slug))
    .where(eq(digitalProducts.isActive, true))
    .orderBy(desc(digitalProducts.sortOrder));

    // Yeni dijital ürün formatını eski mağaza formatına dönüştür
    const enrichedProducts = products.map(product => ({
      ...product,
      originalPrice: Math.round(product.price * 1.2) / 100, // Örnek indirim %20
      price: product.price / 100, // Cent -> TL dönüşümü
      discountPercentage: 20, // Örnek sabit indirim yüzdesi
      isFeatured: Math.random() > 0.7, // Rastgele öne çıkan ürünler
      popularityScore: Math.floor(Math.random() * 100), // Rastgele popülerlik puanı
      minOrder: product.minQuantity,
      maxOrder: product.maxQuantity,
      deliveryTime: "1-2 saat", // Varsayılan teslimat süresi
      deliverySpeed: "Normal" // Varsayılan teslimat hızı
    }));

    res.json(enrichedProducts);
  } catch (error) {
    console.error('Digital products fetch error:', error);
    res.status(500).json({ error: 'Dijital ürünler yüklenirken bir hata oluştu' });
  }
});

// ID'ye göre dijital ürün getir
router.get('/digital-products/:id', async (req, res) => {
  const id = Number(req.params.id);
  
  if (isNaN(id)) {
    return res.status(400).json({ error: 'Geçersiz ürün ID' });
  }
  
  try {
    const [product] = await db.select({
      id: digitalProducts.id,
      name: digitalProducts.name,
      description: digitalProducts.description,
      price: digitalProducts.price,
      category: {
        id: productCategories.id,
        name: productCategories.name,
        slug: productCategories.slug
      },
      platform: {
        id: platforms.id,
        name: platforms.name,
        slug: platforms.slug,
        iconClass: platforms.iconClass
      },
      isActive: digitalProducts.isActive,
      minQuantity: digitalProducts.minQuantity,
      maxQuantity: digitalProducts.maxQuantity,
      serviceType: digitalProducts.serviceType,
      createdAt: digitalProducts.createdAt,
      updatedAt: digitalProducts.updatedAt
    })
    .from(digitalProducts)
    .innerJoin(platforms, eq(digitalProducts.platformId, platforms.id))
    .innerJoin(productCategories, eq(digitalProducts.category, productCategories.slug))
    .where(eq(digitalProducts.id, id));
    
    if (!product) {
      return res.status(404).json({ error: 'Ürün bulunamadı' });
    }
    
    // Ürün verilerini mağaza için biçimlendir
    const enrichedProduct = {
      ...product,
      longDescription: "Bu ürün, sosyal medya etkileşimlerinizi artırmak için tasarlanmış profesyonel bir hizmettir. " +
        "Hesabınızın organik görünümlü ve kaliteli etkileşimlerle büyümesini sağlar. " +
        "Tamamen güvenli ve platformun kurallarına uygun şekilde çalışır.",
      originalPrice: Math.round(product.price * 1.2) / 100, // Örnek indirim %20
      price: product.price / 100, // Cent -> TL dönüşümü
      discountPercentage: 20, // Örnek sabit indirim yüzdesi
      isFeatured: Math.random() > 0.7, // Rastgele öne çıkan ürünleri
      popularityScore: Math.floor(Math.random() * 100), // Rastgele popülerlik puanı
      minOrder: product.minQuantity,
      maxOrder: product.maxQuantity,
      deliveryTime: "1-2 saat", // Varsayılan teslimat süresi
      deliverySpeed: "Normal", // Varsayılan teslimat hızı
      satisfactionRate: 98, // Varsayılan memnuniyet oranı
    };
    
    res.json(enrichedProduct);
  } catch (error) {
    console.error('Digital product fetch error:', error);
    res.status(500).json({ error: 'Dijital ürün yüklenirken bir hata oluştu' });
  }
});

// Platform'a göre ürünleri getir
router.get('/digital-products/platform/:slug', async (req, res) => {
  const platformSlug = req.params.slug;
  
  try {
    const products = await db.select({
      id: digitalProducts.id,
      name: digitalProducts.name,
      description: digitalProducts.description,
      price: digitalProducts.price,
      platform: {
        id: platforms.id,
        name: platforms.name,
        slug: platforms.slug,
        iconClass: platforms.iconClass
      },
      category: {
        id: productCategories.id,
        name: productCategories.name,
        slug: productCategories.slug
      },
      isActive: digitalProducts.isActive,
      minQuantity: digitalProducts.minQuantity,
      maxQuantity: digitalProducts.maxQuantity,
      serviceType: digitalProducts.serviceType,
      createdAt: digitalProducts.createdAt,
      updatedAt: digitalProducts.updatedAt
    })
    .from(digitalProducts)
    .innerJoin(platforms, eq(digitalProducts.platformId, platforms.id))
    .innerJoin(productCategories, eq(digitalProducts.category, productCategories.slug))
    .where(
      and(
        eq(digitalProducts.isActive, true),
        eq(platforms.slug, platformSlug)
      )
    )
    .orderBy(desc(digitalProducts.sortOrder));
    
    // Ürünleri mağaza için biçimlendir
    const enrichedProducts = products.map(product => ({
      ...product,
      originalPrice: Math.round(product.price * 1.2) / 100, // Örnek indirim %20
      price: product.price / 100, // Cent -> TL dönüşümü
      discountPercentage: 20, // Örnek sabit indirim yüzdesi
      isFeatured: Math.random() > 0.7, // Rastgele öne çıkan ürünleri
      popularityScore: Math.floor(Math.random() * 100), // Rastgele popülerlik puanı
      minOrder: product.minQuantity,
      maxOrder: product.maxQuantity,
      deliveryTime: "1-2 saat", // Varsayılan teslimat süresi
      deliverySpeed: "Normal" // Varsayılan teslimat hızı
    }));
    
    res.json(enrichedProducts);
  } catch (error) {
    console.error('Platform products fetch error:', error);
    res.status(500).json({ error: 'Platform ürünleri yüklenirken bir hata oluştu' });
  }
});

// Kategoriye göre ürünleri getir
router.get('/digital-products/category/:slug', async (req, res) => {
  const categorySlug = req.params.slug;
  
  try {
    const products = await db.select({
      id: digitalProducts.id,
      name: digitalProducts.name,
      description: digitalProducts.description,
      price: digitalProducts.price,
      platform: {
        id: platforms.id,
        name: platforms.name,
        slug: platforms.slug,
        iconClass: platforms.iconClass
      },
      category: {
        id: productCategories.id,
        name: productCategories.name,
        slug: productCategories.slug
      },
      isActive: digitalProducts.isActive,
      minQuantity: digitalProducts.minQuantity,
      maxQuantity: digitalProducts.maxQuantity,
      serviceType: digitalProducts.serviceType,
      createdAt: digitalProducts.createdAt,
      updatedAt: digitalProducts.updatedAt
    })
    .from(digitalProducts)
    .innerJoin(platforms, eq(digitalProducts.platformId, platforms.id))
    .innerJoin(productCategories, eq(digitalProducts.category, productCategories.slug))
    .where(
      and(
        eq(digitalProducts.isActive, true),
        eq(productCategories.slug, categorySlug)
      )
    )
    .orderBy(desc(digitalProducts.sortOrder));
    
    // Ürünleri mağaza için biçimlendir
    const enrichedProducts = products.map(product => ({
      ...product,
      originalPrice: Math.round(product.price * 1.2) / 100, // Örnek indirim %20
      price: product.price / 100, // Cent -> TL dönüşümü
      discountPercentage: 20, // Örnek sabit indirim yüzdesi
      isFeatured: Math.random() > 0.7, // Rastgele öne çıkan ürünleri
      popularityScore: Math.floor(Math.random() * 100), // Rastgele popülerlik puanı
      minOrder: product.minQuantity,
      maxOrder: product.maxQuantity,
      deliveryTime: "1-2 saat", // Varsayılan teslimat süresi
      deliverySpeed: "Normal" // Varsayılan teslimat hızı
    }));
    
    res.json(enrichedProducts);
  } catch (error) {
    console.error('Category products fetch error:', error);
    res.status(500).json({ error: 'Kategori ürünleri yüklenirken bir hata oluştu' });
  }
});

// İlgili ürünleri getir
router.get('/digital-products/related/:id', async (req, res) => {
  const id = Number(req.params.id);
  
  if (isNaN(id)) {
    return res.status(400).json({ error: 'Geçersiz ürün ID' });
  }
  
  try {
    // Önce mevcut ürünün platform ve kategori değerlerini al
    const [currentProduct] = await db.select({
      platformId: digitalProducts.platformId,
      category: digitalProducts.category,
    })
    .from(digitalProducts)
    .where(eq(digitalProducts.id, id));
    
    if (!currentProduct) {
      return res.status(404).json({ error: 'Ürün bulunamadı' });
    }
    
    // Aynı platform veya kategorideki diğer ürünleri al
    const relatedProducts = await db.select({
      id: digitalProducts.id,
      name: digitalProducts.name,
      description: digitalProducts.description,
      price: digitalProducts.price,
      platform: {
        id: platforms.id,
        name: platforms.name,
        slug: platforms.slug,
      },
      category: {
        id: productCategories.id,
        name: productCategories.name,
        slug: productCategories.slug
      },
      minQuantity: digitalProducts.minQuantity,
      maxQuantity: digitalProducts.maxQuantity
    })
    .from(digitalProducts)
    .innerJoin(platforms, eq(digitalProducts.platformId, platforms.id))
    .innerJoin(productCategories, eq(digitalProducts.category, productCategories.slug))
    .where(
      and(
        eq(digitalProducts.isActive, true),
        sql`${digitalProducts.id} != ${id}`,
        sql`(${digitalProducts.platformId} = ${currentProduct.platformId} OR ${digitalProducts.category} = ${currentProduct.category})`
      )
    )
    .orderBy(desc(digitalProducts.sortOrder))
    .limit(4);
    
    // Ürünleri mağaza için biçimlendir
    const enrichedProducts = relatedProducts.map(product => ({
      ...product,
      originalPrice: Math.round(product.price * 1.2) / 100, // Örnek indirim %20
      price: product.price / 100, // Cent -> TL dönüşümü
      discountPercentage: 20, // Örnek sabit indirim yüzdesi
      minOrder: product.minQuantity,
      maxOrder: product.maxQuantity
    }));
    
    res.json(enrichedProducts);
  } catch (error) {
    console.error('Related products fetch error:', error);
    res.status(500).json({ error: 'İlgili ürünler yüklenirken bir hata oluştu' });
  }
});

export default router;