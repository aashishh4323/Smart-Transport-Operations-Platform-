import "dotenv/config";
import { prisma } from "../src/lib/prisma";

async function main() {
  try {
    const user = await prisma.user.findFirst();
    if (user) {
      console.log("✅ Connected. Found user:", user.email);
    } else {
      console.log("✅ Connected. No users found in database.");
    }
  } catch (err) {
    console.error("❌ Connection failed:", err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
