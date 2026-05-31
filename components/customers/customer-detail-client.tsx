"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Pencil, CreditCard, Phone, MapPin, Calendar, ShoppingBag, Receipt,
} from "lucide-react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CustomerDialog } from "@/components/customers/customer-dialog";
import { RecordPaymentDialog } from "@/components/customers/record-payment-dialog";
import type { CustomerDetail, CustomerRow } from "@/lib/actions/customers";
import { cn } from "@/lib/utils";

function fmtKES(v: string | number) {
  return `KES ${Number(v).toLocaleString("en-KE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-KE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-KE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

interface Props {
  customer: CustomerDetail;
}

export function CustomerDetailClient({ customer }: Props) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [editOpen, setEditOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);

  const balance = Number(customer.creditBalance);
  const hasCredit = balance > 0;

  function handleSuccess() {
    setEditOpen(false);
    setPaymentOpen(false);
    startTransition(() => router.refresh());
  }

  // Coerce CustomerDetail to CustomerRow shape for CustomerDialog
  const customerAsRow: CustomerRow = {
    id: customer.id,
    name: customer.name,
    phone: customer.phone,
    address: customer.address,
    creditBalance: customer.creditBalance,
    createdAt: customer.createdAt,
    _count: { sales: customer.sales.length },
  };

  return (
    <div className="space-y-6">

      {/* ── Back + Edit ──────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <Link
          href="/customers"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Customers
        </Link>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={() => setEditOpen(true)}
        >
          <Pencil className="h-3.5 w-3.5" />
          Edit
        </Button>
      </div>

      {/* ── Top cards ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

        {/* Info card */}
        <div className="sm:col-span-2 rounded-xl border border-slate-200 bg-white p-5 space-y-3">
          <h1 className="text-xl font-bold text-slate-900">{customer.name}</h1>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Phone className="h-4 w-4 text-slate-400 shrink-0" />
              {customer.phone}
            </div>
            {customer.address && (
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <MapPin className="h-4 w-4 text-slate-400 shrink-0" />
                {customer.address}
              </div>
            )}
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Calendar className="h-4 w-4 text-slate-400 shrink-0" />
              Customer since {fmtDate(customer.createdAt)}
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <ShoppingBag className="h-4 w-4 text-slate-400 shrink-0" />
              {customer.sales.length} purchase{customer.sales.length !== 1 ? "s" : ""}
            </div>
          </div>
        </div>

        {/* Credit balance card */}
        <div
          className={cn(
            "rounded-xl border p-5 flex flex-col justify-between",
            hasCredit
              ? "border-red-200 bg-red-50"
              : "border-green-200 bg-green-50"
          )}
        >
          <div>
            <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide mb-2">
              <CreditCard className={cn("h-3.5 w-3.5", hasCredit ? "text-red-500" : "text-green-500")} />
              <span className={hasCredit ? "text-red-600" : "text-green-600"}>
                Credit balance
              </span>
            </div>
            <p
              className={cn(
                "text-3xl font-bold tabular-nums",
                hasCredit ? "text-red-700" : "text-green-700"
              )}
            >
              {fmtKES(balance)}
            </p>
            <p className="text-xs mt-1">
              {hasCredit ? (
                <span className="text-red-500">Amount owed to JSH</span>
              ) : (
                <span className="text-green-600">No outstanding balance</span>
              )}
            </p>
          </div>
          <Button
            size="sm"
            disabled={!hasCredit}
            className={cn(
              "mt-4 w-full gap-1.5",
              hasCredit
                ? "bg-red-600 hover:bg-red-700 text-white"
                : "bg-green-600 hover:bg-green-700 text-white opacity-50 cursor-not-allowed"
            )}
            onClick={() => hasCredit && setPaymentOpen(true)}
          >
            <CreditCard className="h-3.5 w-3.5" />
            Record payment
          </Button>
        </div>
      </div>

      {/* ── Purchase history ─────────────────────────────────────────────── */}
      <section>
        <h2 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-1.5">
          <ShoppingBag className="h-4 w-4 text-slate-400" />
          Purchase history
        </h2>
        <div className="rounded-lg border border-slate-200 bg-white overflow-hidden [&_th]:h-8 [&_th]:py-2 [&_th]:text-[11px] [&_td]:py-2 [&_td]:align-middle">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 hover:bg-slate-50">
                <TableHead className="w-44 whitespace-nowrap">Receipt #</TableHead>
                <TableHead className="w-36 whitespace-nowrap">Date</TableHead>
                <TableHead className="w-24 whitespace-nowrap">Type</TableHead>
                <TableHead className="w-32 text-right whitespace-nowrap">Total</TableHead>
                <TableHead className="w-24 whitespace-nowrap">Payment</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customer.sales.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center text-xs text-slate-400">
                    No purchases yet.
                  </TableCell>
                </TableRow>
              ) : (
                customer.sales.map((sale) => (
                  <TableRow key={sale.id} className="hover:bg-slate-50/60">
                    <TableCell className="font-mono text-[11px] text-slate-500">
                      {sale.receiptNumber}
                    </TableCell>
                    <TableCell className="text-xs text-slate-600">
                      {fmtDateTime(sale.createdAt)}
                    </TableCell>
                    <TableCell>
                      <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                        {sale.saleType}
                      </span>
                    </TableCell>
                    <TableCell className="text-right text-xs font-semibold tabular-nums text-slate-800">
                      {fmtKES(sale.totalAmount)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={cn(
                          "text-[10px] font-medium border px-1.5 py-0",
                          sale.paymentStatus === "PAID"
                            ? "bg-green-50 text-green-700 border-green-200"
                            : "bg-amber-50 text-amber-700 border-amber-200"
                        )}
                      >
                        {sale.paymentStatus}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </section>

      {/* ── Credit payment history ───────────────────────────────────────── */}
      <section>
        <h2 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-1.5">
          <Receipt className="h-4 w-4 text-slate-400" />
          Credit payment history
        </h2>
        <div className="rounded-lg border border-slate-200 bg-white overflow-hidden [&_th]:h-8 [&_th]:py-2 [&_th]:text-[11px] [&_td]:py-2 [&_td]:align-middle">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 hover:bg-slate-50">
                <TableHead className="w-36 whitespace-nowrap">Date</TableHead>
                <TableHead className="w-32 text-right whitespace-nowrap">Amount</TableHead>
                <TableHead className="min-w-[200px]">Notes</TableHead>
                <TableHead className="w-36 whitespace-nowrap">Recorded by</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customer.creditPayments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="py-8 text-center text-xs text-slate-400">
                    No credit payments recorded yet.
                  </TableCell>
                </TableRow>
              ) : (
                customer.creditPayments.map((p) => (
                  <TableRow key={p.id} className="hover:bg-slate-50/60">
                    <TableCell className="text-xs text-slate-600">
                      {fmtDateTime(p.createdAt)}
                    </TableCell>
                    <TableCell className="text-right text-xs font-semibold tabular-nums text-green-700">
                      {fmtKES(p.amount)}
                    </TableCell>
                    <TableCell className="text-xs text-slate-500">
                      {p.notes ?? <span className="text-slate-300">—</span>}
                    </TableCell>
                    <TableCell className="text-xs text-slate-600">
                      {p.recordedBy.name}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </section>

      {/* ── Dialogs ──────────────────────────────────────────────────────── */}
      <CustomerDialog
        open={editOpen}
        onClose={() => setEditOpen(false)}
        customer={customerAsRow}
        onSuccess={handleSuccess}
      />
      <RecordPaymentDialog
        open={paymentOpen}
        onClose={() => setPaymentOpen(false)}
        customerId={customer.id}
        customerName={customer.name}
        creditBalance={balance}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
