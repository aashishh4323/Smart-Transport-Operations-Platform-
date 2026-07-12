"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/shared/page-header";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAppState } from "@/lib/app-state-context";
import type { FuelExpenseLog } from "@/types";

export default function ExpensesPage() {
  const { vehicles, trips, fuelExpenseLogs, addFuelExpense } = useAppState();
  const [fuelState, setFuelState] = useState({ vehicleId: "", tripId: "", amount: 10000, date: new Date().toISOString().slice(0, 10), liters: 80, details: "" });
  const [expenseState, setExpenseState] = useState({ vehicleId: "", tripId: "", type: "Other" as FuelExpenseLog["type"], amount: 5000, date: new Date().toISOString().slice(0, 10), details: "" });

  const summary = useMemo(() => {
    const fuelCost = fuelExpenseLogs.filter((entry) => entry.type === "Fuel").reduce((sum, entry) => sum + entry.amount, 0);
    const maintenanceCost = 0;
    const otherCost = fuelExpenseLogs.filter((entry) => entry.type !== "Fuel").reduce((sum, entry) => sum + entry.amount, 0);
    const operationalCost = fuelCost + otherCost + maintenanceCost;
    return { fuelCost, maintenanceCost, otherCost, operationalCost };
  }, [fuelExpenseLogs]);

  return (
    <div className="space-y-6">
      <PageHeader title="Fuel & Expenses" description="Record operational spend and review cost trends." />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><p className="text-sm text-slate-500">Fuel cost</p><p className="mt-2 text-2xl font-semibold">KSh {summary.fuelCost.toLocaleString()}</p></div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><p className="text-sm text-slate-500">Maintenance cost</p><p className="mt-2 text-2xl font-semibold">KSh {summary.maintenanceCost.toLocaleString()}</p></div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><p className="text-sm text-slate-500">Toll / other</p><p className="mt-2 text-2xl font-semibold">KSh {summary.otherCost.toLocaleString()}</p></div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><p className="text-sm text-slate-500">Operational cost</p><p className="mt-2 text-2xl font-semibold">KSh {summary.operationalCost.toLocaleString()}</p></div>
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between"><h2 className="text-lg font-semibold text-slate-800">Fuel logs</h2><Dialog><DialogTrigger><Button size="sm"><Plus className="mr-2 h-4 w-4" /> Add fuel</Button></DialogTrigger><DialogContent><DialogHeader><DialogTitle>Log fuel purchase</DialogTitle><DialogDescription>Capture fuel purchases tied to vehicles and trips.</DialogDescription></DialogHeader><div className="space-y-4"><div className="space-y-2"><Label>Vehicle</Label><Select value={fuelState.vehicleId} onValueChange={(value) => setFuelState({ ...fuelState, vehicleId: value ?? "" })}><SelectTrigger><SelectValue placeholder="Select vehicle" /></SelectTrigger><SelectContent>{vehicles.map((vehicle) => <SelectItem key={vehicle.id} value={vehicle.id}>{vehicle.registrationNumber}</SelectItem>)}</SelectContent></Select></div><div className="space-y-2"><Label>Related trip</Label><Select value={fuelState.tripId} onValueChange={(value) => setFuelState({ ...fuelState, tripId: value ?? "" })}><SelectTrigger><SelectValue placeholder="Optional trip" /></SelectTrigger><SelectContent>{trips.map((trip) => <SelectItem key={trip.id} value={trip.id}>{trip.code}</SelectItem>)}</SelectContent></Select></div><div className="grid gap-4 md:grid-cols-2"><div className="space-y-2"><Label>Liters</Label><Input type="number" min="1" value={fuelState.liters} onChange={(event) => setFuelState({ ...fuelState, liters: Number(event.target.value) })} /></div><div className="space-y-2"><Label>Cost</Label><Input type="number" min="1" value={fuelState.amount} onChange={(event) => setFuelState({ ...fuelState, amount: Number(event.target.value) })} /></div></div><div className="space-y-2"><Label>Date</Label><Input type="date" value={fuelState.date} onChange={(event) => setFuelState({ ...fuelState, date: event.target.value })} /></div><div className="space-y-2"><Label>Details</Label><Input value={fuelState.details} onChange={(event) => setFuelState({ ...fuelState, details: event.target.value })} /></div><DialogFooter><Button onClick={() => { addFuelExpense({ vehicleId: fuelState.vehicleId, tripId: fuelState.tripId || undefined, type: "Fuel", amount: fuelState.amount, date: fuelState.date, liters: fuelState.liters, details: fuelState.details }); setFuelState({ vehicleId: "", tripId: "", amount: 10000, date: new Date().toISOString().slice(0, 10), liters: 80, details: "" }); }}>Save fuel</Button></DialogFooter></div></DialogContent></Dialog></div>
          <div className="mt-4 space-y-3">{fuelExpenseLogs.filter((entry) => entry.type === "Fuel").map((entry) => <div key={entry.id} className="rounded-xl border border-slate-200 p-3 text-sm text-slate-600"><div className="flex items-center justify-between"><span className="font-medium text-slate-800">{vehicles.find((vehicle) => vehicle.id === entry.vehicleId)?.registrationNumber ?? "Vehicle"}</span><span>KSh {entry.amount.toLocaleString()}</span></div><p className="mt-1">{entry.details ?? "Fuel purchase"}</p><p className="mt-1 text-xs">{entry.date}</p></div>)}</div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between"><h2 className="text-lg font-semibold text-slate-800">Other expenses</h2><Dialog><DialogTrigger><Button size="sm"><Plus className="mr-2 h-4 w-4" /> Add expense</Button></DialogTrigger><DialogContent><DialogHeader><DialogTitle>Log expense</DialogTitle><DialogDescription>Capture tolls and miscellaneous operational spend.</DialogDescription></DialogHeader><div className="space-y-4"><div className="space-y-2"><Label>Vehicle</Label><Select value={expenseState.vehicleId} onValueChange={(value) => setExpenseState({ ...expenseState, vehicleId: value ?? "" })}><SelectTrigger><SelectValue placeholder="Select vehicle" /></SelectTrigger><SelectContent>{vehicles.map((vehicle) => <SelectItem key={vehicle.id} value={vehicle.id}>{vehicle.registrationNumber}</SelectItem>)}</SelectContent></Select></div><div className="space-y-2"><Label>Type</Label><Select value={expenseState.type} onValueChange={(value) => setExpenseState({ ...expenseState, type: (value as FuelExpenseLog["type"]) ?? "Other" })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Fuel">Fuel</SelectItem><SelectItem value="Toll">Toll</SelectItem><SelectItem value="Other">Other</SelectItem></SelectContent></Select></div><div className="space-y-2"><Label>Amount</Label><Input type="number" min="1" value={expenseState.amount} onChange={(event) => setExpenseState({ ...expenseState, amount: Number(event.target.value) })} /></div><div className="space-y-2"><Label>Date</Label><Input type="date" value={expenseState.date} onChange={(event) => setExpenseState({ ...expenseState, date: event.target.value })} /></div><div className="space-y-2"><Label>Details</Label><Input value={expenseState.details} onChange={(event) => setExpenseState({ ...expenseState, details: event.target.value })} /></div><DialogFooter><Button onClick={() => { addFuelExpense({ vehicleId: expenseState.vehicleId, tripId: expenseState.tripId || undefined, type: expenseState.type, amount: expenseState.amount, date: expenseState.date, details: expenseState.details }); setExpenseState({ vehicleId: "", tripId: "", type: "Other", amount: 5000, date: new Date().toISOString().slice(0, 10), details: "" }); }}>Save expense</Button></DialogFooter></div></DialogContent></Dialog></div>
          <div className="mt-4 space-y-3">{fuelExpenseLogs.filter((entry) => entry.type !== "Fuel").map((entry) => <div key={entry.id} className="rounded-xl border border-slate-200 p-3 text-sm text-slate-600"><div className="flex items-center justify-between"><span className="font-medium text-slate-800">{vehicles.find((vehicle) => vehicle.id === entry.vehicleId)?.registrationNumber ?? "Vehicle"}</span><span>{entry.type}</span></div><p className="mt-1">KSh {entry.amount.toLocaleString()}</p><p className="mt-1 text-xs">{entry.date}</p></div>)}</div>
        </div>
      </div>
    </div>
  );
}
