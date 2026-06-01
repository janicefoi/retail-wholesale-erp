import { z } from "zod";

export const SupplierSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
  phone: z
    .string()
    .trim()
    .regex(
      /^(\+?254|0)[71]\d{8}$/,
      "Enter a valid Kenyan phone number (e.g. 0712345678 or +254712345678)"
    ),
  email: z
    .string()
    .trim()
    .email("Invalid email address")
    .or(z.literal(""))
    .optional(),
  address: z.string().trim().max(200).optional(),
  notes: z.string().trim().max(500).optional(),
});

export type SupplierInput = z.infer<typeof SupplierSchema>;

export const PurchaseOrderSchema = z.object({
  supplierId: z.string().min(1),
  itemId: z.string().min(1, "Please select an item"),
  quantity: z
    .number({ invalid_type_error: "Enter a valid quantity" })
    .int()
    .positive("Quantity must be at least 1")
    .max(99999, "Quantity seems unusually large"),
  costPrice: z
    .number({ invalid_type_error: "Enter a valid price" })
    .positive("Cost price must be greater than zero"),
});

export type PurchaseOrderInput = z.infer<typeof PurchaseOrderSchema>;
