"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/lib/auth-context";
import type { UserRole } from "@/types";

const roleOptions: Array<{ value: UserRole; label: string }> = [
  { value: "Admin", label: "Admin" },
  { value: "FleetManager", label: "Fleet Manager" },
  { value: "Dispatcher", label: "Dispatcher" },
  { value: "SafetyOfficer", label: "Safety Officer" },
  { value: "FinancialAnalyst", label: "Financial Analyst" },
];

export default function LoginPage() {
  const router = useRouter();
  const { signIn } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [email, setEmail] = useState("demo@transitops.io");
  const [password, setPassword] = useState("password123");
  const [role, setRole] = useState<UserRole>("Dispatcher");
  const [rememberMe, setRememberMe] = useState(true);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      await signIn(email, password, role, rememberMe);
      router.push("/dashboard");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to sign in.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-[radial-gradient(circle_at_top,_#0f172a,_#111827_60%,_#020617)] p-4">
      <Card className="w-full max-w-lg border-slate-200/80 bg-white/95 shadow-[0_25px_80px_-25px_rgba(2,8,23,0.7)]">
        <div className="h-1 w-full bg-gradient-to-r from-blue-600 via-cyan-500 to-indigo-500" />
        <CardHeader className="space-y-3 border-b border-slate-100 p-6">
          <div className="inline-flex w-fit rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700">TransitOps demo</div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Smart Transport Operations Platform</h1>
            <p className="mt-1 text-sm text-slate-500">Sign in as a demo role to explore the dispatch, fleet, and finance experience.</p>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Demo role</Label>
              <Select value={role} onValueChange={(value) => setRole((value ?? "Dispatcher") as UserRole)}>
                <SelectTrigger id="role">
                  <SelectValue placeholder="Choose a role" />
                </SelectTrigger>
                <SelectContent>
                  {roleOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <input type="checkbox" checked={rememberMe} onChange={() => setRememberMe((current) => !current)} />
              Keep me signed in for this demo
            </label>
            {error ? <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
            <Button className="w-full" type="submit" disabled={loading}>{loading ? "Signing in..." : "Sign in"}</Button>
          </form>
          <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
            <p className="font-medium text-slate-800">Demo credentials</p>
            <p className="mt-2">Use any email/password and choose a role. The app stores a demo session locally.</p>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}