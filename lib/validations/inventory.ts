import { z } from "zod";

const positiveDecimal = z.coerce
  .number({ invalid_type_error: "Must be a valid number" })
  .positive("Must be greater than 0")
  .multipleOf(0.01, "Max 2 decimal places");

export const ItemSchema = z.object({
  sku: z.string().min(1, "SKU is required").max(50),
  name: z.string().min(1, "Name is required").max(200),
  category: z.string().min(1, "Category is required").max(100),
  description: z.string().max(500).optional(),

  retailPrice: positiveDecimal,
  wholesalePrice: positiveDecimal,
  // Empty string → null (field is optional)
  specialPrice: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? null : val),
    z.coerce.number().positive("Must be greater than 0").nullable()
  ),

  stockQty: z.coerce
    .number({ invalid_type_error: "Must be a valid number" })
    .int("Must be a whole number")
    .min(0, "Cannot be negative"),

  lowStockThreshold: z.coerce
    .number({ invalid_type_error: "Must be a valid number" })
    .int("Must be a whole number")
    .min(0, "Cannot be negative"),

  // Empty string → null
  supplierId: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? null : val),
    z.string().nullable()
  ),
});

export type ItemFormValues = z.infer<typeof ItemSchema>;
