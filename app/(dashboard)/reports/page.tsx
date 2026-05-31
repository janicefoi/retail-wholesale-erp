import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { ReportsClient } from "@/components/reports/reports-client";

export const metadata = { title: "Reports — JSH ERP" };

export default async function ReportsPage() {
  const session = await auth();
  if (!["ADMIN", "MANAGER"].includes(session?.user?.role ?? "")) {
    redirect("/dashboard");
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Reports</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Sales analysis by date range
        </p>
      </div>
      <ReportsClient />
    </div>
  );
}
