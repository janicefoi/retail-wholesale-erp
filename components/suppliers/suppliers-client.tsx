"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, Truck, Pencil, ChevronRight, Mail, Phone } from "lucide-react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SupplierDialog } from "@/components/suppliers/supplier-dialog";
import type { SupplierRow } from "@/lib/actions/suppliers";

interface Props {
  suppliers: SupplierRow[];
  role: string;
}

export function SuppliersClient({ suppliers, role }: Props) {
  const canEdit = role !== "CASHIER";
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editSupplier, setEditSupplier] = useState<SupplierRow | null>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return suppliers;
    return suppliers.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.phone.includes(q) ||
        (s.email ?? "").toLowerCase().includes(q)
    );
  }, [suppliers, search]);

  function handleSuccess() {
    setDialogOpen(false);
    setEditSupplier(null);
    startTransition(() => router.refresh());
  }

  return (
    <div className="space-y-4">

      {/* ── Toolbar ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="relative w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400 pointer-events-none" />
          <Input
            placeholder="Search name, phone or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>

        <Button
          size="sm"
          className="gap-1.5 shrink-0"
          onClick={() => { setEditSupplier(null); setDialogOpen(true); }}
        >
          <Plus className="h-3.5 w-3.5" />
          Add supplier
        </Button>
      </div>

      {/* ── Table ────────────────────────────────────────────────────────── */}
      <div className="rounded-lg border border-slate-200 bg-white overflow-hidden [&_th]:h-8 [&_th]:py-2 [&_th]:text-[11px] [&_td]:py-2 [&_td]:align-middle">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50 hover:bg-slate-50">
              <TableHead className="min-w-[180px]">Name</TableHead>
              <TableHead className="w-36">Phone</TableHead>
              <TableHead className="w-48">Email</TableHead>
              <TableHead className="w-48">Address</TableHead>
              <TableHead className="w-20 text-right whitespace-nowrap">Items</TableHead>
              <TableHead className="w-24 text-right whitespace-nowrap">Orders</TableHead>
              <TableHead className="w-16 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-12 text-center text-slate-400">
                  <Truck className="h-7 w-7 mx-auto mb-1.5 opacity-30" />
                  <p className="text-xs">
                    {search
                      ? "No suppliers match your search."
                      : "No suppliers yet — click \"Add supplier\" to get started."}
                  </p>
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((s) => (
                <TableRow
                  key={s.id}
                  className="cursor-pointer hover:bg-blue-50/40 transition-colors"
                  onClick={() => router.push(`/suppliers/${s.id}`)}
                >
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold text-slate-800">{s.name}</span>
                      <ChevronRight className="h-3 w-3 text-slate-300" />
                    </div>
                    {s.notes && (
                      <p className="text-[10px] text-slate-400 truncate max-w-[200px] mt-0.5" title={s.notes}>
                        {s.notes}
                      </p>
                    )}
                  </TableCell>

                  <TableCell>
                    <span className="flex items-center gap-1 text-xs text-slate-600">
                      <Phone className="h-3 w-3 text-slate-300 shrink-0" />
                      {s.phone}
                    </span>
                  </TableCell>

                  <TableCell className="text-xs text-slate-500 max-w-0">
                    {s.email ? (
                      <span className="flex items-center gap-1 truncate" title={s.email}>
                        <Mail className="h-3 w-3 text-slate-300 shrink-0" />
                        {s.email}
                      </span>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </TableCell>

                  <TableCell className="text-xs text-slate-500 max-w-0">
                    <span className="block truncate" title={s.address ?? undefined}>
                      {s.address ?? <span className="text-slate-300">—</span>}
                    </span>
                  </TableCell>

                  <TableCell className="text-right">
                    <span className="text-xs font-medium text-slate-700 tabular-nums">
                      {s._count.items}
                    </span>
                  </TableCell>

                  <TableCell className="text-right">
                    <span className="text-xs text-slate-500 tabular-nums">
                      {s._count.purchaseOrders}
                    </span>
                  </TableCell>

                  <TableCell className="text-right">
                    {canEdit && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6 text-slate-400 hover:text-blue-600"
                        title="Edit supplier"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditSupplier(s);
                          setDialogOpen(true);
                        }}
                      >
                        <Pencil className="h-3 w-3" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {suppliers.length > 0 && (
        <p className="text-xs text-slate-400">
          Showing {filtered.length} of {suppliers.length} supplier
          {suppliers.length !== 1 ? "s" : ""}
        </p>
      )}

      <SupplierDialog
        open={dialogOpen}
        onClose={() => { setDialogOpen(false); setEditSupplier(null); }}
        supplier={editSupplier}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
