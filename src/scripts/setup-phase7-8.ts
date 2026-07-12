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

async function applyMigration(fileName: string) {
  if (process.env.DATABASE_URL) {
    const client = new Client({ connectionString: process.env.DATABASE_URL });
    await client.connect();
    try {
      await runMigration(client, fileName);
    } finally {
      await client.end();
    }
    return;
  }

  console.log("DATABASE_URL not found. Trying Supabase CLI (--linked)...");
  runMigrationViaSupabaseCli(fileName);
}

async function main() {
  const migrations = [
    "015_coupons.sql",
    "016_wishlist.sql",
    "017_notifications.sql",
  ];

  for (const fileName of migrations) {
    await applyMigration(fileName);
  }

  console.log("Phase 7 & 8 migrations setup complete.");
}

main().catch((err) => {
  console.error(err);
  console.error("Run migrations 015-017 manually in Supabase SQL Editor.");
  process.exit(1);
});
