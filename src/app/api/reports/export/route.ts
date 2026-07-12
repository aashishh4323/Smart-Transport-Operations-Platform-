import { prisma } from "@/lib/prisma";
import { jsonError, withErrorHandler } from "@/lib/api-helpers";
import { TripStatus } from "@prisma/client";
import { NextResponse } from "next/server";

/**
 * GET /api/reports/export?type=fuel|costs|roi
 *
 * Exports report data as CSV.
 */
export const GET = withErrorHandler(async (req: Request) => {
  const { searchParams } = new URL(req.url);
  const reportType = searchParams.get("type");

  if (!reportType || !["fuel", "costs", "roi"].includes(reportType)) {
    return jsonError(
      'Missing or invalid "type" parameter. Must be one of: fuel, costs, roi'
    );
  }

  let csvContent = "";
  let filename = "";

  switch (reportType) {
    case "fuel": {
      filename = "fuel_efficiency_report.csv";
      csvContent = "Vehicle Registration,Model,Type,Total Distance (km),Total Fuel (L),Fuel Efficiency (km/L),Trip Count\n";

      const completedTrips = await prisma.trip.findMany({
        where: { status: TripStatus.Completed, fuelConsumed: { not: null, gt: 0 } },
        include: {
          vehicle: { select: { registrationNumber: true, model: true, type: true } },
        },
      });

      const vehicleMap = new Map<
        string,
        {
          reg: string; model: string; type: string;
          totalDistance: number; totalFuel: number; tripCount: number;
        }
      >();

      for (const trip of completedTrips) {
        const existing = vehicleMap.get(trip.vehicleId);
        if (existing) {
          existing.totalDistance += trip.plannedDistance;
          existing.totalFuel += trip.fuelConsumed || 0;
          existing.tripCount += 1;
        } else {
          vehicleMap.set(trip.vehicleId, {
            reg: trip.vehicle.registrationNumber,
            model: trip.vehicle.model,
            type: trip.vehicle.type,
            totalDistance: trip.plannedDistance,
            totalFuel: trip.fuelConsumed || 0,
            tripCount: 1,
          });
        }
      }

      for (const entry of vehicleMap.values()) {
        const efficiency = entry.totalFuel > 0
          ? (entry.totalDistance / entry.totalFuel).toFixed(2)
          : "0";
        csvContent += `${entry.reg},${entry.model},${entry.type},${entry.totalDistance.toFixed(2)},${entry.totalFuel.toFixed(2)},${efficiency},${entry.tripCount}\n`;
      }
      break;
    }

    case "costs": {
      filename = "operational_costs_report.csv";
      csvContent = "Vehicle Registration,Model,Type,Fuel Cost,Maintenance Cost,Total Operational Cost\n";

      const vehicles = await prisma.vehicle.findMany({
        select: { id: true, registrationNumber: true, model: true, type: true },
      });

      const fuelCosts = await prisma.fuelExpenseLog.groupBy({
        by: ["vehicleId"],
        _sum: { cost: true },
      });
      const fuelMap = new Map(fuelCosts.map((r) => [r.vehicleId, r._sum.cost || 0]));

      const maintCosts = await prisma.maintenanceLog.groupBy({
        by: ["vehicleId"],
        _sum: { cost: true },
      });
      const maintMap = new Map(maintCosts.map((r) => [r.vehicleId, r._sum.cost || 0]));

      for (const v of vehicles) {
        const fuel = fuelMap.get(v.id) || 0;
        const maint = maintMap.get(v.id) || 0;
        csvContent += `${v.registrationNumber},${v.model},${v.type},${fuel.toFixed(2)},${maint.toFixed(2)},${(fuel + maint).toFixed(2)}\n`;
      }
      break;
    }

    case "roi": {
      filename = "vehicle_roi_report.csv";
      csvContent = "Vehicle Registration,Model,Type,Acquisition Cost,Completed Trips,Estimated Revenue,Operational Cost,ROI %\n";

      const vehicles = await prisma.vehicle.findMany({
        select: { id: true, registrationNumber: true, model: true, type: true, acquisitionCost: true },
      });

      const tripData = await prisma.trip.groupBy({
        by: ["vehicleId"],
        where: { status: TripStatus.Completed },
        _count: { id: true },
        _sum: { plannedDistance: true },
      });
      const tripMap = new Map(
        tripData.map((r) => [r.vehicleId, { count: r._count.id, dist: r._sum.plannedDistance || 0 }])
      );

      const fuelCosts = await prisma.fuelExpenseLog.groupBy({
        by: ["vehicleId"],
        _sum: { cost: true },
      });
      const fuelMap = new Map(fuelCosts.map((r) => [r.vehicleId, r._sum.cost || 0]));

      const maintCosts = await prisma.maintenanceLog.groupBy({
        by: ["vehicleId"],
        _sum: { cost: true },
      });
      const maintMap = new Map(maintCosts.map((r) => [r.vehicleId, r._sum.cost || 0]));

      for (const v of vehicles) {
        const trips = tripMap.get(v.id) || { count: 0, dist: 0 };
        const opCost = (fuelMap.get(v.id) || 0) + (maintMap.get(v.id) || 0);
        const revenue = trips.dist;
        const roi = v.acquisitionCost > 0
          ? (((revenue - opCost) / v.acquisitionCost) * 100).toFixed(2)
          : "0";
        csvContent += `${v.registrationNumber},${v.model},${v.type},${v.acquisitionCost.toFixed(2)},${trips.count},${revenue.toFixed(2)},${opCost.toFixed(2)},${roi}\n`;
      }
      break;
    }
  }

  return new NextResponse(csvContent, {
    status: 200,
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
});
