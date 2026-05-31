import { z } from "zod";

export const CreateEmployeeSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  role: z.enum(["CASHIER", "MANAGER"], { required_error: "Please select a role" }),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const UpdateEmployeeSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  role: z.enum(["CASHIER", "MANAGER"], { required_error: "Please select a role" }),
});

export type CreateEmployeeInput = z.infer<typeof CreateEmployeeSchema>;
export type UpdateEmployeeInput = z.infer<typeof UpdateEmployeeSchema>;
