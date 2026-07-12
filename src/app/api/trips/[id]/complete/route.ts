import { prisma } from "@/lib/prisma";
import { jsonSuccess, jsonError, withErrorHandler } from "@/lib/api-helpers";
import { withRole } from "@/lib/rbac";
import { TripStatus, VehicleStatus, DriverStatus } from "@prisma/client";

/**
 * POST /api/trips/:id/complete
 *
 * Completes a dispatched trip:
 *  1. Captures finalOdometer and fuelConsumed from request body
 *  2. Updates vehicle odometer
 *  3. Trip status → Completed
 *  4. Vehicle status → Available
 *  5. Driver status → Available
 *
 * Request body: { finalOdometer: number, fuelConsumed: number }
 */
export const POST = withRole(["Dispatcher"], withErrorHandler(
  async (req: Request, { params }: { params: Promise<Record<string, string>> }) => {
    const { id } = await params;
    const body = await req.json();
    const { finalOdometer, fuelConsumed } = body;

    if (finalOdometer == null || fuelConsumed == null) {
      return jsonError(
        "Missing required fields: finalOdometer, fuelConsumed"
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      const trip = await tx.trip.findUniqueOrThrow({
        where: { id },
        include: { vehicle: true },
      });

      // Only Dispatched trips can be completed
      if (trip.status !== TripStatus.Dispatched) {
        throw new Error(
          `Cannot complete trip: current status is ${trip.status} (expected Dispatched)`
        );
      }

      // Validate odometer reading
      const odometerValue = parseFloat(finalOdometer);
      if (odometerValue < trip.vehicle.odometer) {
        throw new Error(
          `Final odometer (${odometerValue}) cannot be less than current odometer (${trip.vehicle.odometer})`
        );
      }

      // Trip → Completed with captured data
      const updatedTrip = await tx.trip.update({
        where: { id },
        data: {
          status: TripStatus.Completed,
          finalOdometer: odometerValue,
          fuelConsumed: parseFloat(fuelConsumed),
        },
      });

      // Update vehicle odometer
      await tx.vehicle.update({
        where: { id: trip.vehicleId },
        data: {
          status: VehicleStatus.Available,
          odometer: odometerValue,
        },
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
