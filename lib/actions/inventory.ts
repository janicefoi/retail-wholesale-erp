"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { ItemSchema, type ItemFormValues } from "@/lib/validations/inventory";

type ActionResult<T = void> =
  | { success: true; data?: T }
  | { success: false; error: string };

// ── Helpers ────────────────────────────────────────────────────────────────

function categoryToPrefix(category: string): string {
  const alpha = category.replace(/[^a-zA-Z]/g, "");
  return (alpha.length < 3 ? alpha.padEnd(3, "X") : alpha.slice(0, 3)).toUpperCase();
}

// ── Items — read ───────────────────────────────────────────────────────────

export type ItemFilters = {
  search?: string;
  category?: string;
  isActive?: boolean;
  lowStock?: boolean;
};

export async function getItems(filters?: ItemFilters) {
  const rows = await db.item.findMany({
    where: {
      ...(filters?.search
        ? {
            OR: [
              { name: { contains: filters.search, mode: "insensitive" } },
              { sku: { contains: filters.search, mode: "insensitive" } },
            ],
          }
        : {}),
      ...(filters?.category ? { category: filters.category } : {}),
      ...(filters?.isActive !== undefined ? { isActive: filters.isActive } : {}),
    },
    include: { supplier: { select: { id: true, name: true } } },
    orderBy: { name: "asc" },
  });

  if (filters?.lowStock) {
    return rows.filter((item) => item.stockQty <= item.lowStockThreshold);
  }
  return rows;
}

// ── Items — write ──────────────────────────────────────────────────────────

export async function createItem(data: ItemFormValues): Promise<ActionResult> {
  const parsed = ItemSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message };
  }
  try {
    await db.item.create({ data: parsed.data });
    revalidatePath("/inventory");
    return { success: true };
  } catch (err: unknown) {
    if ((err as { code?: string }).code === "P2002") {
      return { success: false, error: "An item with this SKU already exists." };
    }
    return { success: false, error: "Failed to create item. Please try again." };
  }
}

export async function updateItem(
  id: string,
  data: ItemFormValues
): Promise<ActionResult> {
  const parsed = ItemSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message };
  }
  try {
    await db.item.update({ where: { id }, data: parsed.data });
    revalidatePath("/inventory");
    return { success: true };
  } catch (err: unknown) {
    if ((err as { code?: string }).code === "P2002") {
      return { success: false, error: "An item with this SKU already exists." };
    }
    return { success: false, error: "Failed to update item. Please try again." };
  }
}

export async function toggleItemActive(id: string): Promise<ActionResult> {
  try {
    const item = await db.item.findUnique({ where: { id }, select: { isActive: true } });
    if (!item) return { success: false, error: "Item not found." };
    await db.item.update({ where: { id }, data: { isActive: !item.isActive } });
    revalidatePath("/inventory");
    return { success: true };
  } catch {
    return { success: false, error: "Failed to update item status." };
  }
}

// ── SKU generation ─────────────────────────────────────────────────────────

export async function generateSku(category: string): Promise<string> {
  const prefix = categoryToPrefix(category);

  const existing = await db.item.findMany({
    where: { sku: { startsWith: `${prefix}-` } },
    select: { sku: true },
  });

  let maxNum = 0;
  for (const { sku } of existing) {
    const num = parseInt(sku.slice(prefix.length + 1), 10);
    if (!isNaN(num) && num > maxNum) maxNum = num;
  }

  return `${prefix}-${String(maxNum + 1).padStart(3, "0")}`;
}

// ── Categories ─────────────────────────────────────────────────────────────

export async function getCategories() {
  return db.category.findMany({ orderBy: { name: "asc" } });
}

const CategoryNameSchema = z.string().min(1, "Name is required").max(100);

export async function createCategory(name: string): Promise<ActionResult> {
  const parsed = CategoryNameSchema.safeParse(name.trim());
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message };
  }
  try {
    await db.category.create({ data: { name: parsed.data } });
    revalidatePath("/inventory");
    return { success: true };
  } catch (err: unknown) {
    if ((err as { code?: string }).code === "P2002") {
      return { success: false, error: "A category with this name already exists." };
    }
    return { success: false, error: "Failed to create category." };
  }
}

export async function deleteCategory(id: string): Promise<ActionResult> {
  try {
    const cat = await db.category.findUnique({ where: { id }, select: { name: true } });
    if (!cat) return { success: false, error: "Category not found." };

    const usedBy = await db.item.count({ where: { category: cat.name } });
    if (usedBy > 0) {
      return {
        success: false,
        error: `Cannot delete — ${usedBy} item${usedBy === 1 ? "" : "s"} use this category.`,
      };
    }

    await db.category.delete({ where: { id } });
    revalidatePath("/inventory");
    return { success: true };
  } catch {
    return { success: false, error: "Failed to delete category." };
  }
}
