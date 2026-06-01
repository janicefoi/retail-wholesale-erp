import { Package, AlertTriangle, XCircle, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import type { InventoryStats } from "@/lib/actions/inventory";

function fmtKES(v: number) {
  if (v >= 1_000_000) return `KES ${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `KES ${(v / 1_000).toFixed(0)}K`;
  return `KES ${v.toLocaleString("en-KE", { minimumFractionDigits: 0 })}`;
}

export function InventoryStats({ stats }: { stats: InventoryStats }) {
  const cards = [
    {
      label: "Active items",
      value: String(stats.totalActive),
      icon: Package,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "Out of stock",
      value: String(stats.outOfStock),
      icon: XCircle,
      color: stats.outOfStock > 0 ? "text-red-600" : "text-green-600",
      bg: stats.outOfStock > 0 ? "bg-red-50" : "bg-green-50",
    },
    {
      label: "Low stock",
      value: String(stats.lowStockItems),
      icon: AlertTriangle,
      color: stats.lowStockItems > 0 ? "text-amber-600" : "text-green-600",
      bg: stats.lowStockItems > 0 ? "bg-amber-50" : "bg-green-50",
    },
    {
      label: "Stock value (wholesale)",
      value: fmtKES(stats.totalStockValue),
      icon: TrendingUp,
      color: "text-slate-700",
      bg: "bg-slate-50",
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {cards.map(({ label, value, icon: Icon, color, bg }) => (
        <div key={label} className="rounded-xl border border-slate-200 bg-white px-4 py-3 flex items-center gap-3">
          <div className={cn("rounded-lg p-2 shrink-0", bg)}>
            <Icon className={cn("h-4 w-4", color)} />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide truncate">{label}</p>
            <p className={cn("text-lg font-bold tabular-nums leading-tight", color)}>{value}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
