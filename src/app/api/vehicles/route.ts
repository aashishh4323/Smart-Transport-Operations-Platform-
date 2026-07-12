import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonSuccess, jsonError, withErrorHandler } from "@/lib/api-helpers";
import { withRole } from "@/lib/rbac";
import { VehicleStatus } from "@prisma/client";
import { VehicleCreateSchema, PaginationSchema } from "@/lib/definitions";

/**
 * GET /api/vehicles
 * List all vehicles with optional filters: ?status=Available&type=Truck&page=1&limit=20
 */
export const GET = withRole(["FleetManager", "Driver"], withErrorHandler(async (req: Request) => {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") as VehicleStatus | null;
  const type = searchParams.get("type");

  const pagination = PaginationSchema.safeParse({
    page: searchParams.get("page") ?? 1,
    limit: searchParams.get("limit") ?? 20,
  });

  const { page, limit } = pagination.success ? pagination.data : { page: 1, limit: 20 };
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};
  if (status && Object.values(VehicleStatus).includes(status)) {
    where.status = status;
  }
  if (type) {
    where.type = { contains: type, mode: "insensitive" };
  }

  const [vehicles, total] = await Promise.all([
    prisma.vehicle.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
    prisma.vehicle.count({ where }),
  ]);

  return jsonSuccess({
    items: vehicles,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  });
}));

/**
 * POST /api/vehicles
 * Create a new vehicle. Registration number must be unique.
 */
export const POST = withRole(["FleetManager"], withErrorHandler(async (req: Request) => {
  const body = await req.json();

  const validatedFields = VehicleCreateSchema.safeParse(body);
  if (!validatedFields.success) {
    return jsonError("Validation failed", 400, validatedFields.error.flatten().fieldErrors);
  }

  const { registrationNumber, model, type, maxLoad, odometer, acquisitionCost } = validatedFields.data;

  const vehicle = await prisma.vehicle.create({
    data: {
      registrationNumber,
      model,
      type,
      maxLoad,
      odometer: odometer ?? 0,
      acquisitionCost: acquisitionCost ?? 0,
      status: VehicleStatus.Available,
    },
  });

  return jsonSuccess(vehicle, 201);
}));
