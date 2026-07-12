"use client";

import { useState } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function SettingsPage() {
  const [general, setGeneral] = useState({ depotName: "Mumbai Central Depot", currency: "INR", distanceUnit: "km", region: "India" });
  const [permissions, setPermissions] = useState({ dashboard: "View", fleet: "Manage", drivers: "Edit", trips: "Manage", maintenance: "Edit", expenses: "View", analytics: "View", settings: "Manage" });

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" description="Tune the demo deployment and role access." />
      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-800">General settings</h2>
          <div className="mt-4 space-y-4">
            <div className="space-y-2"><Label>Depot name</Label><Input value={general.depotName} onChange={(event) => setGeneral({ ...general, depotName: event.target.value })} /></div>
            <div className="grid gap-4 md:grid-cols-2"><div className="space-y-2"><Label>Currency</Label><Input value={general.currency} onChange={(event) => setGeneral({ ...general, currency: event.target.value })} /></div><div className="space-y-2"><Label>Distance unit</Label><Input value={general.distanceUnit} onChange={(event) => setGeneral({ ...general, distanceUnit: event.target.value })} /></div></div>
            <div className="space-y-2"><Label>Region</Label><Input value={general.region} onChange={(event) => setGeneral({ ...general, region: event.target.value })} /></div>
            <Button>Save settings</Button>
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-800">Roles and permissions</h2>
          <div className="mt-4 space-y-3">
            {Object.entries(permissions).map(([key, value]) => <div key={key} className="flex items-center justify-between rounded-xl border border-slate-200 p-3"><span className="capitalize text-slate-700">{key}</span><Select value={value} onValueChange={(nextValue) => setPermissions({ ...permissions, [key]: nextValue })}><SelectTrigger className="w-32"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="No Access">No Access</SelectItem><SelectItem value="View">View</SelectItem><SelectItem value="Create">Create</SelectItem><SelectItem value="Edit">Edit</SelectItem><SelectItem value="Delete">Delete</SelectItem><SelectItem value="Manage">Manage</SelectItem></SelectContent></Select></div>)}
            <Button variant="outline">Confirm changes</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
