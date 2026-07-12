import { prisma } from "@/lib/prisma";
import { jsonSuccess, jsonError, withErrorHandler } from "@/lib/api-helpers";
import { withRole } from "@/lib/rbac";
import { ExpenseType } from "@prisma/client";
import { FuelExpenseLogCreateSchema, PaginationSchema } from "@/lib/definitions";

/**
 * GET /api/fuel-expenses
 * List fuel/expense logs with optional filters: ?vehicleId=xxx&type=Fuel&page=1&limit=20
 */
export const GET = withRole(["FinancialAnalyst", "FleetManager"], withErrorHandler(async (req: Request) => {
  const { searchParams } = new URL(req.url);
  const vehicleId = searchParams.get("vehicleId");
  const type = searchParams.get("type") as ExpenseType | null;

  const pagination = PaginationSchema.safeParse({
    page: searchParams.get("page") ?? 1,
    limit: searchParams.get("limit") ?? 20,
  });

  const { page, limit } = pagination.success ? pagination.data : { page: 1, limit: 20 };
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};
  if (vehicleId) where.vehicleId = vehicleId;
  if (type && Object.values(ExpenseType).includes(type)) {
    where.type = type;
  }

  const [logs, total] = await Promise.all([
    prisma.fuelExpenseLog.findMany({
      where,
      skip,
      take: limit,
      include: {
        vehicle: {
          select: { id: true, registrationNumber: true, model: true },
        },
      },
      orderBy: { date: "desc" },
    }),
    prisma.fuelExpenseLog.count({ where }),
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
 * POST /api/fuel-expenses
 * Log a fuel or other expense.
 */
export const POST = withRole(["FinancialAnalyst"], withErrorHandler(async (req: Request) => {
  const body = await req.json();
  
  const validatedFields = FuelExpenseLogCreateSchema.safeParse(body);
  if (!validatedFields.success) {
    return jsonError("Validation failed", 400, validatedFields.error.flatten().fieldErrors);
  }

  const { vehicleId, liters, cost, date, type } = validatedFields.data;

  // Verify vehicle exists
  const vehicle = await prisma.vehicle.findUnique({
    where: { id: vehicleId },
  });
  if (!vehicle) {
    return jsonError("Vehicle not found", 404);
  }

  const log = await prisma.fuelExpenseLog.create({
    data: {
      vehicleId,
      liters,
      cost,
      date,
      type: type as ExpenseType,
    },
    include: {
      vehicle: {
        select: { id: true, registrationNumber: true },
      },
    },
  });

  return jsonSuccess(log, 201);
}));
