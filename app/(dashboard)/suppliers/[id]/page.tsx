import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { getSupplierDetail } from "@/lib/actions/suppliers";
import { SupplierDetailClient } from "@/components/suppliers/supplier-detail-client";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const supplier = await getSupplierDetail(id);
  return { title: supplier ? `${supplier.name} — JSH ERP` : "Supplier — JSH ERP" };
}

export default async function SupplierDetailPage({ params }: Props) {
  const { id } = await params;
  const [session, supplier] = await Promise.all([auth(), getSupplierDetail(id)]);
  if (!supplier) notFound();
  return <SupplierDetailClient supplier={supplier} role={session?.user?.role ?? "CASHIER"} />;
}
