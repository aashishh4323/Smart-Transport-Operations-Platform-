"use client";

import { useMemo } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { useAppState } from "@/lib/app-state-context";

export default function AnalyticsPage() {
  const { vehicles, trips, fuelExpenseLogs } = useAppState();

  const metrics = useMemo(() => {
    const activeVehicles = vehicles.filter((vehicle) => vehicle.status !== "Retired").length;
    const onTripVehicles = vehicles.filter((vehicle) => vehicle.status === "OnTrip").length;
    const fleetUtilization = activeVehicles ? Math.round((onTripVehicles / activeVehicles) * 100) : 0;
    const fuelCost = fuelExpenseLogs.filter((entry) => entry.type === "Fuel").reduce((sum, entry) => sum + entry.amount, 0);
    const operationalCost = fuelExpenseLogs.reduce((sum, entry) => sum + entry.amount, 0);
    const revenue = 16000000;
    const roi = vehicles.length ? Math.round(((revenue - operationalCost) / vehicles.reduce((sum, vehicle) => sum + vehicle.acquisitionCost, 0)) * 100) : 0;
    return { fleetUtilization, fuelCost, operationalCost, revenue, roi };
  }, [vehicles, fuelExpenseLogs]);

  return (
    <div className="space-y-6">
      <PageHeader title="Analytics" description="Review fleet performance and cost efficiency." />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><p className="text-sm text-slate-500">Fuel efficiency KPI</p><p className="mt-2 text-2xl font-semibold">7.3 L/100km</p></div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><p className="text-sm text-slate-500">Fleet utilization KPI</p><p className="mt-2 text-2xl font-semibold">{metrics.fleetUtilization}%</p></div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><p className="text-sm text-slate-500">Maintenance cost KPI</p><p className="mt-2 text-2xl font-semibold">₹ 0</p></div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><p className="text-sm text-slate-500">Operational cost KPI</p><p className="mt-2 text-2xl font-semibold">₹ {metrics.operationalCost.toLocaleString()}</p></div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><p className="text-sm text-slate-500">Vehicle ROI KPI</p><p className="mt-2 text-2xl font-semibold">{metrics.roi}%</p></div>
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-800">Monthly revenue vs cost</h2>
        <p className="mt-1 text-sm text-slate-500">Mock trend view based on current operational data.</p>
        <div className="mt-4 h-48 rounded-xl bg-slate-50" />
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="text-lg font-semibold text-slate-800">Fuel efficiency trend</h2><div className="mt-4 h-48 rounded-xl bg-slate-50" /></div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="text-lg font-semibold text-slate-800">Top costliest vehicles</h2><div className="mt-4 h-48 rounded-xl bg-slate-50" /></div>
      </div>
    </div>
  );
}
