import { Router } from 'express';
import { eq, and, or, not, like, gt, lt, desc, sql, ilike } from 'drizzle-orm';
import { db } from '../db';
import { digitalProducts, productCategories, platforms } from '../schema/digital-products';

const router = Router();

// Get all digital products
router.get('/', async (req, res) => {
  try {
    const products = await db.select()
      .from(digitalProducts)
      .leftJoin(platforms, eq(digitalProducts.platform_id, platforms.id));
    
    const formattedProducts = products.map(({ digital_products, platforms }) => ({
      id: digital_products.id,
      name: digital_products.name,
      description: digital_products.description,
      price: digital_products.price,
      platform: {
        id: platforms?.id,
        name: platforms?.name,
        slug: platforms?.slug,
        icon_class: platforms?.icon_class,
        bg_color: platforms?.bg_color
      },
      category: {
        id: null,
        name: digital_products.category,
        slug: digital_products.category?.toLowerCase().replace(/\s+/g, '-'),
      },
      minOrder: digital_products.min_quantity,
      maxOrder: digital_products.max_quantity,
      provider_name: digital_products.provider_name,
      service_type: digital_products.service_type,
      external_service_id: digital_products.external_service_id,
      external_product_id: digital_products.external_product_id,
      is_active: digital_products.is_active,
    }));
    
    res.json(formattedProducts);
  } catch (error) {
    console.error('Error fetching digital products:', error);
    res.status(500).json({ error: 'Failed to fetch digital products' });
  }
});

// Get a single digital product by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const productId = parseInt(id);
    
    console.log("Fetching product with ID:", productId);
    
    if (isNaN(productId)) {
      return res.status(400).json({ error: 'Invalid product ID' });
    }
    
    const productData = await db.select()
      .from(digitalProducts)
      .leftJoin(platforms, eq(digitalProducts.platform_id, platforms.id))
      .where(eq(digitalProducts.id, productId))
      .limit(1);
    
    console.log("Product data:", JSON.stringify(productData, null, 2));
    
    if (!productData.length) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    const { digital_products, platforms } = productData[0];
    console.log("Digital product:", JSON.stringify(digital_products, null, 2));
    console.log("Platform:", JSON.stringify(platforms, null, 2));
    
    const product = {
      id: digital_products.id,
      name: digital_products.name,
      description: digital_products.description,
      longDescription: digital_products.long_description,
      price: digital_products.price,
      originalPrice: digital_products.original_price,
      platform: {
        id: platforms?.id,
        name: platforms?.name,
        slug: platforms?.slug,
      },
      category: {
        id: null,
        name: digital_products.category,
        slug: digital_products.category?.toLowerCase().replace(/\s+/g, '-'),
      },
      minOrder: digital_products.min_quantity,
      maxOrder: digital_products.max_quantity,
      deliveryTime: digital_products.delivery_time,
      deliverySpeed: digital_products.delivery_speed,
      satisfactionRate: digital_products.satisfaction_rate,
      discountPercentage: digital_products.discount_percentage,
      popularityScore: digital_products.popularity_score,
      imageUrl: digital_products.image_url,
      apiProductId: digital_products.external_product_id,
      apiServiceId: digital_products.external_service_id,
    };
    
    res.json(product);
  } catch (error) {
    console.error('Error fetching digital product:', error);
    res.status(500).json({ error: 'Failed to fetch digital product' });
  }
});

// Get related digital products (similar to the specified product)
router.get('/related/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const productId = parseInt(id);
    
    if (isNaN(productId)) {
      return res.status(400).json({ error: 'Invalid product ID' });
    }
    
    // Get the product's platform and category
    const product = await db.select()
      .from(digitalProducts)
      .where(eq(digitalProducts.id, productId))
      .limit(1);
    
    if (!product.length) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    const platformId = product[0].platform_id;
    const categoryName = product[0].category;
    
    // Find related products by same platform OR same category, excluding the current product
    const relatedProductsData = await db.select()
      .from(digitalProducts)
      .leftJoin(platforms, eq(digitalProducts.platform_id, platforms.id))
      .where(
        and(
          not(eq(digitalProducts.id, productId)),
          or(
            eq(digitalProducts.platform_id, platformId),
            eq(digitalProducts.category, categoryName)
          )
        )
      )
      .limit(4);
    
    const relatedProducts = relatedProductsData.map(({ digital_products, platforms }) => ({
      id: digital_products.id,
      name: digital_products.name,
      description: digital_products.description,
      price: digital_products.price,
      platform: {
        id: platforms?.id,
        name: platforms?.name,
        slug: platforms?.slug,
      },
      category: {
        id: null,
        name: digital_products.category,
        slug: digital_products.category?.toLowerCase().replace(/\s+/g, '-'),
      },
      imageUrl: digital_products.image_url,
    }));
    
    res.json(relatedProducts);
  } catch (error) {
    console.error('Error fetching related products:', error);
    res.status(500).json({ error: 'Failed to fetch related products' });
  }
});

// Get similar products for comparison feature
router.get('/similar', async (req, res) => {
  try {
    const { platform, category } = req.query;
    
    if (!platform && !category) {
      return res.status(400).json({ error: 'Platform or category parameter is required' });
    }
    
    let query = db.select()
      .from(digitalProducts)
      .leftJoin(platforms, eq(digitalProducts.platform_id, platforms.id));
    
    // Filter by platform and/or category
    if (platform) {
      query = query.where(eq(platforms.slug, platform as string));
    }
    
    if (category) {
      if (platform) {
        query = query.where(and(
          eq(platforms.slug, platform as string),
          eq(digitalProducts.category, category as string)
        ));
      } else {
        query = query.where(eq(digitalProducts.category, category as string));
      }
    }
    
    const similarProductsData = await query.limit(6);
    
    const similarProducts = similarProductsData.map(({ digital_products, platforms }) => ({
      id: digital_products.id,
      name: digital_products.name,
      description: digital_products.description,
      price: digital_products.price,
      discountPercentage: digital_products.discount_percentage,
      minOrder: digital_products.min_quantity,
      maxOrder: digital_products.max_quantity,
      deliveryTime: digital_products.delivery_time,
      satisfactionRate: digital_products.satisfaction_rate,
      platform: {
        id: platforms?.id,
        name: platforms?.name,
        slug: platforms?.slug,
      },
      category: {
        id: null,
        name: digital_products.category,
        slug: digital_products.category?.toLowerCase().replace(/\s+/g, '-'),
      },
      imageUrl: digital_products.image_url,
    }));
    
    res.json(similarProducts);
  } catch (error) {
    console.error('Error fetching similar products:', error);
    res.status(500).json({ error: 'Failed to fetch similar products' });
  }
});

export default router;