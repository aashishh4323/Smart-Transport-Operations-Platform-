import { prisma } from "@/lib/prisma";
import { jsonSuccess, jsonError, withErrorHandler } from "@/lib/api-helpers";
import { withRole } from "@/lib/rbac";
import { MaintenanceStatus, VehicleStatus } from "@prisma/client";

/**
 * POST /api/maintenance/:id/close
 *
 * Closes a maintenance record:
 *  1. Maintenance status → Closed
 *  2. Sets endDate to now
 *  3. Vehicle status → Available (UNLESS vehicle is Retired)
 *
 * Only checks if there are other open maintenance records for the
 * same vehicle — vehicle stays InShop if other records are still open.
 */
export const POST = withRole(["FleetManager", "SafetyOfficer"], withErrorHandler(
  async (req: Request, { params }: { params: Promise<Record<string, string>> }) => {
    const { id } = await params;

    const result = await prisma.$transaction(async (tx) => {
      const log = await tx.maintenanceLog.findUniqueOrThrow({
        where: { id },
        include: { vehicle: true },
      });

      if (log.status === MaintenanceStatus.Closed) {
        throw new Error("Maintenance record is already closed");
      }

      // Close the maintenance record
      const updatedLog = await tx.maintenanceLog.update({
        where: { id },
        data: {
          status: MaintenanceStatus.Closed,
          endDate: new Date(),
        },
      });

      // Check if there are other open maintenance records for this vehicle
      const otherOpenLogs = await tx.maintenanceLog.count({
        where: {
          vehicleId: log.vehicleId,
          status: MaintenanceStatus.Open,
          id: { not: id },
        },
      });

      // Only set vehicle back to Available if:
      //  - No other open maintenance records exist
      //  - Vehicle is currently InShop (not Retired)
      if (
        otherOpenLogs === 0 &&
        log.vehicle.status === VehicleStatus.InShop
      ) {
        await tx.vehicle.update({
          where: { id: log.vehicleId },
          data: { status: VehicleStatus.Available },
        });
      }

      return updatedLog;
    });

    return jsonSuccess(result);
  }
));
