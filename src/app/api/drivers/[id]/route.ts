import { prisma } from "@/lib/prisma";
import { jsonSuccess, jsonError, withErrorHandler } from "@/lib/api-helpers";
import { setDriverSuspended } from "@/lib/services/driverStatusService";

/**
 * GET /api/drivers/:id
 * Get driver details including trip count.
 */
export const GET = withErrorHandler(
  async (req: Request, { params }: { params: Promise<Record<string, string>> }) => {
    const { id } = await params;

    const driver = await prisma.driver.findUniqueOrThrow({
      where: { id },
      include: {
        _count: {
          select: { trips: true },
        },
      },
    });

    return jsonSuccess(driver);
  }
);

/**
 * PUT /api/drivers/:id
 * Update driver details.
 */
export const PUT = withErrorHandler(
  async (req: Request, { params }: { params: Promise<Record<string, string>> }) => {
    const { id } = await params;
    const body = await req.json();
    const {
      name,
      licenseNumber,
      licenseCategory,
      licenseExpiry,
      contactNumber,
      safetyScore,
    } = body;

    // If license number is being changed, check for duplicates
    if (licenseNumber) {
      const existing = await prisma.driver.findUnique({
        where: { licenseNumber },
      });
      if (existing && existing.id !== id) {
        return jsonError(
          `Driver with license number "${licenseNumber}" already exists`,
          409
        );
      }
    }

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (licenseNumber !== undefined) updateData.licenseNumber = licenseNumber;
    if (licenseCategory !== undefined)
      updateData.licenseCategory = licenseCategory;
    if (licenseExpiry !== undefined)
      updateData.licenseExpiry = new Date(licenseExpiry);
    if (contactNumber !== undefined) updateData.contactNumber = contactNumber;
    if (safetyScore !== undefined)
      updateData.safetyScore = parseFloat(safetyScore);

    const driver = await prisma.driver.update({
      where: { id },
      data: updateData,
    });

    return jsonSuccess(driver);
  }
);

/**
 * DELETE /api/drivers/:id
 * Soft-delete: sets driver status to Suspended.
 * Cannot suspend a driver that is currently OnTrip.
 */
export const DELETE = withErrorHandler(
  async (req: Request, { params }: { params: Promise<Record<string, string>> }) => {
    const { id } = await params;

    try {
      const driver = await setDriverSuspended(id);
      return jsonSuccess(driver);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Cannot suspend driver";
      return jsonError(message, 422);
    }
  }
);
