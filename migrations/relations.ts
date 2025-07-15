import { relations } from "drizzle-orm/relations";
import { profiles, matches } from "./schema";

export const matchesRelations = relations(matches, ({one}) => ({
	profile_profileId: one(profiles, {
		fields: [matches.profileId],
		references: [profiles.id],
		relationName: "matches_profileId_profiles_id"
	}),
	profile_matchedProfileId: one(profiles, {
		fields: [matches.matchedProfileId],
		references: [profiles.id],
		relationName: "matches_matchedProfileId_profiles_id"
	}),
}));

export const profilesRelations = relations(profiles, ({many}) => ({
	matches_profileId: many(matches, {
		relationName: "matches_profileId_profiles_id"
	}),
	matches_matchedProfileId: many(matches, {
		relationName: "matches_matchedProfileId_profiles_id"
	}),
}));