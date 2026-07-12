import { prisma } from "@/lib/prisma";
import { jsonSuccess, jsonError, withErrorHandler } from "@/lib/api-helpers";
import { withRole } from "@/lib/rbac";
import { DriverStatus } from "@prisma/client";
import { DriverCreateSchema, PaginationSchema } from "@/lib/definitions";

/**
 * GET /api/drivers
 * List all drivers with optional status filter: ?status=Available&page=1&limit=20
 */
export const GET = withRole(["Dispatcher", "SafetyOfficer", "FleetManager"], withErrorHandler(async (req: Request) => {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") as DriverStatus | null;

  const pagination = PaginationSchema.safeParse({
    page: searchParams.get("page") ?? 1,
    limit: searchParams.get("limit") ?? 20,
  });

  const { page, limit } = pagination.success ? pagination.data : { page: 1, limit: 20 };
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};
  if (status && Object.values(DriverStatus).includes(status)) {
    where.status = status;
  }

  const [drivers, total] = await Promise.all([
    prisma.driver.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
    prisma.driver.count({ where }),
  ]);

  return jsonSuccess({
    items: drivers,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  });
}));

/**
 * POST /api/drivers
 * Create a new driver.
 */
export const POST = withRole(["Dispatcher", "SafetyOfficer"], withErrorHandler(async (req: Request) => {
  const body = await req.json();

  const validatedFields = DriverCreateSchema.safeParse(body);
  if (!validatedFields.success) {
    return jsonError("Validation failed", 400, validatedFields.error.flatten().fieldErrors);
  }

  const {
    name,
    licenseNumber,
    licenseCategory,
    licenseExpiry,
    contactNumber,
  } = validatedFields.data;

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
      licenseExpiry,
      contactNumber,
      safetyScore: 100, // Explicitly enforce initial score
      status: DriverStatus.Available,
    },
  });

  return jsonSuccess(driver, 201);
}));
