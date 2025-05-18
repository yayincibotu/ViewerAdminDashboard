import { pgTable, serial, text, varchar, integer, decimal, timestamp, boolean } from 'drizzle-orm/pg-core';

// Platforms (e.g., Twitch, YouTube, Instagram, etc.)
export const platforms = pgTable('platforms', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }).notNull().unique(),
  description: text('description'),
  icon: varchar('icon', { length: 255 }),
  banner: varchar('banner', { length: 255 }),
  isActive: boolean('is_active').default(true),
  displayOrder: integer('display_order').default(0),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Product Categories (e.g., Followers, Viewers, Likes, etc.)
export const productCategories = pgTable('product_categories', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }).notNull().unique(),
  description: text('description'),
  platformId: integer('platform_id').references(() => platforms.id),
  parentId: integer('parent_id').references(() => productCategories.id),
  icon: varchar('icon', { length: 255 }),
  banner: varchar('banner', { length: 255 }),
  isActive: boolean('is_active').default(true),
  displayOrder: integer('display_order').default(0),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Digital Products (Social Media Services)
export const digitalProducts = pgTable('digital_products', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }).notNull().unique(),
  description: text('description'),
  longDescription: text('long_description'),
  price: decimal('price', { precision: 10, scale: 2 }).notNull(),
  originalPrice: decimal('original_price', { precision: 10, scale: 2 }),
  discountPercentage: integer('discount_percentage'),
  platformId: integer('platform_id').references(() => platforms.id).notNull(),
  categoryId: integer('category_id').references(() => productCategories.id).notNull(),
  minQuantity: integer('min_quantity').default(1),
  maxQuantity: integer('max_quantity').default(10000),
  deliveryTime: varchar('delivery_time', { length: 255 }),
  deliverySpeed: varchar('delivery_speed', { length: 255 }),
  satisfactionRate: integer('satisfaction_rate'),
  popularityScore: integer('popularity_score'),
  imageUrl: varchar('image_url', { length: 255 }),
  videoUrl: varchar('video_url', { length: 255 }),
  apiProductId: varchar('api_product_id', { length: 255 }),
  apiServiceId: varchar('api_service_id', { length: 255 }),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});