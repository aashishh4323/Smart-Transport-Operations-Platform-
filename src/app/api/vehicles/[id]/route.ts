import { prisma } from "@/lib/prisma";
import { jsonSuccess, jsonError, withErrorHandler } from "@/lib/api-helpers";
import { withRole } from "@/lib/rbac";
import { assertVehicleTransition } from "@/lib/services/vehicleStatusService";
import { VehicleStatus } from "@prisma/client";

/**
 * GET /api/vehicles/:id
 * Get vehicle details including related trip and maintenance counts.
 */
export const GET = withRole(["FleetManager", "Dispatcher", "SafetyOfficer"], withErrorHandler(
  async (req: Request, { params }: { params: Promise<Record<string, string>> }) => {
    const { id } = await params;

    const vehicle = await prisma.vehicle.findUniqueOrThrow({
      where: { id },
      include: {
        _count: {
          select: {
            trips: true,
            maintenanceLogs: true,
            fuelExpenseLogs: true,
          },
        },
      },
    });

    return jsonSuccess(vehicle);
  }
));

/**
 * PUT /api/vehicles/:id
 * Update vehicle details. Validates unique registration if changed.
 */
export const PUT = withRole(["FleetManager"], withErrorHandler(
  async (req: Request, { params }: { params: Promise<Record<string, string>> }) => {
    const { id } = await params;
    const body = await req.json();
    const { registrationNumber, model, type, maxLoad, odometer, acquisitionCost } =
      body;

    // If registration number is being changed, check for duplicates
    if (registrationNumber) {
      const existing = await prisma.vehicle.findUnique({
        where: { registrationNumber },
      });
      if (existing && existing.id !== id) {
        return jsonError(
          `Vehicle with registration number "${registrationNumber}" already exists`,
          409
        );
      }
    }

    const updateData: Record<string, unknown> = {};
    if (registrationNumber !== undefined)
      updateData.registrationNumber = registrationNumber;
    if (model !== undefined) updateData.model = model;
    if (type !== undefined) updateData.type = type;
    if (maxLoad !== undefined) updateData.maxLoad = parseFloat(maxLoad);
    if (odometer !== undefined) updateData.odometer = parseFloat(odometer);
    if (acquisitionCost !== undefined)
      updateData.acquisitionCost = parseFloat(acquisitionCost);

    const vehicle = await prisma.vehicle.update({
      where: { id },
      data: updateData,
    });

    return jsonSuccess(vehicle);
  }
));

/**
 * DELETE /api/vehicles/:id
 * Soft-delete: sets vehicle status to Retired.
 * Cannot retire a vehicle that is currently OnTrip.
 */
export const DELETE = withRole(["FleetManager"], withErrorHandler(
  async (req: Request, { params }: { params: Promise<Record<string, string>> }) => {
    const { id } = await params;

    try {
      const vehicle = await prisma.$transaction(async (tx) => {
        const v = await tx.vehicle.findUniqueOrThrow({
          where: { id },
          select: { status: true },
        });

        assertVehicleTransition(v.status, VehicleStatus.Retired);

        return tx.vehicle.update({
          where: { id },
          data: { status: VehicleStatus.Retired },
        });
      });
      return jsonSuccess(vehicle);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Cannot retire vehicle";
      return jsonError(message, 422);
    }
  }
));
