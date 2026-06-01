"use server";

import { startOfDay, endOfDay } from "date-fns";
import { db } from "@/lib/db";

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

export async function getDashboardMetrics(branchId?: string | null): Promise<DashboardMetrics> {
  const now = new Date();
  const start = startOfDay(now);
  const end = endOfDay(now);

  const branchFilter = branchId ? { branchId } : {};

  const [todaySales, creditAgg, branchStocks] = await Promise.all([
    db.sale.findMany({
      where: { createdAt: { gte: start, lte: end }, isVoid: false, ...branchFilter },
      select: { totalAmount: true },
    }),
    db.customer.aggregate({
      _sum: { creditBalance: true },
      where: { creditBalance: { gt: 0 }, ...branchFilter },
    }),
    db.branchStock.findMany({
      where: branchId ? { branchId, item: { isActive: true } } : { item: { isActive: true } },
      select: { stockQty: true, lowStockThreshold: true },
    }),
  ]);

  return {
    todayRevenue: todaySales.reduce((s, sale) => s + Number(sale.totalAmount), 0),
    todaySalesCount: todaySales.length,
    lowStockCount: branchStocks.filter((bs) => bs.stockQty <= bs.lowStockThreshold).length,
    totalOutstandingCredit: Number(creditAgg._sum.creditBalance ?? 0),
  };
}

export async function getRecentSales(branchId?: string | null): Promise<RecentSale[]> {
  const branchFilter = branchId ? { branchId } : {};
  const sales = await db.sale.findMany({
    take: 10,
    orderBy: { createdAt: "desc" },
    where: branchFilter,
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

export async function getLowStockAlerts(branchId?: string | null): Promise<LowStockAlert[]> {
  const stocks = await db.branchStock.findMany({
    where: branchId ? { branchId, item: { isActive: true } } : { item: { isActive: true } },
    select: {
      stockQty: true,
      lowStockThreshold: true,
      item: { select: { id: true, sku: true, name: true } },
    },
    orderBy: { stockQty: "asc" },
  });

  return stocks
    .filter((bs) => bs.stockQty <= bs.lowStockThreshold)
    .slice(0, 10)
    .map((bs) => ({
      id: bs.item.id,
      sku: bs.item.sku,
      name: bs.item.name,
      stockQty: bs.stockQty,
      lowStockThreshold: bs.lowStockThreshold,
    }));
}

export async function getBranches() {
  return db.branch.findMany({
    where: { isActive: true },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
}
