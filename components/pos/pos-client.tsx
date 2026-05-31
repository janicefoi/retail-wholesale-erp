"use client";

import { useState } from "react";
import { ItemSearch } from "@/components/pos/item-search";
import { CartPanel } from "@/components/pos/cart-panel";
import { ReceiptModal } from "@/components/pos/receipt-modal";
import type { SaleResult } from "@/lib/actions/pos";

export function POSClient() {
  const [completedSale, setCompletedSale] = useState<SaleResult | null>(null);

  return (
    // -m-6 escapes the layout's p-6 so the POS fills the full viewport height
    <div className="-m-6 flex h-[calc(100vh-3.5rem)] overflow-hidden bg-slate-50">
      {/* ── Left: Item search ─────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden border-r border-slate-200 bg-white min-w-0">
        <ItemSearch />
      </div>

      {/* ── Right: Active order ───────────────────────────────────── */}
      <div className="w-[380px] shrink-0 flex flex-col overflow-hidden bg-white">
        <CartPanel onSaleComplete={setCompletedSale} />
      </div>

      {/* ── Receipt modal (shown after successful sale) ───────────── */}
      {completedSale && (
        <ReceiptModal
          sale={completedSale}
          onClose={() => setCompletedSale(null)}
        />
      )}
    </div>
  );
}
