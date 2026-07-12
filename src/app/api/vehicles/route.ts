import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonSuccess, jsonError, withErrorHandler } from "@/lib/api-helpers";
import { withAuth, withRole } from "@/lib/rbac";
import { VehicleStatus } from "@prisma/client";

/**
 * GET /api/vehicles
 * List all vehicles with optional filters: ?status=Available&type=Truck
 */
export const GET = withAuth(withErrorHandler(async (req: Request) => {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") as VehicleStatus | null;
  const type = searchParams.get("type");

  const where: Record<string, unknown> = {};
  if (status && Object.values(VehicleStatus).includes(status)) {
    where.status = status;
  }
  if (type) {
    where.type = { contains: type, mode: "insensitive" };
  }

  const vehicles = await prisma.vehicle.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });

  return jsonSuccess(vehicles);
}));

/**
 * POST /api/vehicles
 * Create a new vehicle. Registration number must be unique.
 */
export const POST = withRole(["FleetManager"], withErrorHandler(async (req: Request) => {
  const body = await req.json();
  const { registrationNumber, model, type, maxLoad, odometer, acquisitionCost } =
    body;

  // Validate required fields
  if (!registrationNumber || !model || !type || maxLoad == null) {
    return jsonError(
      "Missing required fields: registrationNumber, model, type, maxLoad"
    );
  }

  if (maxLoad <= 0) {
    return jsonError("maxLoad must be a positive number");
  }

  // Check for duplicate registration
  const existing = await prisma.vehicle.findUnique({
    where: { registrationNumber },
  });
  if (existing) {
    return jsonError(
      `Vehicle with registration number "${registrationNumber}" already exists`,
      409
    );
  }

  const vehicle = await prisma.vehicle.create({
    data: {
      registrationNumber,
      model,
      type,
      maxLoad: parseFloat(maxLoad),
      odometer: odometer ? parseFloat(odometer) : 0,
      acquisitionCost: acquisitionCost ? parseFloat(acquisitionCost) : 0,
      status: VehicleStatus.Available,
    },
  });

  return jsonSuccess(vehicle, 201);
}));
