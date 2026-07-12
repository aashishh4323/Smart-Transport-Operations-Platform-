import { prisma } from "@/lib/prisma";
import { jsonSuccess, jsonError, withErrorHandler } from "@/lib/api-helpers";

/**
 * GET /api/maintenance/:id
 * Get maintenance log details.
 */
export const GET = withErrorHandler(
  async (req: Request, { params }: { params: Promise<Record<string, string>> }) => {
    const { id } = await params;

    const log = await prisma.maintenanceLog.findUniqueOrThrow({
      where: { id },
      include: {
        vehicle: true,
      },
    });

    return jsonSuccess(log);
  }
);

/**
 * PUT /api/maintenance/:id
 * Update maintenance log details (description, cost).
 * Does NOT change status — use /close endpoint for that.
 */
export const PUT = withErrorHandler(
  async (req: Request, { params }: { params: Promise<Record<string, string>> }) => {
    const { id } = await params;
    const body = await req.json();
    const { description, cost } = body;

    const updateData: Record<string, unknown> = {};
    if (description !== undefined) updateData.description = description;
    if (cost !== undefined) updateData.cost = parseFloat(cost);

    const log = await prisma.maintenanceLog.update({
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
);
