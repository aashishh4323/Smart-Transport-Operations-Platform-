import { z } from "zod";

export const vehicleSchema = z.object({
  registrationNumber: z
    .string()
    .trim()
    .min(5, "Registration number must contain at least 5 characters")
    .max(20, "Registration number is too long"),

  model: z
    .string()
    .trim()
    .min(2, "Model name is required"),

  type: z
    .string()
    .trim()
    .min(1, "Vehicle type is required"),

  maxLoad: z.coerce
    .number()
    .positive("Maximum load must be greater than zero"),

  odometer: z.coerce
    .number()
    .min(0, "Odometer cannot be negative"),

  acquisitionCost: z.coerce
    .number()
    .positive("Acquisition cost must be greater than zero"),

  status: z.enum([
    "Available",
    "OnTrip",
    "InShop",
    "Retired",
  ]),
});

export type VehicleFormValues = z.infer<typeof vehicleSchema>;