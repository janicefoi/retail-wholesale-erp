"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, AlertCircle, Package } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { recordPurchaseOrder } from "@/lib/actions/suppliers";
import { PurchaseOrderSchema, type PurchaseOrderInput } from "@/lib/validations/suppliers";
import type { SupplierDetail } from "@/lib/actions/suppliers";

type SupplierItem = SupplierDetail["items"][number];

function fmtKES(n: number) {
  return `KES ${n.toLocaleString("en-KE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

interface RecordPurchaseDialogProps {
  open: boolean;
  onClose: () => void;
  supplierId: string;
  supplierName: string;
  items: SupplierItem[];
  onSuccess: () => void;
}

export function RecordPurchaseDialog({
  open,
  onClose,
  supplierId,
  supplierName,
  items,
  onSuccess,
}: RecordPurchaseDialogProps) {
  const [serverError, setServerError] = useState<string | null>(null);
  const activeItems = items.filter((i) => i.isActive);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<PurchaseOrderInput>({
    resolver: zodResolver(PurchaseOrderSchema),
    defaultValues: {
      supplierId,
      itemId: "",
      quantity: undefined,
      costPrice: undefined,
    },
  });

  const qty = watch("quantity");
  const price = watch("costPrice");
  const totalCost = (Number(qty) || 0) * (Number(price) || 0);

  const selectedItemId = watch("itemId");
  const selectedItem = activeItems.find((i) => i.id === selectedItemId);

  useEffect(() => {
    if (open) {
      reset({
        supplierId,
        itemId: activeItems.length === 1 ? activeItems[0].id : "",
        quantity: undefined,
        costPrice: undefined,
      });
      setServerError(null);
    }
  }, [open, supplierId, activeItems.length]); // eslint-disable-line react-hooks/exhaustive-deps

  async function onSubmit(data: PurchaseOrderInput) {
    setServerError(null);
    const result = await recordPurchaseOrder(data);
    if (!result.success) {
      setServerError(result.error);
      return;
    }
    onSuccess();
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o && !isSubmitting) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Record stock purchase</DialogTitle>
          <DialogDescription>from {supplierName}</DialogDescription>
        </DialogHeader>

        {activeItems.length === 0 ? (
          <div className="py-6 text-center text-sm text-slate-500">
            <Package className="h-8 w-8 mx-auto mb-2 text-slate-300" />
            This supplier has no active items linked to them yet.
            <br />
            <span className="text-xs text-slate-400 mt-1 block">
              Link items to this supplier from Inventory → Edit item → Supplier.
            </span>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-1">
            {/* Hidden supplierId */}
            <input type="hidden" {...register("supplierId")} />

            {/* Item select */}
            <div className="space-y-1.5">
              <Label htmlFor="po-item">Item</Label>
              <select
                id="po-item"
                {...register("itemId")}
                className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="">Select an item…</option>
                {activeItems.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name} ({item.sku}) — stock: {item.stockQty}
                  </option>
                ))}
              </select>
              {errors.itemId && (
                <p className="text-xs text-red-500">{errors.itemId.message}</p>
              )}
              {selectedItem && (
                <p className="text-[11px] text-slate-400">
                  Current stock: <span className="font-medium text-slate-600">{selectedItem.stockQty}</span>
                  {" · "}Retail: <span className="font-medium text-slate-600">{fmtKES(Number(selectedItem.retailPrice))}</span>
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Quantity */}
              <div className="space-y-1.5">
                <Label htmlFor="po-qty">Quantity</Label>
                <Input
                  id="po-qty"
                  type="number"
                  min="1"
                  step="1"
                  placeholder="0"
                  {...register("quantity", { valueAsNumber: true })}
                  className="tabular-nums"
                />
                {errors.quantity && (
                  <p className="text-xs text-red-500">{errors.quantity.message}</p>
                )}
              </div>

              {/* Cost price per unit */}
              <div className="space-y-1.5">
                <Label htmlFor="po-price">Cost price / unit (KES)</Label>
                <Input
                  id="po-price"
                  type="number"
                  min="0.01"
                  step="0.01"
                  placeholder="0.00"
                  {...register("costPrice", { valueAsNumber: true })}
                  className="tabular-nums"
                />
                {errors.costPrice && (
                  <p className="text-xs text-red-500">{errors.costPrice.message}</p>
                )}
              </div>
            </div>

            {/* Total cost preview */}
            {totalCost > 0 && (
              <div className="rounded-md bg-slate-50 border border-slate-100 px-3 py-2 flex justify-between items-center">
                <span className="text-xs text-slate-500">Total purchase cost</span>
                <span className="text-sm font-bold tabular-nums text-slate-800">
                  {fmtKES(totalCost)}
                </span>
              </div>
            )}

            {serverError && (
              <div className="flex items-start gap-2 rounded-md bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700">
                <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                {serverError}
              </div>
            )}

            <div className="flex gap-2 justify-end pt-1">
              <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="gap-1.5">
                {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Record purchase
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
