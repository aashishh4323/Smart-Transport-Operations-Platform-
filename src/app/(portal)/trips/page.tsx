"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/shared/page-header";
import { SearchFilterBar } from "@/components/shared/search-filter-bar";
import { StatusBadge } from "@/components/shared/status-badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAppState } from "@/lib/app-state-context";
import type { Trip, TripStatus, Vehicle, Driver } from "@/types";

const tripStatuses: TripStatus[] = ["Draft", "Dispatched", "Completed", "Cancelled"];

export default function TripsPage() {
  const { trips, vehicles, drivers, addTrip, updateTrip, dispatchTrip, completeTrip, cancelTrip } = useAppState();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [formState, setFormState] = useState({
    source: "",
    destination: "",
    vehicleId: "",
    driverId: "",
    cargoWeightKg: 1000,
    plannedDistanceKm: 100,
  });

  const filteredTrips = useMemo(() => trips.filter((trip) => {
    const matchesSearch = `${trip.code} ${trip.source} ${trip.destination}`.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || trip.status === statusFilter;
    return matchesSearch && matchesStatus;
  }), [trips, search, statusFilter]);

  const resetForm = () => {
    setSelectedTrip(null);
    setIsDialogOpen(false);
    setErrorMsg("");
    setFormState({ source: "", destination: "", vehicleId: "", driverId: "", cargoWeightKg: 1000, plannedDistanceKm: 100 });
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMsg("");
    try {
      if (selectedTrip) {
        await updateTrip({
          ...selectedTrip,
          ...formState,
          vehicleId: formState.vehicleId,
          driverId: formState.driverId,
          cargoWeightKg: Number(formState.cargoWeightKg),
          plannedDistanceKm: Number(formState.plannedDistanceKm),
        });
      } else {
        await addTrip({
          ...formState,
          createdAt: new Date().toISOString().slice(0, 10),
          vehicleId: formState.vehicleId,
          driverId: formState.driverId,
          cargoWeightKg: Number(formState.cargoWeightKg),
          plannedDistanceKm: Number(formState.plannedDistanceKm),
        } as Omit<Trip, "id" | "code">);
      }
      resetForm();
    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected error occurred");
    }
  };

  const availableVehicles = vehicles.filter((vehicle) => vehicle.status === "Available");
  const availableDrivers = drivers.filter((driver) => driver.status === "Available");

  return (
    <div className="space-y-6">
      <PageHeader title="Trips" description="Dispatch, monitor, complete, and cancel trips from one place." action={
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger render={<Button onClick={() => setIsDialogOpen(true)}><Plus className="mr-2 h-4 w-4" /> New trip</Button>} />
          <DialogContent className="sm:max-w-xl">
            <DialogHeader><DialogTitle>{selectedTrip ? "Edit draft trip" : "Create draft trip"}</DialogTitle><DialogDescription>Draft trips can be dispatched once the selected vehicle and driver are valid.</DialogDescription></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              {errorMsg && <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">{errorMsg}</div>}
              <div className="grid gap-4 md:grid-cols-2"><div className="space-y-2"><Label>Source</Label><Input value={formState.source} onChange={(event) => setFormState({ ...formState, source: event.target.value })} required /></div><div className="space-y-2"><Label>Destination</Label><Input value={formState.destination} onChange={(event) => setFormState({ ...formState, destination: event.target.value })} required /></div></div>
              <div className="grid gap-4 md:grid-cols-2"><div className="space-y-2"><Label>Vehicle</Label><Select value={formState.vehicleId} onValueChange={(value) => setFormState({ ...formState, vehicleId: value ?? "" })}><SelectTrigger><SelectValue placeholder="Select vehicle">{vehicles.find(v => v.id === formState.vehicleId) ? `${vehicles.find(v => v.id === formState.vehicleId)?.registrationNumber} · ${vehicles.find(v => v.id === formState.vehicleId)?.model}` : ""}</SelectValue></SelectTrigger><SelectContent>{availableVehicles.map((vehicle) => <SelectItem key={vehicle.id} value={vehicle.id}>{vehicle.registrationNumber} · {vehicle.model}</SelectItem>)}</SelectContent></Select></div><div className="space-y-2"><Label>Driver</Label><Select value={formState.driverId} onValueChange={(value) => setFormState({ ...formState, driverId: value ?? "" })}><SelectTrigger><SelectValue placeholder="Select driver">{drivers.find(d => d.id === formState.driverId) ? `${drivers.find(d => d.id === formState.driverId)?.name} · ${drivers.find(d => d.id === formState.driverId)?.licenseCategory}` : ""}</SelectValue></SelectTrigger><SelectContent>{availableDrivers.map((driver) => <SelectItem key={driver.id} value={driver.id}>{driver.name} · {driver.licenseCategory}</SelectItem>)}</SelectContent></Select></div></div>
              <div className="grid gap-4 md:grid-cols-2"><div className="space-y-2"><Label>Cargo weight (kg)</Label><Input type="number" min="1" value={formState.cargoWeightKg} onChange={(event) => setFormState({ ...formState, cargoWeightKg: Number(event.target.value) })} required /></div><div className="space-y-2"><Label>Planned distance (km)</Label><Input type="number" min="1" value={formState.plannedDistanceKm} onChange={(event) => setFormState({ ...formState, plannedDistanceKm: Number(event.target.value) })} required /></div></div>
              <DialogFooter><Button type="button" variant="outline" onClick={() => resetForm()}>Cancel</Button><Button type="submit">Save draft</Button></DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      } />
      <SearchFilterBar searchValue={search} onSearchChange={setSearch} filters={[{ label: "Status", value: statusFilter, options: [{ label: "All", value: "all" }, ...tripStatuses.map((status) => ({ label: status, value: status }))], onChange: (value) => setStatusFilter(value ?? "all") }]} />
      <div className="grid gap-4 xl:grid-cols-2">{filteredTrips.map((trip) => {
        const vehicle = vehicles.find((item) => item.id === trip.vehicleId);
        const driver = drivers.find((item) => item.id === trip.driverId);
        return <div key={trip.id} className="rounded-[24px] border border-[rgba(20,22,26,0.08)] bg-[rgba(255,255,255,0.8)] p-4 shadow-[0_14px_40px_rgba(15,18,25,0.05)] backdrop-blur-[16px]">
          <div className="flex items-start justify-between gap-3"><div><p className="text-[14px] font-semibold text-slate-900">{trip.code}</p><p className="text-[13px] text-slate-500">{trip.source} → {trip.destination}</p></div><StatusBadge status={trip.status} /></div>
          <div className="mt-4 grid gap-3 text-[13px] text-slate-600 sm:grid-cols-2"><div><span className="font-medium text-slate-800">Vehicle:</span> {vehicle?.registrationNumber ?? "—"}</div><div><span className="font-medium text-slate-800">Driver:</span> {driver?.name ?? "—"}</div><div><span className="font-medium text-slate-800">Cargo:</span> {trip.cargoWeightKg} kg</div><div><span className="font-medium text-slate-800">Distance:</span> {trip.plannedDistanceKm} km</div></div>
          <div className="mt-4 flex flex-wrap gap-2">{trip.status === "Draft" ? <><Button size="sm" onClick={() => dispatchTrip(trip.id)}>Dispatch</Button><Button size="sm" variant="outline" onClick={() => { setSelectedTrip(trip); setFormState({ source: trip.source, destination: trip.destination, vehicleId: trip.vehicleId, driverId: trip.driverId, cargoWeightKg: trip.cargoWeightKg ?? 1000, plannedDistanceKm: trip.plannedDistanceKm ?? 100 }); setIsDialogOpen(true); }}>Edit</Button></> : null}{trip.status === "Dispatched" ? <><Button size="sm" onClick={() => completeTrip(trip.id, (vehicle?.odometerKm ?? 0) + trip.plannedDistanceKm, 40)}>Complete</Button><Button size="sm" variant="outline" onClick={() => cancelTrip(trip.id)}>Cancel</Button></> : null}</div>
        </div>;
      })}</div>
    </div>
  );
}
