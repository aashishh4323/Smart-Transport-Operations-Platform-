"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navigationItems } from "../../constants/navigation";
import { cn } from "../../lib/utils";

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden min-h-screen w-[240px] flex-col border-r border-[rgba(20,22,26,0.08)] bg-[rgba(20,21,24,0.94)] text-white lg:flex">
      <div className="relative overflow-hidden border-b border-white/10 p-6">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(52,120,246,0.18),_transparent_55%)]" />
        <div className="relative">
          <div className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-sm font-semibold shadow-[0_8px_24px_rgba(0,0,0,0.16)] backdrop-blur-sm">
            TO
          </div>
          <h1 className="text-[17px] font-semibold tracking-tight text-white">TransitOps</h1>
          <p className="mt-1 text-[12px] text-white/60">Transport operations</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const active = pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-2xl px-3 py-2.5 text-[14px] transition-all duration-200",
                active
                  ? "bg-white/10 text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]"
                  : "text-white/72 hover:bg-white/8 hover:text-white",
              )}
            >
              <Icon size={17} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/10 p-4">
        <div className="rounded-2xl bg-white/8 p-3">
          <p className="text-[13px] font-medium text-white">Signed in as Raven</p>
          <p className="mt-1 text-[12px] text-white/55">Dispatcher</p>
        </div>
        <button className="mt-3 flex w-full items-center justify-center rounded-2xl border border-white/10 px-3 py-2 text-[13px] text-white/80 transition hover:bg-white/8">
          Sign out
        </button>
      </div>
    </aside>
  );
}