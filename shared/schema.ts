import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, boolean, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const queueEntries = pgTable("queue_entries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  phone: text("phone"),
  position: integer("position").notNull(),
  notifications: boolean("notifications").default(false),
  instagramUsername: text("instagram_username"),
  instagramBoostUsed: boolean("instagram_boost_used").default(false),
  joinedAt: timestamp("joined_at").defaultNow().notNull(),
});

export const drops = pgTable("drops", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  dropTime: timestamp("drop_time").notNull(),
  isActive: boolean("is_active").default(true),
  maxQueueSize: integer("max_queue_size").default(300),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const settings = pgTable("settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  instagramPostUrl: text("instagram_post_url"),
  instagramBoostEnabled: boolean("instagram_boost_enabled").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertQueueEntrySchema = createInsertSchema(queueEntries).pick({
  email: true,
  phone: true,
  notifications: true,
}).extend({
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().optional(),
  notifications: z.boolean().default(false),
});

export const insertDropSchema = createInsertSchema(drops).pick({
  name: true,
  description: true,
  dropTime: true,
  maxQueueSize: true,
}).extend({
  name: z.string().min(1, "Drop name is required"),
  description: z.string().optional(),
  dropTime: z.date(),
  maxQueueSize: z.number().min(1).default(300),
});

export const insertSettingsSchema = createInsertSchema(settings).pick({
  instagramPostUrl: true,
  instagramBoostEnabled: true,
}).extend({
  instagramPostUrl: z.string().url().optional(),
  instagramBoostEnabled: z.boolean().default(false),
});

export type InsertQueueEntry = z.infer<typeof insertQueueEntrySchema>;
export type QueueEntry = typeof queueEntries.$inferSelect;
export type InsertDrop = z.infer<typeof insertDropSchema>;
export type Drop = typeof drops.$inferSelect;
export type InsertSettings = z.infer<typeof insertSettingsSchema>;
export type Settings = typeof settings.$inferSelect;
