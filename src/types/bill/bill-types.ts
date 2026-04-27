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
  expirationDate: z.date(),
  isRecurring: z.boolean().default(false)
});

export type CreateBillRequest = z.infer<typeof createBillSchema>;

export const MONTH = z.enum([
  "JANEIRO",
  "FEVEREIRO",
  "MARCO",
  "ABRIL",
  "MAIO",
  "JUNHO",
  "JULHO",
  "AGOSTO",
  "SETEMBRO",
  "OUTUBRO",
  "NOVEMBRO",
  "DEZEMBRO"
]);

export type Month = z.infer<typeof MONTH>;

export const monthlyBillParams = z.object({
  months: z.preprocess(
    (val) => typeof val === "string" ? [val] : val,
    z.array(MONTH)
  ),
  year: z.string().refine((val) => val.length === 4, "O ano deve ter 4 caracteres.")
});

export type MonthlyBillParams = z.infer<typeof monthlyBillParams>;

export type MonthBills = {
  type: BillType;
  description: string;
  amount: number;
  name: string;
  expirationDate: Date;
  month: Month;
  year: string;
}