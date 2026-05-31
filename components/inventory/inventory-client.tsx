"use client";

import { useState, useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Plus, Pencil, Power, AlertTriangle, Search, Package, Tag, Lock,
  PackagePlus, Download, ArrowUpDown, ChevronUp, ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { toggleItemActive } from "@/lib/actions/inventory";
import { ItemDialog, type DialogItem } from "@/components/inventory/item-dialog";
import { CategoryDialog } from "@/components/inventory/category-dialog";
import { StockInDialog } from "@/components/inventory/stock-in-dialog";
import { cn } from "@/lib/utils";

export type InventoryItem = {
  id: string;
  sku: string;
  name: string;
  category: string;
  description: string | null;
  retailPrice: string;
  wholesalePrice: string;
  specialPrice: string | null;
  stockQty: number;
  lowStockThreshold: number;
  isActive: boolean;
  supplierId: string | null;
  supplier: { id: string; name: string } | null;
  createdAt: string;
  updatedAt: string;
};

interface Category { id: string; name: string }

interface Props {
  initialItems: InventoryItem[];
  suppliers: { id: string; name: string }[];
  categories: Category[];
  userRole: string;
}

type SortField = "sku" | "name" | "category" | "retailPrice" | "stockQty";
type SortDir = "asc" | "desc";

function formatKES(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  const num = Number(value);
  if (isNaN(num)) return "—";
  return `KES ${num.toLocaleString("en-KE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function SortHeader({
  field, label, sortField, sortDir, onSort, className,
}: {
  field: SortField; label: string; sortField: SortField; sortDir: SortDir;
  onSort: (f: SortField) => void; className?: string;
}) {
  const active = sortField === field;
  const Icon = active ? (sortDir === "asc" ? ChevronUp : ChevronDown) : ArrowUpDown;
  return (
    <TableHead
      className={cn("cursor-pointer select-none whitespace-nowrap", className)}
      onClick={() => onSort(field)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        <Icon className={cn("h-3 w-3", active ? "text-blue-500" : "text-slate-300")} />
      </span>
    </TableHead>
  );
}

export function InventoryClient({ initialItems, suppliers, categories, userRole }: Props) {
  const canManage = userRole === "ADMIN" || userRole === "MANAGER";
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [pendingToggleId, setPendingToggleId] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [showInactive, setShowInactive] = useState(false);
  const [lowStockOnly, setLowStockOnly] = useState(false);

  // Sorting
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  // Dialogs
  const [createOpen, setCreateOpen] = useState(false);
  const [editItem, setEditItem] = useState<InventoryItem | null>(null);
  const [stockInItem, setStockInItem] = useState<InventoryItem | null>(null);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);

  function handleSort(field: SortField) {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  }

  const filteredItems = useMemo(() => {
    const q = search.toLowerCase();
    return initialItems.filter((item) => {
      if (!showInactive && !item.isActive) return false;
      if (lowStockOnly && item.stockQty > item.lowStockThreshold) return false;
      if (categoryFilter !== "all" && item.category !== categoryFilter) return false;
      if (q && !item.name.toLowerCase().includes(q) && !item.sku.toLowerCase().includes(q))
        return false;
      return true;
    });
  }, [initialItems, search, categoryFilter, showInactive, lowStockOnly]);

  const sortedItems = useMemo(() => {
    return [...filteredItems].sort((a, b) => {
      let av: string | number = "";
      let bv: string | number = "";
      if (sortField === "sku")        { av = a.sku; bv = b.sku; }
      else if (sortField === "name")  { av = a.name; bv = b.name; }
      else if (sortField === "category") { av = a.category; bv = b.category; }
      else if (sortField === "retailPrice") { av = Number(a.retailPrice); bv = Number(b.retailPrice); }
      else if (sortField === "stockQty") { av = a.stockQty; bv = b.stockQty; }
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
  }, [filteredItems, sortField, sortDir]);

  // Summary counts (always based on initialItems)
  const statsActive    = useMemo(() => initialItems.filter((i) => i.isActive).length, [initialItems]);
  const statsLowStock  = useMemo(() => initialItems.filter((i) => i.isActive && i.stockQty <= i.lowStockThreshold).length, [initialItems]);
  const statsInactive  = useMemo(() => initialItems.filter((i) => !i.isActive).length, [initialItems]);

  async function handleToggleActive(id: string) {
    setPendingToggleId(id);
    await toggleItemActive(id);
    setPendingToggleId(null);
    startTransition(() => router.refresh());
  }

  function handleSuccess() {
    setCreateOpen(false);
    setEditItem(null);
    startTransition(() => router.refresh());
  }

  function handleExport() {
    const headers = [
      "SKU", "Name", "Category", "Supplier",
      "Retail (KES)", "Wholesale (KES)", "Special (KES)",
      "Stock", "Low Stock At", "Status",
    ];
    const rows = sortedItems.map((item) => [
      item.sku,
      item.name,
      item.category,
      item.supplier?.name ?? "",
      Number(item.retailPrice).toFixed(2),
      Number(item.wholesalePrice).toFixed(2),
      item.specialPrice !== null ? Number(item.specialPrice).toFixed(2) : "",
      String(item.stockQty),
      String(item.lowStockThreshold),
      item.isActive ? "Active" : "Inactive",
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `jsh-inventory-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  const sortProps = { sortField, sortDir, onSort: handleSort };

  return (
    <div className="space-y-4">

      {/* ── Toolbar ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex flex-1 flex-wrap gap-2 items-center">
          <div className="relative w-60">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400 pointer-events-none" />
            <Input
              placeholder="Search name or SKU…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="all">All categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.name}>{c.name}</option>
            ))}
          </select>

          <label className="flex items-center gap-1.5 text-sm text-slate-600 cursor-pointer select-none">
            <input type="checkbox" checked={lowStockOnly} onChange={(e) => setLowStockOnly(e.target.checked)} className="rounded" />
            Low stock only
          </label>
          <label className="flex items-center gap-1.5 text-sm text-slate-600 cursor-pointer select-none">
            <input type="checkbox" checked={showInactive} onChange={(e) => setShowInactive(e.target.checked)} className="rounded" />
            Show inactive
          </label>
        </div>

        <div className="flex gap-2 shrink-0 items-center">
          {!canManage && (
            <span className="flex items-center gap-1 text-[11px] text-amber-600 bg-amber-50 border border-amber-200 rounded-md px-2.5 py-1 font-medium">
              <Lock className="h-3 w-3" />
              View only
            </span>
          )}

          {initialItems.length > 0 && (
            <Button variant="outline" size="sm" className="gap-1.5" onClick={handleExport}>
              <Download className="h-3.5 w-3.5" />
              Export
            </Button>
          )}

          {canManage && (
            <>
              <Button variant="outline" size="sm" onClick={() => setCategoryDialogOpen(true)} className="gap-1.5">
                <Tag className="h-3.5 w-3.5" />
                Categories
              </Button>
              <Button size="sm" onClick={() => setCreateOpen(true)} className="gap-1.5">
                <Plus className="h-3.5 w-3.5" />
                Add item
              </Button>
            </>
          )}
        </div>
      </div>

      {/* ── Table ────────────────────────────────────────────────────────── */}
      <div className="rounded-lg border border-slate-200 bg-white overflow-hidden [&_th]:h-7 [&_th]:py-1.5 [&_th]:text-[11px] [&_td]:py-1 [&_td]:align-middle">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50 hover:bg-slate-50">
              <SortHeader field="sku"        label="SKU"       className="w-24" {...sortProps} />
              <SortHeader field="name"       label="Name"      className="min-w-[200px]" {...sortProps} />
              <SortHeader field="category"   label="Category"  className="w-32" {...sortProps} />
              <SortHeader field="retailPrice" label="Retail"   className="w-28 text-right" {...sortProps} />
              <TableHead className="w-28 text-right whitespace-nowrap">Wholesale</TableHead>
              <TableHead className="w-28 text-right whitespace-nowrap">Special</TableHead>
              <SortHeader field="stockQty"   label="Stock"     className="w-16 text-right" {...sortProps} />
              <TableHead className="w-20 whitespace-nowrap">Status</TableHead>
              <TableHead className="w-20 text-right whitespace-nowrap">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="py-10 text-center text-slate-400">
                  <Package className="h-7 w-7 mx-auto mb-1.5 opacity-30" />
                  <p className="text-xs">
                    {search || categoryFilter !== "all" || lowStockOnly
                      ? "No items match your filters."
                      : canManage
                      ? "No items yet — click \"Add item\" to get started."
                      : "No items yet."}
                  </p>
                </TableCell>
              </TableRow>
            ) : (
              sortedItems.map((item) => {
                const isLow = item.stockQty <= item.lowStockThreshold;
                const isToggling = pendingToggleId === item.id;

                return (
                  <TableRow
                    key={item.id}
                    className={cn("transition-colors", !item.isActive && "opacity-50 bg-slate-50")}
                  >
                    <TableCell className="whitespace-nowrap font-mono text-[11px] text-slate-400">
                      {item.sku}
                    </TableCell>

                    {/* Name + supplier */}
                    <TableCell className="max-w-0">
                      <div className="truncate font-medium text-xs text-slate-800" title={item.name}>
                        {item.name}
                      </div>
                      {item.supplier && (
                        <p className="text-[10px] text-slate-400 truncate">{item.supplier.name}</p>
                      )}
                    </TableCell>

                    <TableCell className="whitespace-nowrap">
                      <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                        {item.category}
                      </span>
                    </TableCell>

                    <TableCell className="text-right whitespace-nowrap text-xs tabular-nums">
                      {formatKES(item.retailPrice)}
                    </TableCell>
                    <TableCell className="text-right whitespace-nowrap text-xs tabular-nums">
                      {formatKES(item.wholesalePrice)}
                    </TableCell>
                    <TableCell className="text-right whitespace-nowrap text-xs tabular-nums text-slate-400">
                      {formatKES(item.specialPrice)}
                    </TableCell>

                    {/* Stock with threshold ratio */}
                    <TableCell className="text-right whitespace-nowrap">
                      <span className={cn("text-xs font-semibold", isLow ? "text-red-600" : "text-slate-700")}>
                        {isLow && <AlertTriangle className="inline h-3 w-3 mr-0.5 mb-0.5" />}
                        {item.stockQty}
                      </span>
                      <p className="text-[9px] text-slate-300 tabular-nums">
                        min {item.lowStockThreshold}
                      </p>
                    </TableCell>

                    <TableCell className="whitespace-nowrap">
                      <Badge
                        className={cn(
                          "text-[10px] font-medium border px-1.5 py-0",
                          item.isActive
                            ? "bg-green-50 text-green-700 border-green-200"
                            : "bg-slate-100 text-slate-500 border-slate-200"
                        )}
                      >
                        {item.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>

                    <TableCell className="whitespace-nowrap">
                      {canManage ? (
                        <div className="flex items-center justify-end gap-0.5">
                          <Button
                            size="icon" variant="ghost"
                            className="h-6 w-6 text-slate-400 hover:text-green-600"
                            onClick={() => setStockInItem(item)}
                            title="Stock in"
                            disabled={!item.isActive}
                          >
                            <PackagePlus className="h-3 w-3" />
                          </Button>
                          <Button
                            size="icon" variant="ghost"
                            className="h-6 w-6 text-slate-400 hover:text-blue-600"
                            onClick={() => setEditItem(item)}
                            title="Edit item"
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button
                            size="icon" variant="ghost"
                            className={cn("h-6 w-6", item.isActive ? "text-slate-300 hover:text-red-500" : "text-slate-300 hover:text-green-600")}
                            onClick={() => handleToggleActive(item.id)}
                            disabled={isToggling}
                            title={item.isActive ? "Deactivate" : "Restore"}
                          >
                            <Power className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <span className="text-slate-200">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* ── Summary bar ──────────────────────────────────────────────────── */}
      {initialItems.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
          <span>
            Showing {sortedItems.length} of {initialItems.length} item{initialItems.length !== 1 ? "s" : ""}
          </span>
          <div className="flex gap-3">
            <span>{statsActive} active</span>
            {statsLowStock > 0 && (
              <span className="text-amber-600 font-medium">{statsLowStock} low stock</span>
            )}
            {statsInactive > 0 && <span>{statsInactive} inactive</span>}
          </div>
        </div>
      )}

      {/* ── Dialogs ──────────────────────────────────────────────────────── */}
      <StockInDialog
        open={!!stockInItem}
        onClose={() => setStockInItem(null)}
        item={stockInItem}
        onSuccess={() => { setStockInItem(null); startTransition(() => router.refresh()); }}
      />
      <CategoryDialog
        open={categoryDialogOpen}
        onClose={() => setCategoryDialogOpen(false)}
        categories={categories}
      />
      <ItemDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        item={null}
        suppliers={suppliers}
        categories={categories}
        onSuccess={handleSuccess}
      />
      <ItemDialog
        open={!!editItem}
        onClose={() => setEditItem(null)}
        item={editItem as DialogItem | null}
        suppliers={suppliers}
        categories={categories}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
