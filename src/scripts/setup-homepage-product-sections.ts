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

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is required in .env");
    process.exit(1);
  }

  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  try {
    await runMigration(client, "012_homepage_product_sections.sql");
  } finally {
    await client.end();
  }

  console.log("Homepage product sections setup complete.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
