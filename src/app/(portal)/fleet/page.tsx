"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader } from "@/components/shared/page-header";
import { SearchFilterBar } from "@/components/shared/search-filter-bar";
import { StatusBadge } from "@/components/shared/status-badge";
import { useAppState } from "@/lib/app-state-context";
import type { Vehicle, VehicleStatus, VehicleType } from "@/types";

const vehicleTypes: VehicleType[] = ["Van", "Bus", "Minibus", "Truck", "Coach"];
const vehicleStatuses: VehicleStatus[] = ["Available", "OnTrip", "InShop", "Retired"];

export default function FleetPage() {
  const { vehicles, addVehicle, updateVehicle } = useAppState();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [formState, setFormState] = useState({
    registrationNumber: "",
    model: "",
    type: "Van" as VehicleType,
    maxLoadKg: 1000,
    odometerKm: 0,
    acquisitionCost: 1000000,
    status: "Available" as VehicleStatus,
    region: "Nairobi",
    lastServiceDate: "2026-07-12",
    notes: "",
  });

  const filteredVehicles = useMemo(() => {
    return vehicles.filter((vehicle) => {
      const matchesSearch = `${vehicle.registrationNumber} ${vehicle.model}`.toLowerCase().includes(search.toLowerCase());
      const matchesType = typeFilter === "all" || vehicle.type === typeFilter;
      const matchesStatus = statusFilter === "all" || vehicle.status === statusFilter;
      return matchesSearch && matchesType && matchesStatus;
    });
  }, [vehicles, search, typeFilter, statusFilter]);

  const resetForm = () => {
    setFormState({
      registrationNumber: "",
      model: "",
      type: "Van",
      maxLoadKg: 1000,
      odometerKm: 0,
      acquisitionCost: 1000000,
      status: "Available",
      region: "Nairobi",
      lastServiceDate: "2026-07-12",
      notes: "",
    });
    setSelectedVehicle(null);
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (selectedVehicle) {
      updateVehicle({ ...selectedVehicle, ...formState });
    } else {
      addVehicle(formState);
    }
    resetForm();
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Fleet" description="Manage the vehicle registry and availability states." action={
        <Dialog onOpenChange={(open) => (!open ? resetForm() : undefined)}>
          <DialogTrigger>
            <Button><Plus className="mr-2 h-4 w-4" /> Add vehicle</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-xl">
            <DialogHeader>
              <DialogTitle>{selectedVehicle ? "Edit vehicle" : "Create vehicle"}</DialogTitle>
              <DialogDescription>Keep the registry up to date so dispatching remains accurate.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2"><Label>Registration number</Label><Input value={formState.registrationNumber} onChange={(event) => setFormState({ ...formState, registrationNumber: event.target.value })} required /></div>
                <div className="space-y-2"><Label>Model</Label><Input value={formState.model} onChange={(event) => setFormState({ ...formState, model: event.target.value })} required /></div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2"><Label>Vehicle type</Label><Select value={formState.type} onValueChange={(value) => setFormState({ ...formState, type: value as VehicleType })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{vehicleTypes.map((type) => <SelectItem key={type} value={type}>{type}</SelectItem>)}</SelectContent></Select></div>
                <div className="space-y-2"><Label>Status</Label><Select value={formState.status} onValueChange={(value) => setFormState({ ...formState, status: value as VehicleStatus })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{vehicleStatuses.map((status) => <SelectItem key={status} value={status}>{status}</SelectItem>)}</SelectContent></Select></div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2"><Label>Maximum load (kg)</Label><Input type="number" min="1" value={formState.maxLoadKg} onChange={(event) => setFormState({ ...formState, maxLoadKg: Number(event.target.value) })} required /></div>
                <div className="space-y-2"><Label>Odometer (km)</Label><Input type="number" min="0" value={formState.odometerKm} onChange={(event) => setFormState({ ...formState, odometerKm: Number(event.target.value) })} required /></div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2"><Label>Acquisition cost</Label><Input type="number" min="1" value={formState.acquisitionCost} onChange={(event) => setFormState({ ...formState, acquisitionCost: Number(event.target.value) })} required /></div>
                <div className="space-y-2"><Label>Region</Label><Input value={formState.region} onChange={(event) => setFormState({ ...formState, region: event.target.value })} required /></div>
              </div>
              <div className="space-y-2"><Label>Last service date</Label><Input type="date" value={formState.lastServiceDate} onChange={(event) => setFormState({ ...formState, lastServiceDate: event.target.value })} required /></div>
              <div className="space-y-2"><Label>Notes</Label><Input value={formState.notes} onChange={(event) => setFormState({ ...formState, notes: event.target.value })} /></div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => resetForm()}>Cancel</Button>
                <Button type="submit">Save vehicle</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      } />
      <SearchFilterBar searchValue={search} onSearchChange={setSearch} filters={[{ label: "Type", value: typeFilter, options: [{ label: "All", value: "all" }, ...vehicleTypes.map((type) => ({ label: type, value: type }))], onChange: (value) => setTypeFilter(value ?? "all") }, { label: "Status", value: statusFilter, options: [{ label: "All", value: "all" }, ...vehicleStatuses.map((status) => ({ label: status, value: status }))], onChange: (value) => setStatusFilter(value ?? "all") }]} />
      <div className="overflow-hidden rounded-[24px] border border-[rgba(20,22,26,0.08)] bg-[rgba(255,255,255,0.8)] shadow-[0_14px_40px_rgba(15,18,25,0.05)] backdrop-blur-[16px]">
        <table className="min-w-full divide-y divide-[rgba(20,22,26,0.06)] text-[13px]">
          <thead className="bg-[rgba(241,243,245,0.7)] text-left text-slate-600">
            <tr>
              <th className="px-4 py-3 font-medium">Registration</th>
              <th className="px-4 py-3 font-medium">Model</th>
              <th className="px-4 py-3 font-medium">Type</th>
              <th className="px-4 py-3 font-medium">Max load</th>
              <th className="px-4 py-3 font-medium">Odometer</th>
              <th className="px-4 py-3 font-medium">Cost</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[rgba(20,22,26,0.06)]">
            {filteredVehicles.map((vehicle) => (
              <tr key={vehicle.id} className="transition hover:bg-white/70">
                <td className="px-4 py-3 font-medium text-slate-800">{vehicle.registrationNumber}</td>
                <td className="px-4 py-3">{vehicle.model}</td>
                <td className="px-4 py-3">{vehicle.type}</td>
                <td className="px-4 py-3">{vehicle.maxLoadKg} kg</td>
                <td className="px-4 py-3">{vehicle.odometerKm.toLocaleString()} km</td>
                <td className="px-4 py-3">KSh {vehicle.acquisitionCost.toLocaleString()}</td>
                <td className="px-4 py-3"><StatusBadge status={vehicle.status} /></td>
                <td className="px-4 py-3"><Button variant="outline" size="sm" onClick={() => { setSelectedVehicle(vehicle); setFormState({ registrationNumber: vehicle.registrationNumber, model: vehicle.model, type: vehicle.type, maxLoadKg: vehicle.maxLoadKg, odometerKm: vehicle.odometerKm, acquisitionCost: vehicle.acquisitionCost, status: vehicle.status, region: vehicle.region, lastServiceDate: vehicle.lastServiceDate, notes: vehicle.notes ?? "" }); }}>Edit</Button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
