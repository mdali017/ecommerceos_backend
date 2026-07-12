import dotenv from "dotenv";
import { supabase } from "../config/supabase";
import { hashPassword } from "../shared/utils/password";

dotenv.config();

const DEMO_CUSTOMER = {
  name: "জনাব করিম",
  phone: "01712345678",
  email: "customer@test.com",
  address: "ধানমন্ডি, ঢাকা-১২০৫",
  password: "123456",
  source: "default" as const,
};

const DEMO_ADMIN = {
  name: "Admin User",
  email: "admin@test.com",
  password: "123456",
};

async function seed() {
  console.log("Seeding demo data...");

  const customerHash = await hashPassword(DEMO_CUSTOMER.password);
  const adminHash = await hashPassword(DEMO_ADMIN.password);

  const { error: customerError } = await supabase.from("customers").upsert(
    {
      name: DEMO_CUSTOMER.name,
      phone: DEMO_CUSTOMER.phone,
      email: DEMO_CUSTOMER.email,
      address: DEMO_CUSTOMER.address,
      password_hash: customerHash,
      source: DEMO_CUSTOMER.source,
    },
    { onConflict: "email" }
  );

  if (customerError) {
    console.error("Customer seed failed:", customerError.message);
    process.exit(1);
  }

  const { error: adminError } = await supabase.from("admins").upsert(
    {
      name: DEMO_ADMIN.name,
      email: DEMO_ADMIN.email,
      password_hash: adminHash,
    },
    { onConflict: "email" }
  );

  if (adminError) {
    console.error("Admin seed failed:", adminError.message);
    process.exit(1);
  }

  console.log("Demo credentials seeded:");
  console.log(`  Customer: ${DEMO_CUSTOMER.phone} / ${DEMO_CUSTOMER.password}`);
  console.log(`  Admin:    ${DEMO_ADMIN.email} / ${DEMO_ADMIN.password}`);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
