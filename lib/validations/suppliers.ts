import { z } from "zod";

export const SupplierSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().min(9, "Phone number is required"),
  email: z
    .string()
    .email("Invalid email address")
    .or(z.literal(""))
    .optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
});

export type SupplierInput = z.infer<typeof SupplierSchema>;

export const PurchaseOrderSchema = z.object({
  supplierId: z.string().min(1),
  itemId: z.string().min(1, "Please select an item"),
  quantity: z
    .number({ invalid_type_error: "Enter a valid quantity" })
    .int()
    .positive("Quantity must be at least 1"),
  costPrice: z
    .number({ invalid_type_error: "Enter a valid price" })
    .positive("Cost price must be greater than zero"),
});

export type PurchaseOrderInput = z.infer<typeof PurchaseOrderSchema>;
