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
    process.exit(1);
  }

  await runMigration("003_categories.sql");
  await runMigration("004_categories_admin.sql");
  console.log("Categories migration complete.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
