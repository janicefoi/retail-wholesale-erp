import { auth } from "@/auth";
import { db } from "@/lib/db";
import { InventoryClient } from "@/components/inventory/inventory-client";

export const metadata = { title: "Inventory — JSH ERP" };

export default async function InventoryPage() {
  const [session, items, suppliers, categories] = await Promise.all([
    auth(),
    db.item.findMany({
      include: { supplier: { select: { id: true, name: true } } },
      orderBy: { name: "asc" },
    }),
    db.supplier.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    db.category.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <InventoryClient
      initialItems={JSON.parse(JSON.stringify(items))}
      suppliers={suppliers}
      categories={categories}
      userRole={session?.user?.role ?? "CASHIER"}
    />
  );
}
