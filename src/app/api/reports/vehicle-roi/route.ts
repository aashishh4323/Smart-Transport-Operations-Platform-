import { prisma } from "@/lib/prisma";
import { jsonSuccess, withErrorHandler } from "@/lib/api-helpers";
import { TripStatus } from "@prisma/client";

/**
 * GET /api/reports/vehicle-roi
 *
 * Calculates Vehicle ROI per vehicle.
 *
 * ROI = (Revenue − Operational Cost) / Acquisition Cost × 100
 *
 * Revenue is estimated from completed trips:
 *   Revenue = number of completed trips × plannedDistance (as a proxy)
 *   (In a real system, revenue would come from invoicing/billing)
 *
 * Operational Cost = Fuel + Maintenance costs
 */
export const GET = withErrorHandler(async () => {
  const vehicles = await prisma.vehicle.findMany({
    select: {
      id: true,
      registrationNumber: true,
      model: true,
      type: true,
      acquisitionCost: true,
    },
  });

  // Trip counts and total distance per vehicle
  const tripData = await prisma.trip.groupBy({
    by: ["vehicleId"],
    where: { status: TripStatus.Completed },
    _count: { id: true },
    _sum: { plannedDistance: true },
  });

  const tripMap = new Map<string, { count: number; totalDistance: number }>();
  for (const row of tripData) {
    tripMap.set(row.vehicleId, {
      count: row._count.id,
      totalDistance: row._sum.plannedDistance || 0,
    });
  }

  // Fuel costs per vehicle
  const fuelCosts = await prisma.fuelExpenseLog.groupBy({
    by: ["vehicleId"],
    _sum: { cost: true },
  });
  const fuelMap = new Map<string, number>();
  for (const row of fuelCosts) {
    fuelMap.set(row.vehicleId, row._sum.cost || 0);
  }

  // Maintenance costs per vehicle
  const maintenanceCosts = await prisma.maintenanceLog.groupBy({
    by: ["vehicleId"],
    _sum: { cost: true },
  });
  const maintenanceMap = new Map<string, number>();
  for (const row of maintenanceCosts) {
    maintenanceMap.set(row.vehicleId, row._sum.cost || 0);
  }

  const roiData = vehicles.map((vehicle) => {
    const trips = tripMap.get(vehicle.id) || { count: 0, totalDistance: 0 };
    const fuelCost = fuelMap.get(vehicle.id) || 0;
    const maintenanceCost = maintenanceMap.get(vehicle.id) || 0;
    const operationalCost = fuelCost + maintenanceCost;

    // Revenue proxy: total planned distance (to be replaced with real billing data)
    const estimatedRevenue = trips.totalDistance;

    const roi =
      vehicle.acquisitionCost > 0
        ? Math.round(
            ((estimatedRevenue - operationalCost) / vehicle.acquisitionCost) *
              100 *
              100
          ) / 100
        : 0;

    return {
      vehicle: {
        id: vehicle.id,
        registrationNumber: vehicle.registrationNumber,
        model: vehicle.model,
        type: vehicle.type,
        acquisitionCost: vehicle.acquisitionCost,
      },
      completedTrips: trips.count,
      totalDistance: Math.round(trips.totalDistance * 100) / 100,
      estimatedRevenue: Math.round(estimatedRevenue * 100) / 100,
      fuelCost: Math.round(fuelCost * 100) / 100,
      maintenanceCost: Math.round(maintenanceCost * 100) / 100,
      operationalCost: Math.round(operationalCost * 100) / 100,
      roiPercent: roi,
    };
  });

  // Sort by ROI (best first)
  roiData.sort((a, b) => b.roiPercent - a.roiPercent);

  return jsonSuccess(roiData);
});
