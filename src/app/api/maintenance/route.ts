import { prisma } from "@/lib/prisma";
import { jsonSuccess, jsonError, withErrorHandler } from "@/lib/api-helpers";
import { withRole } from "@/lib/rbac";
import { MaintenanceStatus, VehicleStatus } from "@prisma/client";


/**
 * GET /api/maintenance
 * List maintenance logs with optional filters: ?vehicleId=xxx&status=Open
 */
export const GET = withRole(["FleetManager", "SafetyOfficer", "FinancialAnalyst"], withErrorHandler(async (req: Request) => {
  const { searchParams } = new URL(req.url);
  const vehicleId = searchParams.get("vehicleId");
  const status = searchParams.get("status") as MaintenanceStatus | null;

  const where: Record<string, unknown> = {};
  if (vehicleId) where.vehicleId = vehicleId;
  if (status && Object.values(MaintenanceStatus).includes(status)) {
    where.status = status;
  }

  const logs = await prisma.maintenanceLog.findMany({
    where,
    include: {
      vehicle: {
        select: { id: true, registrationNumber: true, model: true },
      },
    },
    orderBy: { startDate: "desc" },
  });

  return jsonSuccess(logs);
}));

/**
 * POST /api/maintenance
 * Create a maintenance record.
 * Automatically transitions vehicle status to InShop.
 *
 * Cannot open maintenance on a vehicle that is OnTrip.
 */
export const POST = withRole(["FleetManager", "SafetyOfficer"], withErrorHandler(async (req: Request) => {
  const body = await req.json();
  const { vehicleId, description, cost, startDate } = body;

  if (!vehicleId || !description) {
    return jsonError("Missing required fields: vehicleId, description");
  }

  // Verify vehicle exists
  const vehicle = await prisma.vehicle.findUnique({
    where: { id: vehicleId },
  });
  if (!vehicle) {
    return jsonError("Vehicle not found", 404);
  }

  // Cannot open maintenance if vehicle is OnTrip
  if (vehicle.status === VehicleStatus.OnTrip) {
    return jsonError(
      `Cannot open maintenance: vehicle "${vehicle.registrationNumber}" is currently On Trip. Complete or cancel the trip first.`,
      422
    );
  }

  // Cannot open maintenance if vehicle is Retired
  if (vehicle.status === VehicleStatus.Retired) {
    return jsonError(
      `Cannot open maintenance: vehicle "${vehicle.registrationNumber}" is Retired.`,
      422
    );
  }

  // Use transaction to create log AND update vehicle status atomically
  const result = await prisma.$transaction(async (tx) => {
    const log = await tx.maintenanceLog.create({
      data: {
        vehicleId,
        description,
        cost: cost ? parseFloat(cost) : 0,
        startDate: startDate ? new Date(startDate) : new Date(),
        status: MaintenanceStatus.Open,
      },
      include: {
        vehicle: {
          select: { id: true, registrationNumber: true },
        },
      },
    });

    // Vehicle → InShop (only if currently Available)
    if (vehicle.status === VehicleStatus.Available) {
      await tx.vehicle.update({
        where: { id: vehicleId },
        data: { status: VehicleStatus.InShop },
      });
    }

    return log;
  });

  return jsonSuccess(result, 201);
}));
