import { getCustomers } from "@/lib/actions/customers";
import { CustomersClient } from "@/components/customers/customers-client";

export const metadata = { title: "Customers — JSH ERP" };

export default async function CustomersPage() {
  const customers = await getCustomers("ALL");
  return <CustomersClient customers={customers} />;
}
