import { z } from "zod";

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

export type MetricsByCategory = {
  category: string;
  totalAmount: number;
  hoursNeeded: number;
};

export type MetricsSummary = {
  totalAmount: number;
  totalHours: number;
};

export type MetricsResponse = {
  period: {
    month: number;
    year: number;
  };
  summary: MetricsSummary;
  byCategory: MetricsByCategory[];
};