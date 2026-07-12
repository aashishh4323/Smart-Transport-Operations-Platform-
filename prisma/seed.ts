import 'dotenv/config';
import { Role } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { prisma } from '../src/lib/prisma';

async function main() {
  // 1. Delete existing domain data to replace Kenyan vehicles with Indian ones
  await prisma.fuelExpenseLog.deleteMany({});
  await prisma.maintenanceLog.deleteMany({});
  await prisma.trip.deleteMany({});
  await prisma.vehicle.deleteMany({});
  await prisma.driver.deleteMany({});

  // 2. Upsert standard users
  const users = [
    { email: 'admin@transitops.com', password: 'password123', name: 'Admin User', role: Role.FleetManager },
    { email: 'driver@transitops.com', password: 'password123', name: 'Ravi Kumar', role: Role.Driver },
    { email: 'safety@transitops.com', password: 'password123', name: 'Priya Sharma', role: Role.SafetyOfficer },
    { email: 'finance@transitops.com', password: 'password123', name: 'Amit Desai', role: Role.FinancialAnalyst },
    { email: 'dispatcher@transitops.com', password: 'password123', name: 'Neha Gupta', role: Role.Dispatcher },
  ];

  for (const user of users) {
    const passwordHash = await bcrypt.hash(user.password, 10);
    await prisma.user.upsert({
      where: { email: user.email },
      update: { name: user.name },
      create: { email: user.email, passwordHash, name: user.name, role: user.role },
    });
  }

  // 3. Insert Indian Vehicles
  const v1 = await prisma.vehicle.create({
    data: {
      registrationNumber: 'MH 01 AB 1234',
      model: 'Tata Signa 4825.TK',
      type: 'Heavy Truck',
      maxLoad: 35000,
      odometer: 12500,
      acquisitionCost: 4500000,
      status: 'Available',
    }
  });

  const v2 = await prisma.vehicle.create({
    data: {
      registrationNumber: 'DL 1C AA 1111',
      model: 'Ashok Leyland Dost+',
      type: 'Light Commercial',
      maxLoad: 1500,
      odometer: 45000,
      acquisitionCost: 800000,
      status: 'OnTrip',
    }
  });

  const v3 = await prisma.vehicle.create({
    data: {
      registrationNumber: 'KA 03 MX 9999',
      model: 'Mahindra Blazo X',
      type: 'Heavy Truck',
      maxLoad: 28000,
      odometer: 105000,
      acquisitionCost: 3500000,
      status: 'InShop',
    }
  });

  // 4. Insert Indian Drivers
  const d1 = await prisma.driver.create({
    data: {
      name: 'Ravi Kumar',
      licenseNumber: 'MH-14-20101234567',
      licenseCategory: 'HMV',
      licenseExpiry: new Date('2028-05-10'),
      contactNumber: '+91-9876543210',
      safetyScore: 92,
      status: 'Available',
    }
  });

  const d2 = await prisma.driver.create({
    data: {
      name: 'Suresh Singh',
      licenseNumber: 'DL-04-20159876543',
      licenseCategory: 'LMV',
      licenseExpiry: new Date('2025-11-20'),
      contactNumber: '+91-9123456789',
      safetyScore: 85,
      status: 'OnTrip',
    }
  });

  // 5. Insert Trips
  const t1 = await prisma.trip.create({
    data: {
      source: 'Mumbai Depot',
      destination: 'Pune Hub',
      cargoWeight: 12000,
      plannedDistance: 150,
      status: 'Completed',
      vehicleId: v1.id,
      driverId: d1.id,
      finalOdometer: 12500,
      fuelConsumed: 45,
    }
  });

  const t2 = await prisma.trip.create({
    data: {
      source: 'Delhi Yard',
      destination: 'Jaipur Depot',
      cargoWeight: 1400,
      plannedDistance: 280,
      status: 'Dispatched',
      vehicleId: v2.id,
      driverId: d2.id,
    }
  });

  // 6. Insert Logs
  await prisma.maintenanceLog.create({
    data: {
      vehicleId: v3.id,
      description: 'Engine overhaul and clutch replacement',
      cost: 45000,
      startDate: new Date(),
      status: 'Open',
    }
  });

  await prisma.fuelExpenseLog.create({
    data: {
      vehicleId: v1.id,
      liters: 45,
      cost: 4200, // INR
      date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      type: 'Fuel',
    }
  });

  console.log('Seeded database with Indian users, vehicles, and trips successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
