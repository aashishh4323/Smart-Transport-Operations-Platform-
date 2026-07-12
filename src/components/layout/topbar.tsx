import { Bell, Search } from "lucide-react";
import { Input } from "../../components/ui/input";

export function Topbar() {
  return (
    <header className="sticky top-0 z-20 border-b border-[rgba(20,22,26,0.08)] bg-[rgba(255,255,255,0.68)] px-4 py-3 backdrop-blur-[20px] sm:px-6">
      <div className="flex items-center justify-between rounded-[18px] border border-[rgba(20,22,26,0.08)] bg-[rgba(255,255,255,0.8)] px-3 py-2.5 shadow-[0_10px_28px_rgba(15,18,25,0.05)]">
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-slate-100 px-3 py-1 text-[12px] font-medium text-slate-600">Operations</div>
          <div className="hidden text-sm text-slate-500 sm:block">TransitOps control centre</div>
        </div>

        <div className="relative hidden w-[320px] md:block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" size={17} />
          <Input placeholder="Search vehicles, drivers, trips..." className="h-9 rounded-xl border-[rgba(20,22,26,0.10)] bg-white/80 pl-9 shadow-none" />
        </div>

        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          <button className="rounded-xl p-2 text-slate-600 transition hover:bg-slate-100 hover:text-slate-900">
            <Bell size={18} />
          </button>
          <div className="hidden text-right sm:block">
            <p className="text-[13px] font-semibold text-slate-900">Raven K.</p>
            <p className="text-[11px] text-slate-500">Dispatcher</p>
          </div>
          <div className="grid size-9 place-items-center rounded-full bg-[linear-gradient(135deg,#1d1d1f,#404047)] text-[13px] font-semibold text-white">
            RK
          </div>
        </div>
      </div>
    </header>
  );
}