
CREATE TABLE IF NOT EXISTS "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"password" text NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username")
);

CREATE TABLE IF NOT EXISTS "rooms" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	CONSTRAINT "rooms_name_unique" UNIQUE("name")
);

CREATE TABLE IF NOT EXISTS "messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"content" text NOT NULL,
	"user_id" integer NOT NULL,
	"room_id" integer NOT NULL,
	"reply_to_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);

-- Insert default room
INSERT INTO "rooms" ("name", "description") VALUES ('General', 'General discussion room') ON CONFLICT DO NOTHING;
