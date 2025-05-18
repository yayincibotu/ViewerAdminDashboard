import { pgTable, serial, text, integer, boolean, timestamp, real, doublePrecision } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { productCategories } from "../api/product-categories";
import { platforms } from "../api/platforms";

// Dijital ürünler tablosu
export const digitalProducts = pgTable("digital_products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  longDescription: text("long_description"),
  platformId: integer("platform_id").notNull().references(() => platforms.id),
  categoryId: integer("category_id").notNull().references(() => productCategories.id),
  smmProviderId: integer("smm_provider_id"),
  smmServiceId: text("smm_service_id"),
  price: doublePrecision("price").notNull(),
  originalPrice: doublePrecision("original_price"),
  discountPercentage: integer("discount_percentage").default(0),
  minOrder: integer("min_order").default(100),
  maxOrder: integer("max_order").default(10000),
  deliveryTime: text("delivery_time").default("1-2 saat"),
  deliverySpeed: text("delivery_speed").default("Normal"),
  satisfactionRate: integer("satisfaction_rate").default(98),
  isFeatured: boolean("is_featured").default(false),
  isActive: boolean("is_active").default(true),
  popularityScore: integer("popularity_score").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Insert şeması
export const insertDigitalProductSchema = createInsertSchema(digitalProducts, {
  description: z.string().min(3, "Açıklama en az 3 karakter olmalıdır"),
  name: z.string().min(3, "Ürün adı en az 3 karakter olmalıdır"),
  price: z.number().positive("Fiyat pozitif bir değer olmalıdır"),
  platformId: z.number().positive("Lütfen bir platform seçin"),
  categoryId: z.number().positive("Lütfen bir kategori seçin"),
}).omit({ id: true, createdAt: true, updatedAt: true });

// İlgili Türler
export type DigitalProduct = typeof digitalProducts.$inferSelect;
export type InsertDigitalProduct = z.infer<typeof insertDigitalProductSchema>;
export type UpdateDigitalProduct = Partial<InsertDigitalProduct>;