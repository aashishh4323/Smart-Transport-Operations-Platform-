import { prisma } from "@/lib/prisma";
import { jsonSuccess, jsonError, withErrorHandler } from "@/lib/api-helpers";
import { withRole } from "@/lib/rbac";
import { TripStatus, VehicleStatus, DriverStatus } from "@prisma/client";
import { TripDispatchSchema } from "@/lib/definitions";

/**
 * GET /api/trips/:id
 * Get trip details with vehicle and driver info.
 */
export const GET = withRole(["Dispatcher", "FleetManager", "SafetyOfficer"], withErrorHandler(
  async (req: Request, { params }: { params: Promise<Record<string, string>> }) => {
    const { id } = await params;

    const trip = await prisma.trip.findUniqueOrThrow({
      where: { id },
      include: {
        vehicle: true,
        driver: true,
      },
    });

    return jsonSuccess(trip);
  }
));

/**
 * PUT /api/trips/:id
 * Update a draft trip.
 */
export const PUT = withRole(["Dispatcher", "FleetManager"], withErrorHandler(
  async (req: Request, { params }: { params: Promise<Record<string, string>> }) => {
    const { id } = await params;
    const body = await req.json();

    const trip = await prisma.trip.findUniqueOrThrow({ where: { id } });
    if (trip.status !== TripStatus.Draft) {
      return jsonError(`Cannot edit trip in ${trip.status} status. Only Draft trips can be edited.`, 400);
    }

    const validatedFields = TripDispatchSchema.safeParse(body);
    if (!validatedFields.success) {
      return jsonError("Validation failed", 400, validatedFields.error.flatten().fieldErrors);
    }

    const { source, destination, cargoWeight, plannedDistance, vehicleId, driverId } = validatedFields.data;

    // Fetch vehicle and driver for validation
    const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
    if (!vehicle) return jsonError("Vehicle not found", 404);

    const driver = await prisma.driver.findUnique({ where: { id: driverId } });
    if (!driver) return jsonError("Driver not found", 404);

    const errors: string[] = [];
    if (cargoWeight > vehicle.maxLoad) {
      errors.push(`Cargo weight (${cargoWeight} kg) exceeds vehicle capacity (${vehicle.maxLoad} kg)`);
    }
    if (vehicle.status !== VehicleStatus.Available) {
      errors.push(`Vehicle "${vehicle.registrationNumber}" is currently ${vehicle.status}`);
    }
    if (driver.status !== DriverStatus.Available) {
      errors.push(`Driver "${driver.name}" is currently ${driver.status}`);
    }
    if (new Date(driver.licenseExpiry) <= new Date()) {
      errors.push(`Driver "${driver.name}" license expired on ${new Date(driver.licenseExpiry).toLocaleDateString()}`);
    }

    if (errors.length > 0) {
      return jsonError(errors.join("; "), 422);
    }

    const updatedTrip = await prisma.trip.update({
      where: { id },
      data: {
        source,
        destination,
        cargoWeight,
        plannedDistance,
        vehicleId,
        driverId,
      },
      include: {
        vehicle: { select: { id: true, registrationNumber: true, model: true } },
        driver: { select: { id: true, name: true } },
      },
    });

    return jsonSuccess(updatedTrip);
  }
));
