CREATE TABLE "custom_options" (
	"id" serial PRIMARY KEY NOT NULL,
	"field_type" text NOT NULL,
	"value" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "matches" (
	"id" serial PRIMARY KEY NOT NULL,
	"profile_id" integer NOT NULL,
	"matched_profile_id" integer NOT NULL,
	"compatibility_score" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"id" serial PRIMARY KEY NOT NULL,
	"profile_id" text NOT NULL,
	"name" text NOT NULL,
	"age" integer NOT NULL,
	"gender" text NOT NULL,
	"profession" text,
	"qualification" text,
	"height" text NOT NULL,
	"profile_picture" text,
	"profile_picture_original" text,
	"document" text,
	"document_original" text,
	"birth_year" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "profiles_profile_id_unique" UNIQUE("profile_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"password" text NOT NULL,
	"email" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_matched_profile_id_profiles_id_fk" FOREIGN KEY ("matched_profile_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;