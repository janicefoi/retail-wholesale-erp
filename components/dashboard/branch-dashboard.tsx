"use client";

import { useState } from "react";
import { TrendingUp, ShoppingCart, AlertTriangle, CreditCard } from "lucide-react";
import { MetricCard } from "@/components/dashboard/metric-card";
import { RecentSalesTable } from "@/components/dashboard/recent-sales-table";
import { LowStockList } from "@/components/dashboard/low-stock-list";
import type { DashboardMetrics, RecentSale, LowStockAlert } from "@/lib/actions/dashboard";

interface BranchMetric {
  branch: { id: string; name: string };
  metrics: DashboardMetrics;
  lowStock: LowStockAlert[];
}

function fmtKES(v: number) {
  return `KES ${v.toLocaleString("en-KE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

interface Props {
  userName: string;
  branches: { id: string; name: string }[];
  combinedMetrics: DashboardMetrics;
  combinedSales: RecentSale[];
  combinedLowStock: LowStockAlert[];
  branchMetrics: BranchMetric[];
}

export function BranchDashboard({
  userName,
  branches,
  combinedMetrics,
  combinedSales,
  combinedLowStock,
  branchMetrics,
}: Props) {
  const tabs = ["Combined", ...branches.map((b) => b.name)];
  const [activeTab, setActiveTab] = useState("Combined");

  const isCombined = activeTab === "Combined";
  const branchData = branchMetrics.find((bm) => bm.branch.name === activeTab);
  const metrics = isCombined ? combinedMetrics : branchData?.metrics ?? combinedMetrics;
  const lowStock = isCombined ? combinedLowStock : branchData?.lowStock ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Welcome back, <span className="font-medium text-slate-700">{userName}</span>
          </p>
        </div>

        {/* Branch tabs */}
        <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                activeTab === tab
                  ? "bg-white shadow-sm text-slate-900"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Today's revenue"
          value={fmtKES(metrics.todayRevenue)}
          icon={TrendingUp}
          color="blue"
          subtitle={`${metrics.todaySalesCount} sale${metrics.todaySalesCount !== 1 ? "s" : ""} today`}
        />
        <MetricCard title="Sales today" value={String(metrics.todaySalesCount)} icon={ShoppingCart} color="green" />
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

      {/* Recent sales + Low stock */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {isCombined && (
          <div className="lg:col-span-2">
            <RecentSalesTable sales={combinedSales} />
          </div>
        )}
        <div className={isCombined ? "" : "lg:col-span-3"}>
          <LowStockList items={lowStock} />
        </div>
      </div>
    </div>
  );
}
