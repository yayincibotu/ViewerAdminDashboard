import { pgTable, serial, text, timestamp, boolean } from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';
import { sql } from 'drizzle-orm';

export const settings = pgTable('system_configs', {
  id: serial('id').primaryKey(),
  key: text('key').notNull().unique(),
  value: text('value'),
  description: text('description'),
  category: text('category').notNull(),
  is_encrypted: boolean('is_encrypted').default(false),
  last_updated_by: text('last_updated_by'),
  created_at: timestamp('created_at')
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updated_at: timestamp('updated_at')
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
});

export const insertSettingSchema = createInsertSchema(settings, {
  key: z.string().min(1).max(100),
  value: z.string().optional(),
  description: z.string().optional(),
  category: z.string().min(1).max(50),
  is_encrypted: z.boolean().optional(),
  last_updated_by: z.string().optional(),
}).omit({ id: true, created_at: true, updated_at: true });

export type Setting = typeof settings.$inferSelect;
export type InsertSetting = z.infer<typeof insertSettingSchema>;