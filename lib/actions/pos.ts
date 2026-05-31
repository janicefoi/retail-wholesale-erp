"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { CompleteSaleSchema, type CompleteSaleInput } from "@/lib/validations/pos";
import { VAT_EXTRACT } from "@/lib/constants/tax";

// ── Receipt number: RCP-YYYYMMDD-XXXX ────────────────────────────────────

async function generateReceiptNumber(): Promise<string> {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, "");
  const prefix = `RCP-${dateStr}-`;

  // Use the highest existing sequence for today rather than a count — safe
  // against gaps caused by voided sales, test data, or manual DB edits.
  const last = await db.sale.findFirst({
    where: { receiptNumber: { startsWith: prefix } },
    orderBy: { receiptNumber: "desc" },
    select: { receiptNumber: true },
  });

  const next = last ? parseInt(last.receiptNumber.slice(prefix.length)) + 1 : 1;
  return `${prefix}${String(next).padStart(4, "0")}`;
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

// ── Sale result type ──────────────────────────────────────────────────────

export type SaleResult = {
  id: string;
  receiptNumber: string;
  saleType: string;
  paymentStatus: string;
  discountAmount: string;
  taxAmount: string;
  totalAmount: string;
  createdAt: string;
  customer: { name: string; phone: string; creditBalance: string } | null;
  employee: { name: string };
  items: Array<{
    quantity: number;
    unitPrice: string;
    subtotal: string;
    item: { name: string; sku: string };
  }>;
};

// ── Complete sale ─────────────────────────────────────────────────────────

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

  // Sanity-check: totalAmount must equal itemsTotal − discount (VAT is inclusive in prices)
  const itemsTotal = parsed.data.items.reduce((sum, i) => sum + i.subtotal, 0);
  const expectedTotal = +(itemsTotal - parsed.data.discountAmount).toFixed(2);
  if (Math.abs(expectedTotal - parsed.data.totalAmount) > 0.02) {
    return { success: false, error: "Total amount mismatch — please try again." };
  }

  // Compute taxAmount server-side: extract the VAT already contained in the total
  const computedTax = Math.round(parsed.data.totalAmount * VAT_EXTRACT * 100) / 100;

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
          taxAmount: computedTax,
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
          customer: { select: { name: true, phone: true, creditBalance: true } },
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

      // 4. Add to customer credit balance and return updated balance
      if (parsed.data.paymentStatus === "CREDIT" && parsed.data.customerId) {
        await tx.customer.update({
          where: { id: parsed.data.customerId },
          data: { creditBalance: { increment: parsed.data.totalAmount } },
        });
        const freshCustomer = await tx.customer.findUnique({
          where: { id: parsed.data.customerId },
          select: { name: true, phone: true, creditBalance: true },
        });
        return { ...created, customer: freshCustomer };
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

// ── Fetch sale by ID (for receipt modal) ─────────────────────────────────

export async function getSaleById(id: string): Promise<SaleResult | null> {
  const session = await auth();
  if (!session?.user?.id) return null;

  const sale = await db.sale.findUnique({
    where: { id },
    include: {
      items: { include: { item: { select: { name: true, sku: true } } } },
      customer: { select: { name: true, phone: true, creditBalance: true } },
      employee: { select: { name: true } },
    },
  });

  if (!sale) return null;
  return JSON.parse(JSON.stringify(sale));
}
