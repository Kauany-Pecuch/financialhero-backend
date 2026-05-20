import { z } from "zod";

export const payBillSchema = z.object({
  isPaid: z.boolean(),
  year: z.number().int().optional(),
  month: z.number().int().min(1).max(12).optional(),
});

export type PayBillRequest = z.infer<typeof payBillSchema>;