export type UserRole =
  | "Admin"
  | "FleetManager"
  | "Dispatcher"
  | "SafetyOfficer"
  | "FinancialAnalyst";

export type VehicleStatus = "Available" | "OnTrip" | "InShop" | "Retired";
export type DriverStatus = "Available" | "OnTrip" | "OffDuty" | "Suspended";
export type TripStatus = "Draft" | "Dispatched" | "Completed" | "Cancelled";
export type MaintenanceStatus = "Open" | "Closed";
export type VehicleType = "Van" | "Bus" | "Minibus" | "Truck" | "Coach";
export type DriverCategory = "Class A" | "Class B" | "Class C";
export type ExpenseType = "Fuel" | "Toll" | "Other";
export type ModuleKey =
  | "dashboard"
  | "fleet"
  | "drivers"
  | "trips"
  | "maintenance"
  | "expenses"
  | "analytics"
  | "settings";

export interface Vehicle {
  id: string;
  registrationNumber: string;
  model: string;
  type: VehicleType;
  maxLoadKg: number;
  odometerKm: number;
  acquisitionCost: number;
  status: VehicleStatus;
  region: string;
  lastServiceDate: string;
  notes?: string;
}

export interface Driver {
  id: string;
  name: string;
  licenseNumber: string;
  licenseCategory: DriverCategory;
  licenseExpiry: string;
  contact: string;
  safetyScore: number;
  status: DriverStatus;
  region: string;
}

export interface Trip {
  id: string;
  code: string;
  source: string;
  destination: string;
  vehicleId: string;
  driverId: string;
  cargoWeightKg: number;
  plannedDistanceKm: number;
  status: TripStatus;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  finalOdometerKm?: number;
  fuelConsumedL?: number;
}

export interface MaintenanceLog {
  id: string;
  vehicleId: string;
  description: string;
  cost: number;
  startDate: string;
  endDate?: string;
  status: MaintenanceStatus;
}

export interface FuelExpenseLog {
  id: string;
  vehicleId: string;
  tripId?: string;
  type: ExpenseType;
  amount: number;
  date: string;
  liters?: number;
  details?: string;
}

export interface ActivityLog {
  id: string;
  title: string;
  detail: string;
  time: string;
  level: "info" | "success" | "warning" | "danger";
}