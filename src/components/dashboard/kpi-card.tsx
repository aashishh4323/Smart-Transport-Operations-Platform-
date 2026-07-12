import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "../../components/ui/card";

interface KpiCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
}

export function KpiCard({
  title,
  value,
  icon: Icon,
  description,
}: KpiCardProps) {
  return (
    <Card className="border-[rgba(20,22,26,0.08)] bg-[rgba(255,255,255,0.74)] shadow-[0_12px_36px_rgba(15,18,25,0.05)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_14px_40px_rgba(15,18,25,0.08)]">
      <CardContent className="flex items-start justify-between p-5">
        <div>
          <p className="text-[13px] font-medium text-slate-500">{title}</p>
          <p className="mt-2 text-[28px] font-semibold tracking-[-0.02em] text-slate-900">{value}</p>

          {description && (
            <p className="mt-1 text-[12px] text-slate-500">
              {description}
            </p>
          )}
        </div>

        <div className="rounded-2xl border border-[rgba(20,22,26,0.08)] bg-white/70 p-3 text-slate-700 shadow-sm">
          <Icon size={20} />
        </div>
      </CardContent>
    </Card>
  );
}