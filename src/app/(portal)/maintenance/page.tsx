"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { useAppState } from "@/lib/app-state-context";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { MaintenanceLog, Vehicle } from "@/types";

export default function MaintenancePage() {
  const { vehicles, maintenanceLogs, addMaintenance, closeMaintenance } = useAppState();
  const [formState, setFormState] = useState({ vehicleId: "", description: "", cost: 100000, startDate: new Date().toISOString().slice(0, 10) });
  const [selectedMaintenance, setSelectedMaintenance] = useState<MaintenanceLog | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const openMaintenanceList = useMemo(() => maintenanceLogs.filter((entry) => entry.status === "Open"), [maintenanceLogs]);
  const closedMaintenance = useMemo(() => maintenanceLogs.filter((entry) => entry.status === "Closed"), [maintenanceLogs]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMsg("");
    try {
      await addMaintenance({ vehicleId: formState.vehicleId, description: formState.description, cost: Number(formState.cost), startDate: formState.startDate });
      setFormState({ vehicleId: "", description: "", cost: 100000, startDate: new Date().toISOString().slice(0, 10) });
      setIsDialogOpen(false);
    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected error occurred");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Maintenance" description="Track workshop work and lifecycle changes." action={
        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if(!open) setErrorMsg(""); }}>
          <DialogTrigger render={<Button onClick={() => setIsDialogOpen(true)}><Plus className="mr-2 h-4 w-4" /> New maintenance</Button>} />
          <DialogContent>
            <DialogHeader><DialogTitle>Create maintenance entry</DialogTitle><DialogDescription>Opening maintenance moves the selected vehicle into InShop.</DialogDescription></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              {errorMsg && <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">{errorMsg}</div>}
              <div className="space-y-2"><Label>Vehicle</Label><Select value={formState.vehicleId} onValueChange={(value) => setFormState({ ...formState, vehicleId: value ?? "" })}><SelectTrigger><SelectValue placeholder="Select vehicle">{vehicles.find(v => v.id === formState.vehicleId)?.registrationNumber || ""}</SelectValue></SelectTrigger><SelectContent>{vehicles.filter((vehicle) => vehicle.status !== "Retired" && vehicle.status !== "InShop").map((vehicle) => <SelectItem key={vehicle.id} value={vehicle.id}>{vehicle.registrationNumber} · {vehicle.model}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-2"><Label>Description</Label><Input value={formState.description} onChange={(event) => setFormState({ ...formState, description: event.target.value })} required /></div>
              <div className="grid gap-4 md:grid-cols-2"><div className="space-y-2"><Label>Cost</Label><Input type="number" min="1" value={formState.cost} onChange={(event) => setFormState({ ...formState, cost: Number(event.target.value) })} required /></div><div className="space-y-2"><Label>Start date</Label><Input type="date" value={formState.startDate} onChange={(event) => setFormState({ ...formState, startDate: event.target.value })} required /></div></div>
              <DialogFooter><Button type="submit">Open maintenance</Button></DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      } />
      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <div className="rounded-[24px] border border-[rgba(20,22,26,0.08)] bg-[rgba(255,255,255,0.8)] p-5 shadow-[0_14px_40px_rgba(15,18,25,0.05)] backdrop-blur-[16px]">
          <h2 className="text-[17px] font-semibold text-slate-800">Open maintenance</h2>
          <div className="mt-4 space-y-3">{openMaintenanceList.map((entry) => { const vehicle = vehicles.find((item) => item.id === entry.vehicleId); return <div key={entry.id} className="rounded-2xl border border-[rgba(20,22,26,0.06)] bg-white/70 p-3"><div className="flex items-start justify-between"><div><p className="font-medium text-slate-800">{vehicle?.registrationNumber ?? "Vehicle"}</p><p className="text-[13px] text-slate-500">{entry.description}</p></div><StatusBadge status={entry.status} /></div><p className="mt-2 text-[13px] text-slate-500">Cost: ₹ {entry.cost.toLocaleString()} · Start: {entry.startDate}</p><Button className="mt-3" size="sm" onClick={() => closeMaintenance(entry.id).catch((err: any) => alert(err.message || "Error closing maintenance"))}>Close maintenance</Button></div>; })}</div>
        </div>
        <div className="rounded-[24px] border border-[rgba(20,22,26,0.08)] bg-[rgba(255,255,255,0.8)] p-5 shadow-[0_14px_40px_rgba(15,18,25,0.05)] backdrop-blur-[16px]">
          <h2 className="text-[17px] font-semibold text-slate-800">Maintenance history</h2>
          <div className="mt-4 space-y-3">{closedMaintenance.map((entry) => { const vehicle = vehicles.find((item) => item.id === entry.vehicleId); return <div key={entry.id} className="rounded-2xl border border-[rgba(20,22,26,0.06)] bg-white/70 p-3"><p className="font-medium text-slate-800">{vehicle?.registrationNumber ?? "Vehicle"}</p><p className="text-[13px] text-slate-500">{entry.description}</p><p className="mt-2 text-[13px] text-slate-500">Closed: {entry.endDate}</p></div>; })}</div>
        </div>
      </div>
    </div>
  );
}
