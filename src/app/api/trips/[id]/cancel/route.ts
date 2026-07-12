import { prisma } from "@/lib/prisma";
import { jsonSuccess, jsonError, withErrorHandler, ApiError } from "@/lib/api-helpers";
import { withRole } from "@/lib/rbac";
import { TripStatus, VehicleStatus, DriverStatus } from "@prisma/client";

/**
 * POST /api/trips/:id/cancel
 *
 * Cancels a dispatched trip:
 *  1. Trip status → Cancelled
 *  2. Vehicle status → Available
 *  3. Driver status → Available
 *
 * Can only cancel from Dispatched status.
 */
export const POST = withRole(["Dispatcher", "FleetManager"], withErrorHandler(
  async (req: Request, { params }: { params: Promise<Record<string, string>> }) => {
    const { id } = await params;

    const result = await prisma.$transaction(async (tx) => {
      const trip = await tx.trip.findUniqueOrThrow({
        where: { id },
      });

      // Only Dispatched trips can be cancelled
      if (trip.status !== TripStatus.Dispatched) {
        throw new ApiError(409,
          `Cannot cancel trip: current status is ${trip.status} (expected Dispatched)`
        );
      }

      // Trip → Cancelled
      const updatedTrip = await tx.trip.update({
        where: { id },
        data: { status: TripStatus.Cancelled },
      });

      // Vehicle → Available
      await tx.vehicle.update({
        where: { id: trip.vehicleId },
        data: { status: VehicleStatus.Available },
      });

      // Driver → Available
      await tx.driver.update({
        where: { id: trip.driverId },
        data: { status: DriverStatus.Available },
      });

      return updatedTrip;
    });

    return jsonSuccess(result);
  }
));
