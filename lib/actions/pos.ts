"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { CompleteSaleSchema, type CompleteSaleInput } from "@/lib/validations/pos";

// ── Receipt number: RCP-YYYYMMDD-XXXX ────────────────────────────────────

async function generateReceiptNumber(): Promise<string> {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, "");
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfDay = new Date(startOfDay.getTime() + 86_400_000);

  const count = await db.sale.count({
    where: { createdAt: { gte: startOfDay, lt: endOfDay } },
  });

  return `RCP-${dateStr}-${String(count + 1).padStart(4, "0")}`;
}

// ── Item search ───────────────────────────────────────────────────────────

export type SearchedItem = {
  id: string;
  name: string;
  sku: string;
  category: string;
  stockQty: number;
  retailPrice: string;
  wholesalePrice: string;
  specialPrice: string | null;
};

export async function searchItems(query: string): Promise<SearchedItem[]> {
  const q = query.trim();
  if (!q) return [];

  const rows = await db.item.findMany({
    where: {
      isActive: true,
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { sku: { contains: q, mode: "insensitive" } },
      ],
    },
    select: {
      id: true,
      name: true,
      sku: true,
      category: true,
      stockQty: true,
      retailPrice: true,
      wholesalePrice: true,
      specialPrice: true,
    },
    take: 15,
    orderBy: { name: "asc" },
  });

  return JSON.parse(JSON.stringify(rows));
}

// ── Customer search ───────────────────────────────────────────────────────

export type SearchedCustomer = {
  id: string;
  name: string;
  phone: string;
  creditBalance: string;
};

export async function searchCustomers(query: string): Promise<SearchedCustomer[]> {
  const q = query.trim();
  if (!q) return [];

  const rows = await db.customer.findMany({
    where: {
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { phone: { contains: q } },
      ],
    },
    select: { id: true, name: true, phone: true, creditBalance: true },
    take: 8,
    orderBy: { name: "asc" },
  });

  return JSON.parse(JSON.stringify(rows));
}

// ── Complete sale ─────────────────────────────────────────────────────────

export type SaleResult = {
  id: string;
  receiptNumber: string;
  saleType: string;
  paymentStatus: string;
  discountAmount: string;
  totalAmount: string;
  createdAt: string;
  customer: { name: string; phone: string } | null;
  employee: { name: string };
  items: Array<{
    quantity: number;
    unitPrice: string;
    subtotal: string;
    item: { name: string; sku: string };
  }>;
};

export async function completeSale(
  data: CompleteSaleInput
): Promise<{ success: true; sale: SaleResult } | { success: false; error: string }> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Unauthorized" };

  const parsed = CompleteSaleSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message };
  }

  if (parsed.data.paymentStatus === "CREDIT" && !parsed.data.customerId) {
    return { success: false, error: "Credit payment requires a customer to be selected." };
  }

  // Sanity-check totals
  const itemsTotal = parsed.data.items.reduce((sum, i) => sum + i.subtotal, 0);
  const expectedTotal = +(itemsTotal - parsed.data.discountAmount).toFixed(2);
  if (Math.abs(expectedTotal - parsed.data.totalAmount) > 0.02) {
    return { success: false, error: "Total amount mismatch — please try again." };
  }

  const receiptNumber = await generateReceiptNumber();

  try {
    const sale = await db.$transaction(async (tx) => {
      // 1. Verify stock availability
      for (const line of parsed.data.items) {
        const item = await tx.item.findUnique({
          where: { id: line.itemId },
          select: { stockQty: true, name: true, isActive: true },
        });
        if (!item || !item.isActive) throw new Error(`Item not found or has been deactivated.`);
        if (item.stockQty < line.quantity) {
          throw new Error(
            `Insufficient stock for "${item.name}". Available: ${item.stockQty}, requested: ${line.quantity}.`
          );
        }
      }

      // 2. Create Sale + SaleItems
      const created = await tx.sale.create({
        data: {
          receiptNumber,
          saleType: parsed.data.saleType,
          paymentStatus: parsed.data.paymentStatus,
          discountAmount: parsed.data.discountAmount,
          totalAmount: parsed.data.totalAmount,
          isVoid: false,
          customerId: parsed.data.customerId,
          employeeId: session.user.id,
          items: {
            create: parsed.data.items.map((i) => ({
              itemId: i.itemId,
              quantity: i.quantity,
              unitPrice: i.unitPrice,
              subtotal: i.subtotal,
            })),
          },
        },
        include: {
          items: { include: { item: { select: { name: true, sku: true } } } },
          customer: { select: { name: true, phone: true } },
          employee: { select: { name: true } },
        },
      });

      // 3. Decrement stock
      for (const line of parsed.data.items) {
        await tx.item.update({
          where: { id: line.itemId },
          data: { stockQty: { decrement: line.quantity } },
        });
      }

      // 4. Add to customer credit balance
      if (parsed.data.paymentStatus === "CREDIT" && parsed.data.customerId) {
        await tx.customer.update({
          where: { id: parsed.data.customerId },
          data: { creditBalance: { increment: parsed.data.totalAmount } },
        });
      }

      return created;
    });

    revalidatePath("/inventory");

    return { success: true, sale: JSON.parse(JSON.stringify(sale)) };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to complete sale. Please try again.";
    return { success: false, error: msg };
  }
}
