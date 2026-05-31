import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { DashboardShell } from "@/components/layout/dashboard-shell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  // Belt-and-suspenders guard — middleware already handles this,
  // but keeps server components safe if middleware is bypassed.
  if (!session?.user) redirect("/login");

  return <DashboardShell user={session.user}>{children}</DashboardShell>;
}
