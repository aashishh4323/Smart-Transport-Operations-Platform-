import { prisma } from "@/lib/prisma";
import { jsonSuccess, jsonError, withErrorHandler } from "@/lib/api-helpers";
import { ExpenseType } from "@prisma/client";

/**
 * GET /api/fuel-expenses
 * List fuel/expense logs with optional filters: ?vehicleId=xxx&type=Fuel
 */
export const GET = withErrorHandler(async (req: Request) => {
  const { searchParams } = new URL(req.url);
  const vehicleId = searchParams.get("vehicleId");
  const type = searchParams.get("type") as ExpenseType | null;

  const where: Record<string, unknown> = {};
  if (vehicleId) where.vehicleId = vehicleId;
  if (type && Object.values(ExpenseType).includes(type)) {
    where.type = type;
  }

  const logs = await prisma.fuelExpenseLog.findMany({
    where,
    include: {
      vehicle: {
        select: { id: true, registrationNumber: true, model: true },
      },
    },
    orderBy: { date: "desc" },
  });

  return jsonSuccess(logs);
});

/**
 * POST /api/fuel-expenses
 * Log a fuel or other expense.
 */
export const POST = withErrorHandler(async (req: Request) => {
  const body = await req.json();
  const { vehicleId, liters, cost, date, type } = body;

  if (!vehicleId || cost == null) {
    return jsonError("Missing required fields: vehicleId, cost");
  }

  // Validate expense type
  const expenseType = type as ExpenseType;
  if (type && !Object.values(ExpenseType).includes(expenseType)) {
    return jsonError(
      `Invalid expense type "${type}". Must be one of: ${Object.values(ExpenseType).join(", ")}`
    );
  }

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
      liters: liters ? parseFloat(liters) : 0,
      cost: parseFloat(cost),
      date: date ? new Date(date) : new Date(),
      type: expenseType || ExpenseType.Fuel,
    },
    include: {
      vehicle: {
        select: { id: true, registrationNumber: true },
      },
    },
  });

  return jsonSuccess(log, 201);
});
