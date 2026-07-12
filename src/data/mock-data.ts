import {
  Driver,
  ExpenseLog,
  MaintenanceLog,
  Trip,
  Vehicle,
} from "@/types";

export const vehicles: Vehicle[] = [
  {
    id: "vehicle-1",
    registrationNumber: "GJ01AB4521",
    model: "VAN-05",
    type: "Van",
    maxLoad: 500,
    odometer: 74000,
    acquisitionCost: 620000,
    status: "Available",
  },
  {
    id: "vehicle-2",
    registrationNumber: "GJ01AB9981",
    model: "TRUCK-11",
    type: "Truck",
    maxLoad: 5000,
    odometer: 182000,
    acquisitionCost: 2450000,
    status: "OnTrip",
  },
  {
    id: "vehicle-3",
    registrationNumber: "GJ01AB1120",
    model: "MINI-03",
    type: "Mini Truck",
    maxLoad: 1000,
    odometer: 66000,
    acquisitionCost: 410000,
    status: "InShop",
  },
];

export const drivers: Driver[] = [
  {
    id: "driver-1",
    name: "Alex",
    licenseNumber: "DL-88213",
    licenseCategory: "LMV",
    licenseExpiry: "2028-12-31",
    contactNumber: "9876543210",
    safetyScore: 96,
    status: "Available",
  },
  {
    id: "driver-2",
    name: "John",
    licenseNumber: "DL-44120",
    licenseCategory: "HMV",
    licenseExpiry: "2025-03-31",
    contactNumber: "9822012345",
    safetyScore: 81,
    status: "Suspended",
  },
];

export const trips: Trip[] = [
  {
    id: "trip-1",
    tripCode: "TR001",
    source: "Gandhinagar Depot",
    destination: "Ahmedabad Hub",
    cargoWeight: 400,
    plannedDistance: 38,
    status: "Dispatched",
    vehicleId: "vehicle-2",
    driverId: "driver-2",
  },
];

export const maintenanceLogs: MaintenanceLog[] = [];

export const expenseLogs: ExpenseLog[] = [];
