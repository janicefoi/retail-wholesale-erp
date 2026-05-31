import {
  ShoppingCart,
  Package,
  Users,
  Truck,
  BarChart3,
  UserCog,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  roles: string[];
}

export const NAV_ITEMS: NavItem[] = [
  {
    label: "Point of Sale",
    href: "/dashboard/pos",
    icon: ShoppingCart,
    roles: ["ADMIN", "MANAGER", "CASHIER"],
  },
  {
    label: "Inventory",
    href: "/dashboard/inventory",
    icon: Package,
    roles: ["ADMIN", "MANAGER", "CASHIER"],
  },
  {
    label: "Customers",
    href: "/dashboard/customers",
    icon: Users,
    roles: ["ADMIN", "MANAGER", "CASHIER"],
  },
  {
    label: "Suppliers",
    href: "/dashboard/suppliers",
    icon: Truck,
    roles: ["ADMIN", "MANAGER", "CASHIER"],
  },
  {
    label: "Reports",
    href: "/dashboard/reports",
    icon: BarChart3,
    roles: ["ADMIN", "MANAGER"],
  },
  {
    label: "Employees",
    href: "/dashboard/admin/employees",
    icon: UserCog,
    roles: ["ADMIN"],
  },
];

export const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/dashboard/pos": "Point of Sale",
  "/dashboard/inventory": "Inventory",
  "/dashboard/customers": "Customers",
  "/dashboard/suppliers": "Suppliers",
  "/dashboard/reports": "Reports",
  "/dashboard/admin/employees": "Employees",
};

export const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Admin",
  MANAGER: "Manager",
  CASHIER: "Cashier",
};
