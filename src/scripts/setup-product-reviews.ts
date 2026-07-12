import { execSync } from "child_process";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import pg from "pg";

dotenv.config();

const { Client } = pg;
const backendRoot = path.join(__dirname, "../..");

async function runMigration(client: pg.Client, fileName: string) {
  const filePath = path.join(backendRoot, "supabase/migrations", fileName);
  const sql = fs.readFileSync(filePath, "utf-8");
  await client.query(sql);
  console.log(`Applied migration: ${fileName}`);
}

function runMigrationViaSupabaseCli(fileName: string) {
  const filePath = path.join(backendRoot, "supabase/migrations", fileName);
  execSync(`npx supabase db query --linked -f "${filePath}"`, {
    cwd: backendRoot,
    stdio: "inherit",
  });
  console.log(`Applied migration via Supabase CLI: ${fileName}`);
}

async function main() {
  const fileName = "014_product_reviews.sql";

  if (process.env.DATABASE_URL) {
    const client = new Client({ connectionString: process.env.DATABASE_URL });
    await client.connect();
    try {
      await runMigration(client, fileName);
    } finally {
      await client.end();
    }
    console.log("Product reviews setup complete.");
    return;
  }

  console.log("DATABASE_URL not found. Trying Supabase CLI (--linked)...");
  try {
    runMigrationViaSupabaseCli(fileName);
    console.log("Product reviews setup complete.");
  } catch {
    console.error("Could not apply product reviews migration automatically.");
    console.error("Run supabase/migrations/014_product_reviews.sql in Supabase SQL Editor.");
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
