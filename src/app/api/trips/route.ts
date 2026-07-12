import { prisma } from "@/lib/prisma";
import { jsonSuccess, jsonError, withErrorHandler } from "@/lib/api-helpers";
import { TripStatus, VehicleStatus, DriverStatus } from "@prisma/client";

/**
 * GET /api/trips
 * List all trips with optional status filter: ?status=Dispatched
 */
export const GET = withErrorHandler(async (req: Request) => {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") as TripStatus | null;

  const where: Record<string, unknown> = {};
  if (status && Object.values(TripStatus).includes(status)) {
    where.status = status;
  }

  const trips = await prisma.trip.findMany({
    where,
    include: {
      vehicle: {
        select: { id: true, registrationNumber: true, model: true, maxLoad: true },
      },
      driver: {
        select: { id: true, name: true, licenseNumber: true, status: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return jsonSuccess(trips);
});

/**
 * POST /api/trips
 * Create a new trip as Draft.
 *
 * Validates ALL business rules:
 *  1. cargoWeight ≤ vehicle.maxLoad
 *  2. vehicle.status === Available
 *  3. driver.status === Available
 *  4. driver.licenseExpiry > today
 */
export const POST = withErrorHandler(async (req: Request) => {
  const body = await req.json();
  const { source, destination, cargoWeight, plannedDistance, vehicleId, driverId } =
    body;

  // Validate required fields
  if (
    !source ||
    !destination ||
    cargoWeight == null ||
    plannedDistance == null ||
    !vehicleId ||
    !driverId
  ) {
    return jsonError(
      "Missing required fields: source, destination, cargoWeight, plannedDistance, vehicleId, driverId"
    );
  }

  const weight = parseFloat(cargoWeight);
  const distance = parseFloat(plannedDistance);

  // Fetch vehicle and driver for validation
  const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
  if (!vehicle) {
    return jsonError("Vehicle not found", 404);
  }

  const driver = await prisma.driver.findUnique({ where: { id: driverId } });
  if (!driver) {
    return jsonError("Driver not found", 404);
  }

  // ── Business Rule Validations ──────────────────────────────
  const errors: string[] = [];

  // Rule 1: Cargo weight ≤ vehicle max load
  if (weight > vehicle.maxLoad) {
    errors.push(
      `Cargo weight (${weight} kg) exceeds vehicle capacity (${vehicle.maxLoad} kg) by ${(weight - vehicle.maxLoad).toFixed(1)} kg`
    );
  }

  // Rule 2: Vehicle must be Available
  if (vehicle.status !== VehicleStatus.Available) {
    errors.push(
      `Vehicle "${vehicle.registrationNumber}" is currently ${vehicle.status}`
    );
  }

  // Rule 3: Driver must be Available
  if (driver.status !== DriverStatus.Available) {
    errors.push(`Driver "${driver.name}" is currently ${driver.status}`);
  }

  // Rule 4: Driver license must not be expired
  if (new Date(driver.licenseExpiry) <= new Date()) {
    errors.push(
      `Driver "${driver.name}" license expired on ${new Date(driver.licenseExpiry).toLocaleDateString()}`
    );
  }

  if (errors.length > 0) {
    return jsonError(errors.join("; "), 422);
  }

  // Create trip as Draft
  const trip = await prisma.trip.create({
    data: {
      source,
      destination,
      cargoWeight: weight,
      plannedDistance: distance,
      status: TripStatus.Draft,
      vehicleId,
      driverId,
    },
    include: {
      vehicle: {
        select: { id: true, registrationNumber: true, model: true },
      },
      driver: {
        select: { id: true, name: true },
      },
    },
  });

  return jsonSuccess(trip, 201);
});
