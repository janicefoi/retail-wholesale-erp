import { auth } from "@/auth";

export default async function DashboardPage() {
  const session = await auth();

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
      <p className="text-slate-500 mt-1">
        Welcome back, <span className="font-medium">{session?.user?.name}</span>
      </p>
      <p className="text-xs text-slate-400 mt-1">Role: {session?.user?.role}</p>
    </div>
  );
}
