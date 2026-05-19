import { z } from "zod";
import { BILL_TYPES } from "../bill/bill-types.js";

export const metricsQuerySchema = z.object({
  month: z.string().refine((val) => {
    const num = parseInt(val, 10);
    return num >= 1 && num <= 12;
  }, "Mês deve estar entre 1 e 12"),
  year: z.string().refine((val) => {
    const num = parseInt(val, 10);
    return num >= 2000;
  }, "Ano deve ser válido (>= 2000)")
});

export type MetricsQuery = z.infer<typeof metricsQuerySchema>;

export const metricsByCategorySchema = z.object({
  category: z.enum(BILL_TYPES),
  totalAmount: z.number(),
  hoursNeeded: z.number()
});

export type MetricsByCategory = z.infer<typeof metricsByCategorySchema>;

export const metricsSummarySchema = z.object({
  totalAmount: z.number(),
  totalHours: z.number(),
  previousMonthTotal: z.number(),
  percentChange: z.number(),
  receiptsCount: z.number(),
  recurring: z.number(),
  oneOff: z.number()
});

export type MetricsSummary = z.infer<typeof metricsSummarySchema>;

export const metricsResponseSchema = z.object({
  period: z.object({
    month: z.number(),
    year: z.number()
  }),

  summary: metricsSummarySchema,

  byCategory: z.array(metricsByCategorySchema)
});

export type MetricsResponse = z.infer<typeof metricsResponseSchema>;