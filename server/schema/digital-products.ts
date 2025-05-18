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

// Digital Products (Social Media Services) - Updated to match actual DB structure
export const digitalProducts = pgTable('digital_products', {
  id: serial('id').primaryKey(),
  name: text('name'),
  description: text('description'),
  price: integer('price'),
  platform_id: integer('platform_id').references(() => platforms.id),
  category: text('category'),
  service_type: text('service_type'),
  external_product_id: text('external_product_id'),
  external_service_id: text('external_service_id'),
  provider_name: text('provider_name'),
  minQuantity: integer('min_quantity'),
  maxQuantity: integer('max_quantity'),
  is_active: boolean('is_active').default(true),
  sort_order: integer('sort_order'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});