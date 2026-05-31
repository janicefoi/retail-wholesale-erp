"use client";

import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, Printer, ShoppingCart } from "lucide-react";
import type { SaleResult } from "@/lib/actions/pos";

interface ReceiptModalProps {
  sale: SaleResult;
  onClose: () => void;
}

function fmt(v: string | number) {
  const n = Number(v);
  return `KES ${n.toLocaleString("en-KE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-KE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ReceiptModal({ sale, onClose }: ReceiptModalProps) {
  const subtotal = sale.items.reduce((sum, i) => sum + Number(i.subtotal), 0);
  const discount = Number(sale.discountAmount);
  const total = Number(sale.totalAmount);

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="sm:max-w-sm p-0 overflow-hidden">
        {/* Success header */}
        <div className="bg-green-50 px-6 py-5 flex flex-col items-center gap-1 border-b border-green-100">
          <CheckCircle className="h-8 w-8 text-green-500" />
          <h2 className="text-base font-bold text-green-800">Sale Complete</h2>
          <p className="font-mono text-xs text-green-600">{sale.receiptNumber}</p>
          <p className="text-[10px] text-green-500">{formatDate(sale.createdAt)}</p>
        </div>

        {/* Receipt body */}
        <div className="px-6 py-4 space-y-3 max-h-[50vh] overflow-y-auto">

          {/* Meta */}
          <div className="flex justify-between text-xs text-slate-500">
            <span>Sale type</span>
            <span className="font-medium text-slate-700">{sale.saleType}</span>
          </div>
          <div className="flex justify-between text-xs text-slate-500">
            <span>Payment</span>
            <span className={`font-medium ${sale.paymentStatus === "CREDIT" ? "text-amber-600" : "text-green-600"}`}>
              {sale.paymentStatus}
            </span>
          </div>
          {sale.customer && (
            <div className="flex justify-between text-xs text-slate-500">
              <span>Customer</span>
              <span className="font-medium text-slate-700">{sale.customer.name}</span>
            </div>
          )}
          <div className="flex justify-between text-xs text-slate-500">
            <span>Served by</span>
            <span className="font-medium text-slate-700">{sale.employee.name}</span>
          </div>

          <Separator />

          {/* Items */}
          <div className="space-y-2">
            {sale.items.map((line, idx) => (
              <div key={idx}>
                <div className="flex justify-between items-start gap-2">
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-slate-800 truncate">{line.item.name}</p>
                    <p className="text-[10px] text-slate-400 font-mono">{line.item.sku}</p>
                  </div>
                  <p className="text-xs font-semibold text-slate-800 tabular-nums shrink-0">
                    {fmt(line.subtotal)}
                  </p>
                </div>
                <p className="text-[10px] text-slate-400 tabular-nums">
                  {line.quantity} × {fmt(line.unitPrice)}
                </p>
              </div>
            ))}
          </div>

          <Separator />

          {/* Totals */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-slate-500">
              <span>Subtotal</span>
              <span className="tabular-nums">{fmt(subtotal)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-xs text-red-500">
                <span>Discount</span>
                <span className="tabular-nums">− {fmt(discount)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm font-bold text-slate-900 pt-1">
              <span>Total</span>
              <span className="tabular-nums">{fmt(total)}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="px-6 pb-5 flex gap-2 border-t border-slate-100 pt-4">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 gap-1.5"
            onClick={() => window.print()}
          >
            <Printer className="h-3.5 w-3.5" />
            Print
          </Button>
          <Button
            size="sm"
            className="flex-1 gap-1.5"
            onClick={onClose}
          >
            <ShoppingCart className="h-3.5 w-3.5" />
            New Sale
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
