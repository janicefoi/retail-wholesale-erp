"use server";

import { startOfDay, endOfDay } from "date-fns";
import { db } from "@/lib/db";

// ── Types ─────────────────────────────────────────────────────────────────

export type DashboardMetrics = {
  todayRevenue: number;
  todaySalesCount: number;
  lowStockCount: number;
  totalOutstandingCredit: number;
};

export type RecentSale = {
  id: string;
  receiptNumber: string;
  createdAt: string;
  paymentStatus: string;
  saleType: string;
  totalAmount: string;
  isVoid: boolean;
  customer: { name: string } | null;
  employee: { name: string };
};

export type LowStockAlert = {
  id: string;
  sku: string;
  name: string;
  stockQty: number;
  lowStockThreshold: number;
};

// ── Actions ───────────────────────────────────────────────────────────────

export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  const now = new Date();
  const start = startOfDay(now);
  const end = endOfDay(now);

  const [todaySales, creditAgg, activeItems] = await Promise.all([
    db.sale.findMany({
      where: { createdAt: { gte: start, lte: end }, isVoid: false },
      select: { totalAmount: true },
    }),
    db.customer.aggregate({
      _sum: { creditBalance: true },
      where: { creditBalance: { gt: 0 } },
    }),
    db.item.findMany({
      where: { isActive: true },
      select: { stockQty: true, lowStockThreshold: true },
    }),
  ]);

  return {
    todayRevenue: todaySales.reduce((s, sale) => s + Number(sale.totalAmount), 0),
    todaySalesCount: todaySales.length,
    lowStockCount: activeItems.filter((i) => i.stockQty <= i.lowStockThreshold).length,
    totalOutstandingCredit: Number(creditAgg._sum.creditBalance ?? 0),
  };
}

export async function getRecentSales(): Promise<RecentSale[]> {
  const sales = await db.sale.findMany({
    take: 10,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      receiptNumber: true,
      createdAt: true,
      paymentStatus: true,
      saleType: true,
      totalAmount: true,
      isVoid: true,
      customer: { select: { name: true } },
      employee: { select: { name: true } },
    },
  });
  return JSON.parse(JSON.stringify(sales));
}

export async function getLowStockAlerts(): Promise<LowStockAlert[]> {
  const items = await db.item.findMany({
    where: { isActive: true },
    select: { id: true, sku: true, name: true, stockQty: true, lowStockThreshold: true },
    orderBy: { stockQty: "asc" },
  });
  return items.filter((i) => i.stockQty <= i.lowStockThreshold).slice(0, 10);
}
