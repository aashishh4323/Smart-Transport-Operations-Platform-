import { prisma } from "@/lib/prisma";
import { jsonSuccess, withErrorHandler } from "@/lib/api-helpers";
import { VehicleStatus, DriverStatus, TripStatus } from "@prisma/client";

/**
 * GET /api/reports/dashboard
 *
 * Returns dashboard KPI data:
 *  - Total vehicles, active (non-Retired), available, on trip, in shop
 *  - Total drivers, available, on trip, on duty
 *  - Active trips (Draft + Dispatched), completed trips
 *  - Fleet utilization % = OnTrip / (Total Active) * 100
 */
export const GET = withErrorHandler(async () => {
  // Vehicle counts by status
  const vehicleCounts = await prisma.vehicle.groupBy({
    by: ["status"],
    _count: { id: true },
  });

  const vehicleByStatus: Record<string, number> = {};
  let totalVehicles = 0;
  for (const row of vehicleCounts) {
    vehicleByStatus[row.status] = row._count.id;
    totalVehicles += row._count.id;
  }

  const activeVehicles =
    totalVehicles - (vehicleByStatus[VehicleStatus.Retired] || 0);
  const availableVehicles = vehicleByStatus[VehicleStatus.Available] || 0;
  const onTripVehicles = vehicleByStatus[VehicleStatus.OnTrip] || 0;
  const inShopVehicles = vehicleByStatus[VehicleStatus.InShop] || 0;

  // Driver counts by status
  const driverCounts = await prisma.driver.groupBy({
    by: ["status"],
    _count: { id: true },
  });

  const driverByStatus: Record<string, number> = {};
  let totalDrivers = 0;
  for (const row of driverCounts) {
    driverByStatus[row.status] = row._count.id;
    totalDrivers += row._count.id;
  }

  const availableDrivers = driverByStatus[DriverStatus.Available] || 0;
  const onTripDrivers = driverByStatus[DriverStatus.OnTrip] || 0;
  const driversOnDuty =
    (driverByStatus[DriverStatus.Available] || 0) +
    (driverByStatus[DriverStatus.OnTrip] || 0);

  // Trip counts by status
  const tripCounts = await prisma.trip.groupBy({
    by: ["status"],
    _count: { id: true },
  });

  const tripByStatus: Record<string, number> = {};
  for (const row of tripCounts) {
    tripByStatus[row.status] = row._count.id;
  }

  const activeTrips =
    (tripByStatus[TripStatus.Draft] || 0) +
    (tripByStatus[TripStatus.Dispatched] || 0);
  const completedTrips = tripByStatus[TripStatus.Completed] || 0;

  // Fleet utilization
  const fleetUtilization =
    activeVehicles > 0
      ? Math.round((onTripVehicles / activeVehicles) * 100 * 10) / 10
      : 0;

  return jsonSuccess({
    vehicles: {
      total: totalVehicles,
      active: activeVehicles,
      available: availableVehicles,
      onTrip: onTripVehicles,
      inShop: inShopVehicles,
      retired: vehicleByStatus[VehicleStatus.Retired] || 0,
    },
    drivers: {
      total: totalDrivers,
      available: availableDrivers,
      onTrip: onTripDrivers,
      onDuty: driversOnDuty,
      offDuty: driverByStatus[DriverStatus.OffDuty] || 0,
      suspended: driverByStatus[DriverStatus.Suspended] || 0,
    },
    trips: {
      active: activeTrips,
      draft: tripByStatus[TripStatus.Draft] || 0,
      dispatched: tripByStatus[TripStatus.Dispatched] || 0,
      completed: completedTrips,
      cancelled: tripByStatus[TripStatus.Cancelled] || 0,
    },
    fleetUtilization,
  });
});
