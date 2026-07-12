import { Badge } from "../../components/ui/badge";
import { cn } from "../../lib/utils";

const statusStyles: Record<string, string> = {
  Available: "bg-[rgba(48,164,108,0.12)] text-[#2f8b5a]",
  OnTrip: "bg-[rgba(52,120,246,0.12)] text-[#2967c8]",
  InShop: "bg-[rgba(217,154,34,0.14)] text-[#a67316]",
  Retired: "bg-[rgba(104,107,112,0.12)] text-[#5f6368]",
  Suspended: "bg-[rgba(217,74,74,0.12)] text-[#ba3b3b]",
  OffDuty: "bg-[rgba(104,107,112,0.10)] text-[#5f6368]",
  Draft: "bg-[rgba(104,107,112,0.10)] text-[#5f6368]",
  Dispatched: "bg-[rgba(52,120,246,0.12)] text-[#2967c8]",
  Completed: "bg-[rgba(48,164,108,0.12)] text-[#2f8b5a]",
  Cancelled: "bg-[rgba(217,74,74,0.12)] text-[#ba3b3b]",
  Open: "bg-[rgba(217,154,34,0.14)] text-[#a67316]",
  Closed: "bg-[rgba(48,164,108,0.12)] text-[#2f8b5a]",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <Badge className={cn("rounded-full border-0 px-2.5 py-1 text-[11px] font-medium", statusStyles[status])}>
      {status.replace(/([A-Z])/g, " $1").trim()}
    </Badge>
  );
}