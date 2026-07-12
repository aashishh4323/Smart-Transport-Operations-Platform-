import { z } from "zod";

export const SignupFormSchema = z.object({
  name: z
    .string()
    .min(2, { message: "Name must be at least 2 characters long." })
    .trim(),
  email: z.string().email({ message: "Please enter a valid email." }).trim(),
  password: z
    .string()
    .min(8, { message: "Be at least 8 characters long" })
    .regex(/[a-zA-Z]/, { message: "Contain at least one letter." })
    .regex(/[0-9]/, { message: "Contain at least one number." })
    .regex(/[^a-zA-Z0-9]/, {
      message: "Contain at least one special character.",
    })
    .trim(),
});

export const LoginFormSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email." }).trim(),
  password: z.string().min(1, { message: "Password is required." }),
});

export type SessionPayload = {
  userId: string;
  role: string;
  expiresAt: Date;
};

// Domain Validation Schemas
export const VehicleCreateSchema = z.object({
  registrationNumber: z.string().min(2).max(20).trim(),
  model: z.string().min(2).max(50).trim(),
  type: z.string().min(2).max(50).trim(),
  maxLoad: z.number().positive().finite(),
  odometer: z.number().nonnegative().finite().optional(),
  acquisitionCost: z.number().nonnegative().finite().optional(),
});

export const DriverCreateSchema = z.object({
  name: z.string().min(2).max(100).trim(),
  licenseNumber: z.string().min(5).max(30).trim(),
  licenseCategory: z.string().min(1).max(20).trim(),
  licenseExpiry: z.coerce.date().refine((date) => date > new Date(), {
    message: "License must not be expired",
  }),
  contactNumber: z.string().min(7).max(20).trim(),
});

export const TripDispatchSchema = z.object({
  source: z.string().min(2).max(100).trim(),
  destination: z.string().min(2).max(100).trim(),
  cargoWeight: z.number().positive().finite(),
  plannedDistance: z.number().positive().finite(),
  vehicleId: z.string().cuid(),
  driverId: z.string().cuid(),
});

export const TripCompleteSchema = z.object({
  finalOdometer: z.number().positive().finite(),
  fuelConsumed: z.number().positive().finite().optional(),
});

export const MaintenanceLogCreateSchema = z.object({
  vehicleId: z.string().cuid(),
  description: z.string().min(5).max(500).trim(),
  cost: z.number().nonnegative().finite(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date().optional(),
  status: z.enum(["Open", "Closed"]).optional(),
});

export const FuelExpenseLogCreateSchema = z.object({
  vehicleId: z.string().cuid(),
  liters: z.number().nonnegative().finite(),
  cost: z.number().nonnegative().finite(),
  date: z.coerce.date(),
  type: z.enum(["Fuel", "Toll", "Other"]),
});

export const PaginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});
