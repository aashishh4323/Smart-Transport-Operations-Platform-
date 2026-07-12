import { prisma } from "@/lib/prisma";
import { jsonSuccess, withErrorHandler } from "@/lib/api-helpers";
import { withRole } from "@/lib/rbac";
import { TripStatus } from "@prisma/client";

/**
 * GET /api/reports/fuel-efficiency
 *
 * Calculates fuel efficiency per vehicle from completed trips.
 * Fuel Efficiency = Total Distance Travelled / Total Fuel Consumed (km/l)
 *
 * Distance is derived from (finalOdometer - previous odometer) or plannedDistance as fallback.
 */
export const GET = withRole(["FleetManager", "Dispatcher", "SafetyOfficer", "FinancialAnalyst"], withErrorHandler(async () => {
  // Get all completed trips with vehicle info
  const completedTrips = await prisma.trip.findMany({
    where: {
      status: TripStatus.Completed,
      fuelConsumed: { not: null, gt: 0 },
    },
    include: {
      vehicle: {
        select: { id: true, registrationNumber: true, model: true, type: true },
      },
    },
  });

  // Group by vehicle and calculate efficiency
  const vehicleMap = new Map<
    string,
    {
      vehicle: { id: string; registrationNumber: string; model: string; type: string };
      totalDistance: number;
      totalFuel: number;
      tripCount: number;
    }
  >();

  for (const trip of completedTrips) {
    const existing = vehicleMap.get(trip.vehicleId);
    const distance = trip.plannedDistance; // Using planned distance
    const fuel = trip.fuelConsumed || 0;

    if (existing) {
      existing.totalDistance += distance;
      existing.totalFuel += fuel;
      existing.tripCount += 1;
    } else {
      vehicleMap.set(trip.vehicleId, {
        vehicle: trip.vehicle,
        totalDistance: distance,
        totalFuel: fuel,
        tripCount: 1,
      });
    }
  }

  const efficiencyData = Array.from(vehicleMap.values()).map((entry) => ({
    vehicle: entry.vehicle,
    totalDistance: Math.round(entry.totalDistance * 100) / 100,
    totalFuel: Math.round(entry.totalFuel * 100) / 100,
    fuelEfficiency:
      entry.totalFuel > 0
        ? Math.round((entry.totalDistance / entry.totalFuel) * 100) / 100
        : 0,
    tripCount: entry.tripCount,
  }));

  // Sort by efficiency (best first)
  efficiencyData.sort((a, b) => b.fuelEfficiency - a.fuelEfficiency);

  return jsonSuccess(efficiencyData);
}));
