import { z } from "zod"

export const BILL_TYPES = [
  "LUZ",
  "AGUA",
  "CONDOMINIO",
  "FINANCIAMENTO"
] as const;

export type BillType = typeof BILL_TYPES[number];

export const createBillSchema = z.object({
  billType: z.enum(BILL_TYPES),
  description: z.string().optional(),
  amount: z.number().min(0.0),
  name: z.string(),
  expirationDate: z.date()
});

export type CreateBillRequest = z.infer<typeof createBillSchema>;