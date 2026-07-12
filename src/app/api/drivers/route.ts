import { prisma } from "@/lib/prisma";
import { jsonSuccess, jsonError, withErrorHandler } from "@/lib/api-helpers";
import { withRole } from "@/lib/rbac";
import { DriverStatus } from "@prisma/client";

/**
 * GET /api/drivers
 * List all drivers with optional status filter: ?status=Available
 */
export const GET = withRole(["Dispatcher", "SafetyOfficer", "FleetManager"], withErrorHandler(async (req: Request) => {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") as DriverStatus | null;

  const where: Record<string, unknown> = {};
  if (status && Object.values(DriverStatus).includes(status)) {
    where.status = status;
  }

  const drivers = await prisma.driver.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });

  return jsonSuccess(drivers);
}));

/**
 * POST /api/drivers
 * Create a new driver.
 */
export const POST = withRole(["Dispatcher", "SafetyOfficer"], withErrorHandler(async (req: Request) => {
  const body = await req.json();
  const {
    name,
    licenseNumber,
    licenseCategory,
    licenseExpiry,
    contactNumber,
    safetyScore,
  } = body;

  // Validate required fields
  if (!name || !licenseNumber || !licenseCategory || !licenseExpiry || !contactNumber) {
    return jsonError(
      "Missing required fields: name, licenseNumber, licenseCategory, licenseExpiry, contactNumber"
    );
  }

  // Check for duplicate license number
  const existing = await prisma.driver.findUnique({
    where: { licenseNumber },
  });
  if (existing) {
    return jsonError(
      `Driver with license number "${licenseNumber}" already exists`,
      409
    );
  }

  const driver = await prisma.driver.create({
    data: {
      name,
      licenseNumber,
      licenseCategory,
      licenseExpiry: new Date(licenseExpiry),
      contactNumber,
      safetyScore: safetyScore ? parseFloat(safetyScore) : 100,
      status: DriverStatus.Available,
    },
  });

  return jsonSuccess(driver, 201);
}));
