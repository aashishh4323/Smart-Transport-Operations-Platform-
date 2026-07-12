import { Role } from "@prisma/client";
import { prisma } from "../src/lib/prisma";
import bcrypt from "bcryptjs";

async function main() {
  console.log("Seeding database...");

  // Create a FleetManager user
  const adminPassword = await bcrypt.hash("admin123", 10);
  const adminUser = await prisma.user.upsert({
    where: { email: "admin@transitops.local" },
    update: {},
    create: {
      email: "admin@transitops.local",
      name: "Admin Fleet Manager",
      passwordHash: adminPassword,
      role: Role.FleetManager,
    },
  });
  console.log("Upserted user:", adminUser.email);

  // Create a sample vehicle
  const truck = await prisma.vehicle.upsert({
    where: { registrationNumber: "TRK-001" },
    update: {},
    create: {
      registrationNumber: "TRK-001",
      model: "Volvo FH16",
      type: "Heavy Truck",
      maxLoad: 25000,
      odometer: 1500,
      acquisitionCost: 150000,
    },
  });
  console.log("Upserted vehicle:", truck.registrationNumber);

  // Create a driver
  const driver = await prisma.driver.upsert({
    where: { licenseNumber: "DL-TX-001" },
    update: {},
    create: {
      name: "Jane Doe",
      licenseNumber: "DL-TX-001",
      licenseCategory: "CDL",
      licenseExpiry: new Date("2030-12-31"),
      contactNumber: "555-0101",
      safetyScore: 98.5,
    },
  });
  console.log("Upserted driver:", driver.name);

  console.log("Seeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
