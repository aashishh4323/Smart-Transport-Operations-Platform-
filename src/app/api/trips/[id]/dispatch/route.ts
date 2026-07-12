import { prisma } from "@/lib/prisma";
import { jsonSuccess, jsonError, withErrorHandler } from "@/lib/api-helpers";
import { withRole } from "@/lib/rbac";
import { TripStatus, VehicleStatus, DriverStatus } from "@prisma/client";

/**
 * POST /api/trips/:id/dispatch
 *
 * Dispatches a trip with ATOMIC transaction:
 *  1. Re-validate all 4 business rules (state may have changed since Draft)
 *  2. Trip status → Dispatched
 *  3. Vehicle status → OnTrip
 *  4. Driver status → OnTrip
 *
 * Uses Prisma interactive transaction to ensure atomicity.
 */
export const POST = withRole(["Dispatcher"], withErrorHandler(
  async (req: Request, { params }: { params: Promise<Record<string, string>> }) => {
    const { id } = await params;

    const result = await prisma.$transaction(async (tx) => {
      // Fetch trip with related entities
      const trip = await tx.trip.findUniqueOrThrow({
        where: { id },
        include: { vehicle: true, driver: true },
      });

      // Only Draft trips can be dispatched
      if (trip.status !== TripStatus.Draft) {
        throw new Error(
          `Cannot dispatch trip: current status is ${trip.status} (expected Draft)`
        );
      }

      // ── Re-validate Business Rules ───────────────────────────
      const errors: string[] = [];

      // Rule 1: Cargo weight ≤ vehicle max load
      if (trip.cargoWeight > trip.vehicle.maxLoad) {
        errors.push(
          `Cargo weight (${trip.cargoWeight} kg) exceeds vehicle capacity (${trip.vehicle.maxLoad} kg)`
        );
      }

      // Rule 2: Vehicle must be Available
      if (trip.vehicle.status !== VehicleStatus.Available) {
        errors.push(
          `Vehicle "${trip.vehicle.registrationNumber}" is currently ${trip.vehicle.status}`
        );
      }

      // Rule 3: Driver must be Available
      if (trip.driver.status !== DriverStatus.Available) {
        errors.push(
          `Driver "${trip.driver.name}" is currently ${trip.driver.status}`
        );
      }

      // Rule 4: Driver license not expired
      if (new Date(trip.driver.licenseExpiry) <= new Date()) {
        errors.push(
          `Driver "${trip.driver.name}" license expired on ${new Date(trip.driver.licenseExpiry).toLocaleDateString()}`
        );
      }

      if (errors.length > 0) {
        throw new Error(errors.join("; "));
      }

      // ── Atomic State Transition ──────────────────────────────

      // Trip → Dispatched
      const updatedTrip = await tx.trip.update({
        where: { id },
        data: { status: TripStatus.Dispatched },
      });

      // Vehicle → OnTrip
      await tx.vehicle.update({
        where: { id: trip.vehicleId },
        data: { status: VehicleStatus.OnTrip },
      });

      // Driver → OnTrip
      await tx.driver.update({
        where: { id: trip.driverId },
        data: { status: DriverStatus.OnTrip },
      });

      return updatedTrip;
    });

    return jsonSuccess(result);
  }
));
