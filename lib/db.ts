import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "@/db/schema";

function createDatabase() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) return null;

  // Supabase's transaction pooler does not support prepared statements.
  // Keep one connection per serverless instance to avoid exhausting the pool.
  const client = postgres(databaseUrl, {
    max: 1,
    prepare: false,
  });

  return drizzle(client, { schema });
}

let database: ReturnType<typeof createDatabase> | undefined;

/**
 * Lazily creates the server-side Drizzle client. Returns null when the database
 * is not configured so local UI development can continue without credentials.
 */
export function getDatabase() {
  database ??= createDatabase();
  return database;
}
