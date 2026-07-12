import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function ensureStorageBucket() {
  const { data: buckets, error } = await supabase.storage.listBuckets();
  if (error) {
    console.error("Failed to list buckets:", error.message);
    return;
  }

  const exists = buckets.some((b) => b.name === "product-images");
  if (exists) {
    console.log("Storage bucket 'product-images' already exists.");
    return;
  }

  const { error: createError } = await supabase.storage.createBucket("product-images", {
    public: true,
    fileSizeLimit: 5 * 1024 * 1024,
  });

  if (createError) {
    console.error("Failed to create bucket:", createError.message);
    console.log("Create bucket manually in Supabase Dashboard: product-images (public)");
    return;
  }

  console.log("Storage bucket 'product-images' created.");
}

async function runMigration() {
  const migrationPath = path.join(__dirname, "../../supabase/migrations/002_products.sql");
  const sql = fs.readFileSync(migrationPath, "utf-8");

  const { error } = await supabase.rpc("exec_sql", { sql_query: sql });

  if (error) {
    console.log("Auto-migration via RPC not available.");
    console.log("Please run supabase/migrations/002_products.sql in Supabase SQL Editor.");
    return;
  }

  console.log("Migration 002_products applied.");
}

async function main() {
  console.log("Setting up products module...");
  await runMigration();
  await ensureStorageBucket();
  console.log("Setup complete.");
}

main().catch(console.error);
