import { createClient } from '@supabase/supabase-js';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from "@shared/schema";

// Initialize Supabase client
let supabase: any = null;
let client: any = null;
let db: any = null;

if (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {
  // Initialize Supabase client
  supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
  );

  // For Drizzle ORM with Supabase
  if (process.env.DATABASE_URL) {
    client = postgres(process.env.DATABASE_URL);
    db = drizzle(client, { schema });
  }
}

export { client as pool, db, supabase };