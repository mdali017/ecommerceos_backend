import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import pg from "pg";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

const { Client } = pg;

async function runMigration(client: pg.Client, fileName: string) {
  const filePath = path.join(__dirname, "../../supabase/migrations", fileName);
  const sql = fs.readFileSync(filePath, "utf-8");
  await client.query(sql);
  console.log(`Applied migration: ${fileName}`);
}

async function ensureStorageBucket() {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.log("Skipping bucket setup — Supabase env vars missing.");
    return;
  }

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const { data: buckets, error } = await supabase.storage.listBuckets();
  if (error) {
    console.error("Failed to list buckets:", error.message);
    return;
  }

  if (buckets.some((bucket) => bucket.name === "hero-slides")) {
    console.log("Storage bucket 'hero-slides' already exists.");
    return;
  }

  const { error: createError } = await supabase.storage.createBucket("hero-slides", {
    public: true,
    fileSizeLimit: 5 * 1024 * 1024,
  });

  if (createError) {
    console.error("Failed to create bucket:", createError.message);
    return;
  }

  console.log("Storage bucket 'hero-slides' created.");
}

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is required in .env");
    process.exit(1);
  }

  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  try {
    await runMigration(client, "005_hero_slides.sql");
  } finally {
    await client.end();
  }

  await ensureStorageBucket();
  console.log("Hero slides setup complete.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
