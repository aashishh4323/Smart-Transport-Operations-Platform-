"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader } from "@/components/shared/page-header";
import { SearchFilterBar } from "@/components/shared/search-filter-bar";
import { StatusBadge } from "@/components/shared/status-badge";
import { useAppState } from "@/lib/app-state-context";
import type { Driver, DriverCategory, DriverStatus } from "@/types";

const driverCategories: DriverCategory[] = ["Class A", "Class B", "Class C"];
const driverStatuses: DriverStatus[] = ["Available", "OnTrip", "OffDuty", "Suspended"];

export default function DriversPage() {
  const { drivers, addDriver, updateDriver } = useAppState();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [formState, setFormState] = useState({
    name: "",
    licenseNumber: "",
    licenseCategory: "Class A" as DriverCategory,
    licenseExpiry: "2028-01-01",
    contact: "",
    safetyScore: 85,
    status: "Available" as DriverStatus,
    region: "Nairobi",
  });

  const filteredDrivers = useMemo(() => drivers.filter((driver) => {
    const matchesSearch = `${driver.name} ${driver.licenseNumber}`.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === "all" || driver.licenseCategory === categoryFilter;
    const matchesStatus = statusFilter === "all" || driver.status === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  }), [drivers, search, categoryFilter, statusFilter]);

  const resetForm = () => {
    setSelectedDriver(null);
    setFormState({ name: "", licenseNumber: "", licenseCategory: "Class A", licenseExpiry: "2028-01-01", contact: "", safetyScore: 85, status: "Available", region: "Nairobi" });
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (selectedDriver) {
      updateDriver({ ...selectedDriver, ...formState });
    } else {
      addDriver(formState);
    }
    resetForm();
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Drivers" description="Track license validity and dispatch readiness." action={
        <Dialog onOpenChange={(open) => (!open ? resetForm() : undefined)}>
          <DialogTrigger><Button><Plus className="mr-2 h-4 w-4" /> Add driver</Button></DialogTrigger>
          <DialogContent className="sm:max-w-xl">
            <DialogHeader><DialogTitle>{selectedDriver ? "Edit driver" : "Create driver"}</DialogTitle><DialogDescription>Capture licenses, safety, and dispatch status.</DialogDescription></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2"><div className="space-y-2"><Label>Name</Label><Input value={formState.name} onChange={(event) => setFormState({ ...formState, name: event.target.value })} required /></div><div className="space-y-2"><Label>License number</Label><Input value={formState.licenseNumber} onChange={(event) => setFormState({ ...formState, licenseNumber: event.target.value })} required /></div></div>
              <div className="grid gap-4 md:grid-cols-2"><div className="space-y-2"><Label>Category</Label><Select value={formState.licenseCategory} onValueChange={(value) => setFormState({ ...formState, licenseCategory: value as DriverCategory })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{driverCategories.map((category) => <SelectItem key={category} value={category}>{category}</SelectItem>)}</SelectContent></Select></div><div className="space-y-2"><Label>Status</Label><Select value={formState.status} onValueChange={(value) => setFormState({ ...formState, status: value as DriverStatus })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{driverStatuses.map((status)=> <SelectItem key={status} value={status}>{status}</SelectItem>)}</SelectContent></Select></div></div>
              <div className="grid gap-4 md:grid-cols-2"><div className="space-y-2"><Label>License expiry</Label><Input type="date" value={formState.licenseExpiry} onChange={(event) => setFormState({ ...formState, licenseExpiry: event.target.value })} required /></div><div className="space-y-2"><Label>Contact</Label><Input value={formState.contact} onChange={(event) => setFormState({ ...formState, contact: event.target.value })} required /></div></div>
              <div className="space-y-2"><Label>Safety score</Label><Input type="number" min="0" max="100" value={formState.safetyScore} onChange={(event) => setFormState({ ...formState, safetyScore: Number(event.target.value) })} required /></div>
              <div className="space-y-2"><Label>Region</Label><Input value={formState.region} onChange={(event) => setFormState({ ...formState, region: event.target.value })} required /></div>
              <DialogFooter><Button type="button" variant="outline" onClick={() => resetForm()}>Cancel</Button><Button type="submit">Save driver</Button></DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      } />
      <SearchFilterBar searchValue={search} onSearchChange={setSearch} filters={[{ label: "Category", value: categoryFilter, options: [{ label: "All", value: "all" }, ...driverCategories.map((category) => ({ label: category, value: category }))], onChange: (value) => setCategoryFilter(value ?? "all") }, { label: "Status", value: statusFilter, options: [{ label: "All", value: "all" }, ...driverStatuses.map((status) => ({ label: status, value: status }))], onChange: (value) => setStatusFilter(value ?? "all") }]} />
      <div className="overflow-hidden rounded-[24px] border border-[rgba(20,22,26,0.08)] bg-[rgba(255,255,255,0.8)] shadow-[0_14px_40px_rgba(15,18,25,0.05)] backdrop-blur-[16px]">
        <table className="min-w-full divide-y divide-[rgba(20,22,26,0.06)] text-[13px]">
          <thead className="bg-[rgba(241,243,245,0.7)] text-left text-slate-600"><tr><th className="px-4 py-3 font-medium">Name</th><th className="px-4 py-3 font-medium">License</th><th className="px-4 py-3 font-medium">Category</th><th className="px-4 py-3 font-medium">Expiry</th><th className="px-4 py-3 font-medium">Contact</th><th className="px-4 py-3 font-medium">Safety</th><th className="px-4 py-3 font-medium">Status</th><th className="px-4 py-3 font-medium">Actions</th></tr></thead>
          <tbody className="divide-y divide-[rgba(20,22,26,0.06)]">{filteredDrivers.map((driver) => <tr key={driver.id} className="transition hover:bg-white/70"><td className="px-4 py-3 font-medium text-slate-800">{driver.name}</td><td className="px-4 py-3">{driver.licenseNumber}</td><td className="px-4 py-3">{driver.licenseCategory}</td><td className={`px-4 py-3 ${new Date(driver.licenseExpiry) < new Date() ? "text-red-600" : "text-slate-600"}`}>{driver.licenseExpiry}</td><td className="px-4 py-3">{driver.contact}</td><td className="px-4 py-3"><div className="flex items-center gap-3"><Progress value={driver.safetyScore} className="h-2 w-24" /><span>{driver.safetyScore}</span></div></td><td className="px-4 py-3"><StatusBadge status={driver.status} /></td><td className="px-4 py-3"><Button variant="outline" size="sm" onClick={() => { setSelectedDriver(driver); setFormState({ name: driver.name, licenseNumber: driver.licenseNumber, licenseCategory: driver.licenseCategory, licenseExpiry: driver.licenseExpiry, contact: driver.contact, safetyScore: driver.safetyScore, status: driver.status, region: driver.region }); }}>Edit</Button></td></tr>)}</tbody>
        </table>
      </div>
    </div>
  );
}
