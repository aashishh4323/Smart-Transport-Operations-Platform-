"use client";

import { Activity, CircleParking, Truck, UserCheck, Wrench } from "lucide-react";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { ActivityFeed } from "@/components/shared/activity-feed";
import { PageHeader } from "@/components/shared/page-header";
import { useAppState } from "@/lib/app-state-context";
import { useAuth } from "@/lib/auth-context";
import { useMemo } from "react";

export default function DashboardPage() {
  const { vehicles, drivers, trips, activities } = useAppState();
  const { user } = useAuth();

  const metrics = useMemo(() => {
    const availableVehicles = vehicles.filter((vehicle) => vehicle.status === "Available").length;
    const vehiclesOnTrip = vehicles.filter((vehicle) => vehicle.status === "OnTrip").length;
    const inMaintenance = vehicles.filter((vehicle) => vehicle.status === "InShop").length;
    const activeVehicles = vehicles.filter((vehicle) => vehicle.status !== "Retired").length;
    const activeTrips = trips.filter((trip) => trip.status === "Dispatched").length;
    const driversOnDuty = drivers.filter((driver) => driver.status === "OnTrip" || driver.status === "Available").length;
    const utilization = activeVehicles ? Math.round((vehiclesOnTrip / activeVehicles) * 100) : 0;

    return { availableVehicles, vehiclesOnTrip, inMaintenance, activeVehicles, activeTrips, driversOnDuty, utilization };
  }, [vehicles, drivers, trips]);

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" description={`Welcome back, ${user?.name ?? "Operations lead"}.`} />
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <KpiCard title="Active Vehicles" value={metrics.activeVehicles} icon={Truck} description="Excluding retired units" />
        <KpiCard title="Available Vehicles" value={metrics.availableVehicles} icon={CircleParking} description="Ready for dispatch" />
        <KpiCard title="Active Trips" value={metrics.activeTrips} icon={Activity} description="Trips currently in motion" />
        <KpiCard title="In Maintenance" value={metrics.inMaintenance} icon={Wrench} description="Units under workshop care" />
        <KpiCard title="Drivers on Duty" value={metrics.driversOnDuty} icon={UserCheck} description="Available or currently assigned" />
        <KpiCard title="Fleet Utilization" value={`${metrics.utilization}%`} icon={Activity} description="OnTrip / active vehicles" />
      </section>
      <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
        <div className="rounded-[24px] border border-[rgba(20,22,26,0.08)] bg-[rgba(255,255,255,0.78)] p-5 shadow-[0_14px_40px_rgba(15,18,25,0.05)] backdrop-blur-[16px]">
          <h2 className="text-[17px] font-semibold text-slate-900">Operational overview</h2>
          <p className="mt-1 text-[13px] text-slate-500">The mock data and state layer update as you create and dispatch trips.</p>
        </div>
        <ActivityFeed activities={activities} />
      </div>
    </div>
  );
}