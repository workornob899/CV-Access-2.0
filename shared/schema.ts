import { pgTable, text, serial, integer, boolean, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const profiles = pgTable("profiles", {
  id: serial("id").primaryKey(),
  profileId: text("profile_id").notNull().unique(), // GB-XXXXX format
  name: text("name").notNull(),
  age: integer("age").notNull(),
  gender: text("gender").notNull(), // 'Male' or 'Female'
  profession: text("profession"),
  qualification: text("qualification"), // New qualification field
  maritalStatus: text("marital_status"), // New marital status field
  religion: text("religion"), // New religion field
  height: text("height").notNull(),
  profilePicture: text("profile_picture"),
  profilePictureOriginal: text("profile_picture_original"),
  document: text("document"),
  documentOriginal: text("document_original"),
  birthYear: integer("birth_year").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const matches = pgTable("matches", {
  id: serial("id").primaryKey(),
  profileId: integer("profile_id").notNull().references(() => profiles.id),
  matchedProfileId: integer("matched_profile_id").notNull().references(() => profiles.id),
  compatibilityScore: integer("compatibility_score").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const customOptions = pgTable("custom_options", {
  id: serial("id").primaryKey(),
  fieldType: text("field_type").notNull(), // 'profession', 'qualification', 'height', 'gender'
  value: text("value").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
});

export const insertProfileSchema = createInsertSchema(profiles).omit({
  id: true,
  profileId: true, // Auto-generated
  createdAt: true,
  updatedAt: true,
});

export const insertMatchSchema = createInsertSchema(matches).omit({
  id: true,
  createdAt: true,
});

export const insertCustomOptionSchema = createInsertSchema(customOptions).omit({
  id: true,
  createdAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertProfile = z.infer<typeof insertProfileSchema>;
export type Profile = typeof profiles.$inferSelect;
export type InsertMatch = z.infer<typeof insertMatchSchema>;
export type Match = typeof matches.$inferSelect;
export type InsertCustomOption = z.infer<typeof insertCustomOptionSchema>;
export type CustomOption = typeof customOptions.$inferSelect;
