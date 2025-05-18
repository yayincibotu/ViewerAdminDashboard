import { pgTable, serial, text, varchar, integer, decimal, timestamp, boolean } from 'drizzle-orm/pg-core';

// Platforms (e.g., Twitch, YouTube, Instagram, etc.)
export const platforms = pgTable('platforms', {
  id: serial('id').primaryKey(),
  name: text('name'),
  slug: text('slug'),
  description: text('description'),
  icon_class: text('icon_class'),
  bg_color: text('bg_color'),
  is_active: boolean('is_active').default(true),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow(),
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

// Digital Products (Social Media Services) - Updated to match actual DB structure
export const digitalProducts = pgTable('digital_products', {
  id: serial('id').primaryKey(),
  name: text('name'),
  description: text('description'),
  long_description: text('long_description'),
  price: integer('price'),
  original_price: integer('original_price'),
  platform_id: integer('platform_id').references(() => platforms.id),
  category: text('category'),
  service_type: text('service_type'),
  external_product_id: text('external_product_id'),
  external_service_id: text('external_service_id'),
  provider_name: text('provider_name'),
  min_quantity: integer('min_quantity'),
  max_quantity: integer('max_quantity'),
  delivery_time: text('delivery_time'),
  delivery_speed: text('delivery_speed'),
  satisfaction_rate: integer('satisfaction_rate'),
  discount_percentage: integer('discount_percentage'),
  popularity_score: integer('popularity_score'),
  image_url: text('image_url'),
  is_active: boolean('is_active').default(true),
  sort_order: integer('sort_order'),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow(),
});