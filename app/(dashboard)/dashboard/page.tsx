import { ShoppingCart, AlertTriangle } from "lucide-react";
import { auth } from "@/auth";
import {
  getDashboardMetrics,
  getRecentSales,
  getLowStockAlerts,
  getBranches,
} from "@/lib/actions/dashboard";
import { MetricCard } from "@/components/dashboard/metric-card";
import { LowStockList } from "@/components/dashboard/low-stock-list";
import { BranchDashboard } from "@/components/dashboard/branch-dashboard";

export const metadata = { title: "Dashboard — JSH ERP" };

export default async function DashboardPage() {
  const session = await auth();
  const role = session?.user?.role;
  const isAdmin = role === "ADMIN";
  const branchId = session?.user?.branchId ?? null;

  if (isAdmin) {
    // Admin sees branch tabs + combined: fetch all at once
    const branches = await getBranches();
    const [combinedMetrics, combinedSales, combinedLowStock, ...perBranchData] = await Promise.all([
      getDashboardMetrics(null),
      getRecentSales(null),
      getLowStockAlerts(null),
      ...branches.flatMap((b) => [
        getDashboardMetrics(b.id),
        getLowStockAlerts(b.id),
      ]),
    ]);

    const branchMetrics = branches.map((b, i) => ({
      branch: b,
      metrics: perBranchData[i * 2] as Awaited<ReturnType<typeof getDashboardMetrics>>,
      lowStock: perBranchData[i * 2 + 1] as Awaited<ReturnType<typeof getLowStockAlerts>>,
    }));

    return (
      <BranchDashboard
        userName={session?.user?.name ?? ""}
        branches={branches}
        combinedMetrics={combinedMetrics}
        combinedSales={combinedSales}
        combinedLowStock={combinedLowStock}
        branchMetrics={branchMetrics}
      />
    );
  }

  // Non-admin: scoped to their branch
  const [metrics, recentSales, lowStockAlerts] = await Promise.all([
    getDashboardMetrics(branchId),
    Promise.resolve([]),
    getLowStockAlerts(branchId),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Welcome back, <span className="font-medium text-slate-700">{session?.user?.name}</span>
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <MetricCard title="Sales today" value={String(metrics.todaySalesCount)} icon={ShoppingCart} color="green" />
        <MetricCard
          title="Low stock items"
          value={String(metrics.lowStockCount)}
          icon={AlertTriangle}
          color={metrics.lowStockCount > 0 ? "amber" : "green"}
          subtitle={metrics.lowStockCount === 0 ? "All stocked up" : "Need restocking"}
        />
      </div>

      <LowStockList items={lowStockAlerts} />
    </div>
  );
}
