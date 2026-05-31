import QRCode from "react-qr-code";
import type { SaleResult } from "@/lib/actions/pos";
import { SHOP } from "@/lib/constants/shop";
import { VAT_LABEL } from "@/lib/constants/tax";

interface ThermalReceiptProps {
  sale: SaleResult;
}

function money(v: string | number) {
  return Number(v).toLocaleString("en-KE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function Dashes() {
  return (
    <div
      style={{
        borderTop: "1px dashed #000",
        margin: "6px 0",
      }}
    />
  );
}

export function ThermalReceipt({ sale }: ThermalReceiptProps) {
  const createdAt = new Date(sale.createdAt);
  const date = createdAt.toLocaleDateString("en-KE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const time = createdAt.toLocaleTimeString("en-KE", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  const subtotal = sale.items.reduce((sum, i) => sum + Number(i.subtotal), 0);
  const discount = Number(sale.discountAmount);
  const tax = Number(sale.taxAmount);
  const total = Number(sale.totalAmount);
  const isCreditSale = sale.paymentStatus === "CREDIT";

  return (
    <div
      className="thermal-receipt-print"
      style={{
        fontFamily: "'Courier New', Courier, monospace",
        fontSize: "12px",
        maxWidth: "302px",
        width: "100%",
        color: "#000",
        backgroundColor: "#fff",
        padding: "12px 8px",
        lineHeight: 1.4,
      }}
    >
      {/* ── Shop header ─────────────────────────────────────────────── */}
      <div style={{ textAlign: "center", marginBottom: "4px" }}>
        <div style={{ fontWeight: "bold", fontSize: "14px", letterSpacing: "0.5px" }}>
          {SHOP.name}
        </div>
        <div style={{ fontSize: "11px", marginTop: "2px" }}>{SHOP.address}</div>
        <div style={{ fontSize: "11px" }}>Tel: {SHOP.phone}</div>
      </div>

      <Dashes />

      {/* ── Receipt metadata ─────────────────────────────────────────── */}
      <div style={{ fontSize: "11px" }}>
        <div>Receipt #: {sale.receiptNumber}</div>
        <div>Date&nbsp;&nbsp;&nbsp;&nbsp;: {date}</div>
        <div>Time&nbsp;&nbsp;&nbsp;&nbsp;: {time}</div>
        <div>Cashier&nbsp;: {sale.employee.name}</div>
      </div>

      {/* ── Logo placeholder ─────────────────────────────────────────── */}
      {/* Replace this comment with <Image src="/jsh-logo.png" ... /> when ready */}

      <Dashes />

      {/* ── QR code ──────────────────────────────────────────────────── */}
      <div style={{ display: "flex", justifyContent: "center", margin: "8px 0" }}>
        <QRCode
          value={`https://wa.me/254722560051`}
          size={80}
          fgColor="#000000"
          bgColor="#ffffff"
          level="M"
        />
      </div>
      <div style={{ textAlign: "center", fontSize: "10px", marginBottom: "6px" }}>
        Scan to chat with us on WhatsApp
      </div>

      {/* ── Items ────────────────────────────────────────────────────── */}
      <div>
        {sale.items.map((line, idx) => {
          const lineSubtotal = Number(line.subtotal);
          const qty = line.quantity;
          const unit = Number(line.unitPrice);
          return (
            <div key={idx} style={{ marginBottom: "5px" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  gap: "4px",
                }}
              >
                <span style={{ fontWeight: "600", flex: 1, wordBreak: "break-word" }}>
                  {line.item.name}
                </span>
                <span style={{ whiteSpace: "nowrap", fontWeight: "600" }}>
                  KES {money(lineSubtotal)}
                </span>
              </div>
              <div style={{ fontSize: "11px", color: "#333" }}>
                {qty} &times; KES {money(unit)}
              </div>
            </div>
          );
        })}
      </div>

      <Dashes />

      {/* ── Totals ───────────────────────────────────────────────────── */}
      <div style={{ fontSize: "11px" }}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span>Subtotal</span>
          <span>KES {money(subtotal)}</span>
        </div>
        {discount > 0 && (
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span>Discount</span>
            <span>- KES {money(discount)}</span>
          </div>
        )}
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span>{VAT_LABEL}</span>
          <span>KES {money(tax)}</span>
        </div>
      </div>

      <Dashes />

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontWeight: "bold",
          fontSize: "15px",
          margin: "4px 0",
        }}
      >
        <span>TOTAL</span>
        <span>KES {money(total)}</span>
      </div>

      <Dashes />

      {/* ── Payment status ───────────────────────────────────────────── */}
      <div style={{ textAlign: "center", margin: "6px 0" }}>
        <div
          style={{
            display: "inline-block",
            fontWeight: "bold",
            fontSize: "13px",
            letterSpacing: "1px",
            border: "1px solid #000",
            padding: "2px 10px",
          }}
        >
          {isCreditSale ? "CREDIT" : "PAID"}
        </div>
      </div>

      {isCreditSale && sale.customer && (
        <div style={{ fontSize: "11px", margin: "4px 0" }}>
          <div>Customer&nbsp;&nbsp;&nbsp;: {sale.customer.name}</div>
          <div>Credit Balance: KES {money(sale.customer.creditBalance)}</div>
        </div>
      )}

      <Dashes />

      {/* ── Footer ───────────────────────────────────────────────────── */}
      <div style={{ textAlign: "center", fontSize: "11px", marginTop: "4px" }}>
        Thank you for your business!
      </div>
    </div>
  );
}
