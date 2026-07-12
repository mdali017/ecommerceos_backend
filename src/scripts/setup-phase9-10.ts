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
  runMigrationViaSupabaseCli(fileName);
}

async function main() {
  for (const fileName of ["018_shipping.sql", "019_returns.sql"]) {
    await applyMigration(fileName);
  }
  console.log("Phase 9 migrations setup complete.");
}

main().catch((err) => {
  console.error(err);
  console.error("Run migrations 018-019 manually in Supabase SQL Editor.");
  process.exit(1);
});
