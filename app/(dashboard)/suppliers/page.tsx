import { getSuppliers } from "@/lib/actions/suppliers";
import { SuppliersClient } from "@/components/suppliers/suppliers-client";

export const metadata = { title: "Suppliers — JSH ERP" };

export default async function SuppliersPage() {
  const suppliers = await getSuppliers();
  return <SuppliersClient suppliers={suppliers} />;
}
