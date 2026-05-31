# Retail & Wholesale ERP System

A full-stack, production-grade Enterprise Resource Planning (ERP) system built with **TypeScript** end-to-end. Designed for a small-to-medium retail and wholesale business, this system covers the full operational lifecycle — from point of sale to inventory, supplier management, customer credit tracking, and admin reporting.

This project was built as a real-world client solution and is presented here as a portfolio piece to demonstrate practical TypeScript, full-stack Next.js, and database design skills.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Language | TypeScript (strict mode, end-to-end) |
| Framework | Next.js 14 (App Router) |
| Styling | Tailwind CSS + shadcn/ui |
| Database | PostgreSQL (hosted on Supabase) |
| ORM | Prisma |
| Authentication | NextAuth.js v5 (credentials provider) |
| State management | Zustand (POS cart) |
| Runtime | Node.js |

---

## Features

### Point of Sale (front office)
- Live item search by name or SKU with debounced queries
- Three price tiers per item: **retail**, **wholesale**, and **special** (special is optional per item)
- Sale type switcher — prices update dynamically across the cart
- Attach a customer to a sale; mark as **paid** or **on credit**
- Generates and prints an **80mm thermal receipt** with receipt number, cashier name, itemised list, and payment status

### Inventory management
- Add and update stock items with SKU, category, description, and three price tiers
- Special price is strictly optional — the POS will not offer it for items where it is not set
- Low-stock threshold alerts per item
- Soft delete (deactivate/reactivate) — no data is ever permanently lost
- Stock auto-decrements on completed sales; auto-restores on void

### Customer management
- Customer records with full purchase history
- Credit balance tracking — increases on credit sales, decreases on recorded repayments
- Credit repayment is a database transaction: atomically creates a payment record and updates the balance
- Filter customers by credit status

### Supplier management
- Supplier records linked to the items they supply
- Record stock purchases (purchase orders) — atomically creates the order and increments stock quantity

### Admin dashboard
- Today's revenue, sales count, outstanding credit, and low-stock alerts at a glance
- Full receipt history with void support (admin only) — voiding restores stock
- Sales reports by date range with revenue breakdown by sale type
- CSV export

### Employee management (admin only)
- Create employee accounts with role-based access: **Cashier**, **Manager**, or **Admin**
- Deactivate accounts, reset passwords (bcrypt-hashed)
- Per-employee sales activity tracking

---

## Architecture highlights

### Role-based access control
Three roles enforced at the middleware level — no page-level role checks scattered across components:

```
CASHIER  → POS, Inventory (view/edit), Customers, Suppliers
MANAGER  → Everything above + Reports (view)
ADMIN    → Full access including employee management, voiding receipts, exporting data
```

### Price snapshot pattern
`SaleItem.unitPrice` stores the price **at the time of sale**, completely independent of the item's current price. Historic receipts are never affected by future price changes.

### Transactional operations
All multi-step writes (completing a sale, voiding a receipt, recording a credit payment, restocking from a supplier) run inside **Prisma transactions** — either everything commits or nothing does.

### Type safety
- Prisma generates fully-typed models used directly in server actions and API responses
- Zod schemas validate all form inputs before they reach the database
- `useSession()` is typed with the custom session shape (id, name, email, role)
- No `any` types anywhere in the codebase

---

## Database schema

8 models across two logical groups:

**Sales & inventory core**
`User` → `Sale` → `SaleItem` ← `Item`

**People & finance**
`Customer` → `CreditPayment`, `Supplier` → `Item` → `PurchaseOrder`


## Project structure

```
├── app/
│   ├── (auth)/
│   │   └── login/
│   └── dashboard/
│       ├── pos/              # Point of sale
│       ├── inventory/        # Stock management
│       ├── customers/        # Customer records & credit
│       ├── suppliers/        # Supplier records & restocking
│       ├── reports/          # Sales reports (manager+)
│       └── admin/
│           └── employees/    # Employee management (admin only)
├── components/
│   ├── receipt/              # Thermal receipt + print logic
│   └── ui/                   # shadcn/ui components
├── lib/
│   ├── actions/              # Next.js server actions
│   ├── store/                # Zustand stores (cart)
│   ├── prisma.ts             # Prisma client singleton
│   └── auth.ts               # NextAuth config
├── prisma/
│   └── schema.prisma
└── middleware.ts             # Route protection + role guards
```

---

## Author

**Janice Ngugi**
GitHub: [@janicefoi](https://github.com/janicefoi)
