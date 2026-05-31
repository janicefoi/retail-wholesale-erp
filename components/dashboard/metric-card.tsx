import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  color: "blue" | "green" | "amber" | "red";
  subtitle?: string;
}

const colorMap = {
  blue:  { iconBg: "bg-blue-100",  iconText: "text-blue-600"  },
  green: { iconBg: "bg-green-100", iconText: "text-green-600" },
  amber: { iconBg: "bg-amber-100", iconText: "text-amber-600" },
  red:   { iconBg: "bg-red-100",   iconText: "text-red-600"   },
};

export function MetricCard({ title, value, icon: Icon, color, subtitle }: MetricCardProps) {
  const c = colorMap[color];
  return (
    <div className="rounded-xl bg-white border border-slate-200 p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
            {title}
          </p>
          <p className="text-2xl font-bold text-slate-900 mt-1 tabular-nums leading-tight">
            {value}
          </p>
          {subtitle && (
            <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>
          )}
        </div>
        <div className={cn("rounded-xl p-2.5 shrink-0", c.iconBg)}>
          <Icon className={cn("h-5 w-5", c.iconText)} />
        </div>
      </div>
    </div>
  );
}
