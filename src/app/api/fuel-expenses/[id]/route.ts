import { prisma } from "@/lib/prisma";
import { jsonSuccess, jsonError, withErrorHandler, parseValidFloat, parseValidDate } from "@/lib/api-helpers";
import { withRole } from "@/lib/rbac";
import { ExpenseType } from "@prisma/client";

/**
 * GET /api/fuel-expenses/:id
 * Get expense log details.
 */
export const GET = withRole(["FinancialAnalyst", "FleetManager"], withErrorHandler(
  async (req: Request, { params }: { params: Promise<Record<string, string>> }) => {
    const { id } = await params;

    const log = await prisma.fuelExpenseLog.findUniqueOrThrow({
      where: { id },
      include: { vehicle: true },
    });

    return jsonSuccess(log);
  }
));

/**
 * PUT /api/fuel-expenses/:id
 * Update an expense log.
 */
export const PUT = withRole(["FinancialAnalyst"], withErrorHandler(
  async (req: Request, { params }: { params: Promise<Record<string, string>> }) => {
    const { id } = await params;
    const body = await req.json();
    const { liters, cost, date, type } = body;

    const updateData: Record<string, unknown> = {};
    if (liters !== undefined) updateData.liters = parseValidFloat(liters);
    if (cost !== undefined) updateData.cost = parseValidFloat(cost);
    if (date !== undefined) updateData.date = parseValidDate(date);
    if (type !== undefined) {
      if (!Object.values(ExpenseType).includes(type as ExpenseType)) {
        return jsonError(
          `Invalid expense type "${type}". Must be one of: ${Object.values(ExpenseType).join(", ")}`
        );
      }
      updateData.type = type;
    }

    const log = await prisma.fuelExpenseLog.update({
      where: { id },
      data: updateData,
      include: {
        vehicle: {
          select: { id: true, registrationNumber: true },
        },
      },
    });

    return jsonSuccess(log);
  }
));

/**
 * DELETE /api/fuel-expenses/:id
 * Delete an expense log (hard delete).
 */
export const DELETE = withRole(["FinancialAnalyst"], withErrorHandler(
  async (req: Request, { params }: { params: Promise<Record<string, string>> }) => {
    const { id } = await params;

    await prisma.fuelExpenseLog.delete({ where: { id } });

    return jsonSuccess({ deleted: true });
  }
));
