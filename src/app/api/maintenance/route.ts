import { prisma } from "@/lib/prisma";
import { jsonSuccess, jsonError, withErrorHandler } from "@/lib/api-helpers";
import { withRole } from "@/lib/rbac";
import { MaintenanceStatus, VehicleStatus } from "@prisma/client";
import { MaintenanceLogCreateSchema, PaginationSchema } from "@/lib/definitions";

/**
 * GET /api/maintenance
 * List maintenance logs with optional filters: ?vehicleId=xxx&status=Open&page=1&limit=20
 */
export const GET = withRole(["FleetManager", "SafetyOfficer", "FinancialAnalyst"], withErrorHandler(async (req: Request) => {
  const { searchParams } = new URL(req.url);
  const vehicleId = searchParams.get("vehicleId");
  const status = searchParams.get("status") as MaintenanceStatus | null;

  const pagination = PaginationSchema.safeParse({
    page: searchParams.get("page") ?? 1,
    limit: searchParams.get("limit") ?? 20,
  });

  const { page, limit } = pagination.success ? pagination.data : { page: 1, limit: 20 };
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};
  if (vehicleId) where.vehicleId = vehicleId;
  if (status && Object.values(MaintenanceStatus).includes(status)) {
    where.status = status;
  }

  const [logs, total] = await Promise.all([
    prisma.maintenanceLog.findMany({
      where,
      skip,
      take: limit,
      include: {
        vehicle: {
          select: { id: true, registrationNumber: true, model: true },
        },
      },
      orderBy: { startDate: "desc" },
    }),
    prisma.maintenanceLog.count({ where }),
  ]);

  return jsonSuccess({
    items: logs,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  });
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
  
  const validatedFields = MaintenanceLogCreateSchema.safeParse(body);
  if (!validatedFields.success) {
    return jsonError("Validation failed", 400, validatedFields.error.flatten().fieldErrors);
  }

  const { vehicleId, description, cost, startDate } = validatedFields.data;

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
        cost,
        startDate,
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
