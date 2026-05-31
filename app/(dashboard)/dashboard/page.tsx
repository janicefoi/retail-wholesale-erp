import { TrendingUp, ShoppingCart, AlertTriangle, CreditCard } from "lucide-react";
import { auth } from "@/auth";
import {
  getDashboardMetrics,
  getRecentSales,
  getLowStockAlerts,
} from "@/lib/actions/dashboard";
import { MetricCard } from "@/components/dashboard/metric-card";
import { RecentSalesTable } from "@/components/dashboard/recent-sales-table";
import { LowStockList } from "@/components/dashboard/low-stock-list";

export const metadata = { title: "Dashboard — JSH ERP" };

function fmtKES(v: number) {
  return `KES ${v.toLocaleString("en-KE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default async function DashboardPage() {
  const [session, metrics, recentSales, lowStockAlerts] = await Promise.all([
    auth(),
    getDashboardMetrics(),
    getRecentSales(),
    getLowStockAlerts(),
  ]);

  return (
    <div className="space-y-6">
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Welcome back,{" "}
          <span className="font-medium text-slate-700">{session?.user?.name}</span>
        </p>
      </div>

      {/* ── Metric cards ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Today's revenue"
          value={fmtKES(metrics.todayRevenue)}
          icon={TrendingUp}
          color="blue"
          subtitle={`${metrics.todaySalesCount} sale${metrics.todaySalesCount !== 1 ? "s" : ""} today`}
        />
        <MetricCard
          title="Sales today"
          value={String(metrics.todaySalesCount)}
          icon={ShoppingCart}
          color="green"
        />
        <MetricCard
          title="Low stock items"
          value={String(metrics.lowStockCount)}
          icon={AlertTriangle}
          color={metrics.lowStockCount > 0 ? "amber" : "green"}
          subtitle={metrics.lowStockCount === 0 ? "All stocked up" : "Need restocking"}
        />
        <MetricCard
          title="Outstanding credit"
          value={fmtKES(metrics.totalOutstandingCredit)}
          icon={CreditCard}
          color={metrics.totalOutstandingCredit > 0 ? "red" : "green"}
          subtitle={metrics.totalOutstandingCredit === 0 ? "No outstanding credit" : undefined}
        />
      </div>

      {/* ── Recent sales + Low stock ───────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RecentSalesTable sales={recentSales} />
        </div>
        <div>
          <LowStockList items={lowStockAlerts} />
        </div>
      </div>
    </div>
  );
}
