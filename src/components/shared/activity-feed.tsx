import { Activity } from "lucide-react";
import type { ActivityLog } from "@/types";

interface ActivityFeedProps {
  activities: ActivityLog[];
}

export function ActivityFeed({ activities }: ActivityFeedProps) {
  return (
    <div className="space-y-3 rounded-[24px] border border-[rgba(20,22,26,0.08)] bg-[rgba(255,255,255,0.78)] p-4 shadow-[0_14px_40px_rgba(15,18,25,0.05)] backdrop-blur-[16px]">
      <div className="flex items-center justify-between">
        <h3 className="text-[15px] font-semibold text-slate-900">Recent activity</h3>
        <span className="text-[12px] text-slate-500">Live feed</span>
      </div>
      <div className="space-y-3">
        {activities.map((activity) => (
          <div key={activity.id} className="flex gap-3 rounded-2xl border border-[rgba(20,22,26,0.06)] bg-white/70 p-3 transition-all duration-200 hover:-translate-y-0.5 hover:bg-white">
            <div className="mt-0.5 rounded-full border border-[rgba(20,22,26,0.08)] bg-slate-50 p-2 text-slate-700">
              <Activity size={15} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-medium text-slate-800">{activity.title}</p>
              <p className="text-[13px] text-slate-500">{activity.detail}</p>
              <p className="mt-1 text-[11px] text-slate-400">{activity.time}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
