import { prisma } from "@/lib/prisma";
import { jsonSuccess, withErrorHandler } from "@/lib/api-helpers";
import { withRole } from "@/lib/rbac";

/**
 * GET /api/reports/operational-costs
 *
 * Calculates total operational cost per vehicle:
 *  - Fuel costs (from FuelExpenseLog)
 *  - Maintenance costs (from MaintenanceLog)
 *  - Total = Fuel + Maintenance
 *
 * Also provides monthly breakdown.
 */
export const GET = withRole(["FleetManager", "Dispatcher", "SafetyOfficer", "FinancialAnalyst"], withErrorHandler(async () => {
  // Get all vehicles
  const vehicles = await prisma.vehicle.findMany({
    select: {
      id: true,
      registrationNumber: true,
      model: true,
      type: true,
      acquisitionCost: true,
    },
  });

  // Aggregate fuel costs per vehicle
  const fuelCosts = await prisma.fuelExpenseLog.groupBy({
    by: ["vehicleId"],
    _sum: { cost: true },
  });

  const fuelCostMap = new Map<string, number>();
  for (const row of fuelCosts) {
    fuelCostMap.set(row.vehicleId, row._sum.cost || 0);
  }

  // Aggregate maintenance costs per vehicle
  const maintenanceCosts = await prisma.maintenanceLog.groupBy({
    by: ["vehicleId"],
    _sum: { cost: true },
  });

  const maintenanceCostMap = new Map<string, number>();
  for (const row of maintenanceCosts) {
    maintenanceCostMap.set(row.vehicleId, row._sum.cost || 0);
  }

  // Build per-vehicle cost summary
  const costData = vehicles.map((vehicle) => {
    const fuelCost = fuelCostMap.get(vehicle.id) || 0;
    const maintenanceCost = maintenanceCostMap.get(vehicle.id) || 0;
    const totalCost = fuelCost + maintenanceCost;

    return {
      vehicle: {
        id: vehicle.id,
        registrationNumber: vehicle.registrationNumber,
        model: vehicle.model,
        type: vehicle.type,
        acquisitionCost: vehicle.acquisitionCost,
      },
      fuelCost: Math.round(fuelCost * 100) / 100,
      maintenanceCost: Math.round(maintenanceCost * 100) / 100,
      totalOperationalCost: Math.round(totalCost * 100) / 100,
    };
  });

  // Sort by total cost (highest first)
  costData.sort((a, b) => b.totalOperationalCost - a.totalOperationalCost);

  // Monthly breakdown (last 12 months)
  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

  const monthlyFuel = await prisma.fuelExpenseLog.findMany({
    where: { date: { gte: twelveMonthsAgo } },
    select: { cost: true, date: true },
  });

  const monthlyMaintenance = await prisma.maintenanceLog.findMany({
    where: { startDate: { gte: twelveMonthsAgo } },
    select: { cost: true, startDate: true },
  });

  const monthlyMap = new Map<string, { fuel: number; maintenance: number }>();

  for (const entry of monthlyFuel) {
    const key = `${entry.date.getFullYear()}-${String(entry.date.getMonth() + 1).padStart(2, "0")}`;
    const existing = monthlyMap.get(key) || { fuel: 0, maintenance: 0 };
    existing.fuel += entry.cost;
    monthlyMap.set(key, existing);
  }

  for (const entry of monthlyMaintenance) {
    const key = `${entry.startDate.getFullYear()}-${String(entry.startDate.getMonth() + 1).padStart(2, "0")}`;
    const existing = monthlyMap.get(key) || { fuel: 0, maintenance: 0 };
    existing.maintenance += entry.cost;
    monthlyMap.set(key, existing);
  }

  const monthlyBreakdown = Array.from(monthlyMap.entries())
    .map(([month, costs]) => ({
      month,
      fuelCost: Math.round(costs.fuel * 100) / 100,
      maintenanceCost: Math.round(costs.maintenance * 100) / 100,
      total: Math.round((costs.fuel + costs.maintenance) * 100) / 100,
    }))
    .sort((a, b) => a.month.localeCompare(b.month));

  return jsonSuccess({
    perVehicle: costData,
    monthlyBreakdown,
  });
}));
