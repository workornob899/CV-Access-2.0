import { pgTable, serial, text, timestamp, unique, integer, foreignKey } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const customOptions = pgTable("custom_options", {
	id: serial().primaryKey().notNull(),
	fieldType: text("field_type").notNull(),
	value: text().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
});

export const profiles = pgTable("profiles", {
	id: serial().primaryKey().notNull(),
	profileId: text("profile_id").notNull(),
	name: text().notNull(),
	age: integer().notNull(),
	gender: text().notNull(),
	profession: text(),
	qualification: text(),
	height: text().notNull(),
	profilePicture: text("profile_picture"),
	profilePictureOriginal: text("profile_picture_original"),
	document: text(),
	documentOriginal: text("document_original"),
	birthYear: integer("birth_year").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("profiles_profile_id_unique").on(table.profileId),
]);

export const users = pgTable("users", {
	id: serial().primaryKey().notNull(),
	username: text().notNull(),
	password: text().notNull(),
	email: text().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("users_username_unique").on(table.username),
	unique("users_email_unique").on(table.email),
]);

export const matches = pgTable("matches", {
	id: serial().primaryKey().notNull(),
	profileId: integer("profile_id").notNull(),
	matchedProfileId: integer("matched_profile_id").notNull(),
	compatibilityScore: integer("compatibility_score").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.profileId],
			foreignColumns: [profiles.id],
			name: "matches_profile_id_profiles_id_fk"
		}),
	foreignKey({
			columns: [table.matchedProfileId],
			foreignColumns: [profiles.id],
			name: "matches_matched_profile_id_profiles_id_fk"
		}),
]);
