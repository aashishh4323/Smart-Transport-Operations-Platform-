export type UserRole =
  | "Admin"
  | "FleetManager"
  | "Dispatcher"
  | "SafetyOfficer"
  | "FinancialAnalyst";

export type VehicleStatus =
  | "Available"
  | "OnTrip"
  | "InShop"
  | "Retired";

export type DriverStatus =
  | "Available"
  | "OnTrip"
  | "OffDuty"
  | "Suspended";

export type TripStatus =
  | "Draft"
  | "Dispatched"
  | "Completed"
  | "Cancelled";

export interface Vehicle {
  id: string;
  registrationNumber: string;
  model: string;
  type: string;
  maxLoad: number;
  odometer: number;
  acquisitionCost: number;
  status: VehicleStatus;
}

export interface Driver {
  id: string;
  name: string;
  licenseNumber: string;
  licenseCategory: "LMV" | "HMV";
  licenseExpiry: string;
  contactNumber: string;
  safetyScore: number;
  status: DriverStatus;
}

export interface Trip {
  id: string;
  tripCode: string;
  source: string;
  destination: string;
  cargoWeight: number;
  plannedDistance: number;
  status: TripStatus;
  vehicleId?: string;
  driverId?: string;
  finalOdometer?: number;
  fuelConsumed?: number;
}

export interface MaintenanceLog {
  id: string;
  vehicleId: string;
  description: string;
  cost: number;
  startDate: string;
  endDate?: string;
  status: "Open" | "Closed";
}

export interface ExpenseLog {
  id: string;
  vehicleId: string;
  liters?: number;
  cost: number;
  date: string;
  type: "Fuel" | "Toll" | "Other";
}