import { auth } from "@/auth";
import { getCustomers } from "@/lib/actions/customers";
import { getBranches } from "@/lib/actions/branches";
import { CustomersClient } from "@/components/customers/customers-client";

export const metadata = { title: "Customers — JSH ERP" };

export default async function CustomersPage() {
  const session = await auth();
  const role = session?.user?.role ?? "CASHIER";
  const [customers, branches] = await Promise.all([
    getCustomers("ALL"),
    role === "ADMIN" ? getBranches() : Promise.resolve([]),
  ]);
  return <CustomersClient customers={customers} role={role} branches={branches} />;
}
