import { auth } from "@/auth";
import { getSuppliers } from "@/lib/actions/suppliers";
import { SuppliersClient } from "@/components/suppliers/suppliers-client";

export const metadata = { title: "Suppliers — JSH ERP" };

export default async function SuppliersPage() {
  const [session, suppliers] = await Promise.all([auth(), getSuppliers()]);
  return <SuppliersClient suppliers={suppliers} role={session?.user?.role ?? "CASHIER"} />;
}
