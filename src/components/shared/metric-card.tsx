import { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: ReactNode;
}

export function MetricCard({ title, value, subtitle, icon }: MetricCardProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-500">{title}</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">{value}</p>
          </div>
          {icon ? <div className="rounded-lg bg-slate-100 p-2 text-slate-600">{icon}</div> : null}
        </div>
        {subtitle ? <p className="mt-2 text-sm text-slate-500">{subtitle}</p> : null}
      </CardContent>
    </Card>
  );
}
