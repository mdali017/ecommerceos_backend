import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import pg from "pg";

dotenv.config();

const { Client } = pg;

async function runMigration(fileName: string) {
  const filePath = path.join(__dirname, "../../supabase/migrations", fileName);
  const sql = fs.readFileSync(filePath, "utf-8");

  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  try {
    await client.query(sql);
    console.log(`Applied migration: ${fileName}`);
  } finally {
    await client.end();
  }
}

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is required in .env");
    console.error("Get it from Supabase Dashboard → Settings → Database → Connection string (URI)");
    process.exit(1);
  }

  await runMigration("002_products.sql");
  console.log("Products migration complete.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
