import { z } from "zod";

export const CustomerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().min(9, "Phone number is required"),
  address: z.string().optional(),
});

export type CustomerInput = z.infer<typeof CustomerSchema>;
