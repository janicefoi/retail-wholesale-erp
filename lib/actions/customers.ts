"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { CustomerSchema, type CustomerInput } from "@/lib/validations/customers";

// ── Types ─────────────────────────────────────────────────────────────────

export type CustomerRow = {
  id: string;
  name: string;
  phone: string;
  address: string | null;
  creditBalance: string;
  createdAt: string;
  _count: { sales: number };
};

export type CustomerDetail = {
  id: string;
  name: string;
  phone: string;
  address: string | null;
  creditBalance: string;
  createdAt: string;
  updatedAt: string;
  sales: Array<{
    id: string;
    receiptNumber: string;
    saleType: string;
    paymentStatus: string;
    totalAmount: string;
    taxAmount: string;
    discountAmount: string;
    createdAt: string;
  }>;
  creditPayments: Array<{
    id: string;
    amount: string;
    notes: string | null;
    createdAt: string;
    recordedBy: { name: string };
  }>;
};

// ── Get customers list ────────────────────────────────────────────────────

export async function getCustomers(
  filter: "ALL" | "HAS_CREDIT" | "NO_CREDIT" = "ALL"
): Promise<CustomerRow[]> {
  const where =
    filter === "HAS_CREDIT"
      ? { creditBalance: { gt: 0 } }
      : filter === "NO_CREDIT"
      ? { creditBalance: { lte: 0 } }
      : {};

  const rows = await db.customer.findMany({
    where,
    select: {
      id: true,
      name: true,
      phone: true,
      address: true,
      creditBalance: true,
      createdAt: true,
      _count: { select: { sales: true } },
    },
    orderBy: { name: "asc" },
  });

  return JSON.parse(JSON.stringify(rows));
}

// ── Create customer ───────────────────────────────────────────────────────

export async function createCustomer(
  data: CustomerInput
): Promise<{ success: true } | { success: false; error: string }> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Unauthorized" };

  const parsed = CustomerSchema.safeParse(data);
  if (!parsed.success) return { success: false, error: parsed.error.errors[0].message };

  const existing = await db.customer.findFirst({
    where: { phone: parsed.data.phone },
  });
  if (existing) {
    return { success: false, error: "A customer with this phone number already exists." };
  }

  await db.customer.create({
    data: {
      name: parsed.data.name,
      phone: parsed.data.phone,
      address: parsed.data.address ?? null,
    },
  });

  revalidatePath("/customers");
  return { success: true };
}

// ── Update customer ───────────────────────────────────────────────────────

export async function updateCustomer(
  id: string,
  data: CustomerInput
): Promise<{ success: true } | { success: false; error: string }> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Unauthorized" };

  const parsed = CustomerSchema.safeParse(data);
  if (!parsed.success) return { success: false, error: parsed.error.errors[0].message };

  const existing = await db.customer.findFirst({
    where: { phone: parsed.data.phone, NOT: { id } },
  });
  if (existing) {
    return { success: false, error: "Another customer already uses this phone number." };
  }

  await db.customer.update({
    where: { id },
    data: {
      name: parsed.data.name,
      phone: parsed.data.phone,
      address: parsed.data.address ?? null,
    },
  });

  revalidatePath("/customers");
  revalidatePath(`/customers/${id}`);
  return { success: true };
}

// ── Record credit payment ─────────────────────────────────────────────────

export async function recordCreditPayment(
  customerId: string,
  amount: number,
  notes: string | null
): Promise<{ success: true } | { success: false; error: string }> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Unauthorized" };

  if (amount <= 0) return { success: false, error: "Amount must be greater than zero." };

  try {
    await db.$transaction(async (tx) => {
      const customer = await tx.customer.findUnique({
        where: { id: customerId },
        select: { creditBalance: true, name: true },
      });
      if (!customer) throw new Error("Customer not found.");

      const balance = Number(customer.creditBalance);
      if (amount > balance) {
        throw new Error(
          `Payment amount (KES ${amount.toFixed(2)}) exceeds credit balance (KES ${balance.toFixed(2)}).`
        );
      }

      await tx.creditPayment.create({
        data: {
          customerId,
          amount,
          notes: notes || null,
          recordedById: session.user.id,
        },
      });

      await tx.customer.update({
        where: { id: customerId },
        data: { creditBalance: { decrement: amount } },
      });
    });

    revalidatePath(`/customers/${customerId}`);
    revalidatePath("/customers");
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to record payment.",
    };
  }
}

// ── Get customer detail ───────────────────────────────────────────────────

export async function getCustomerDetail(id: string): Promise<CustomerDetail | null> {
  const customer = await db.customer.findUnique({
    where: { id },
    include: {
      sales: {
        select: {
          id: true,
          receiptNumber: true,
          saleType: true,
          paymentStatus: true,
          totalAmount: true,
          taxAmount: true,
          discountAmount: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
      },
      creditPayments: {
        select: {
          id: true,
          amount: true,
          notes: true,
          createdAt: true,
          recordedBy: { select: { name: true } },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!customer) return null;
  return JSON.parse(JSON.stringify(customer));
}
