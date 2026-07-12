import { ReactNode } from "react";
import { Button } from "@/components/ui/button";

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: ReactNode;
}

export function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <div className="relative overflow-hidden rounded-[24px] border border-[rgba(20,22,26,0.08)] bg-[rgba(255,255,255,0.78)] p-6 shadow-[0_14px_40px_rgba(15,18,25,0.05)] backdrop-blur-[16px] sm:flex sm:items-end sm:justify-between">
      <div className="absolute inset-x-0 top-0 h-[2px] bg-[linear-gradient(90deg,rgba(29,29,31,0.95),rgba(52,120,246,0.75))]" />
      <div className="max-w-2xl">
        <h1 className="text-[26px] font-semibold tracking-[-0.02em] text-slate-900">{title}</h1>
        {description ? <p className="mt-2 text-[14px] text-slate-500">{description}</p> : null}
      </div>
      {action ? <div className="mt-4 sm:mt-0">{action}</div> : null}
    </div>
  );
}
