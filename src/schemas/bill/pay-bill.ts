import { z } from "zod";

export const payBillSchema = z.object({
  isPaid: z.boolean()
});

export type PayBillRequest = z.infer<typeof payBillSchema>;