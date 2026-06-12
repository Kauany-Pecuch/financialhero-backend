import { User } from "../models/User.js";
import { AppError } from "../errors/AppError.js";
import MetricsRepository, { type BillAmountRow } from "../repository/MetricsRepository.js";

import type {
  MetricsResponse,
  MetricsByCategory,
  MetricsSummary
} from "../types/metrics/metrics-types.js";

export default class MetricsService {
  private readonly HOURS_PER_MONTH = 200;

  private metricsRepository: MetricsRepository;

  constructor() {
    this.metricsRepository = new MetricsRepository();
  }

  async getMetrics(
    userId: number,
    month: number,
    year: number
  ): Promise<MetricsResponse> {

    const user = await User.findByPk(userId);

    if (!user) {
      throw new AppError("Usuário não encontrado", 404, "USER_NOT_FOUND");
    }

    const wage = Number(user.wage);

    if (!wage || wage <= 0) {
      throw new AppError("Salário inválido para cálculo", 400, "INVALID_WAGE");
    }

    const hourlyRate = wage / this.HOURS_PER_MONTH;

    const bills = await this.metricsRepository.getBillsByDateRange({
      userId,
      month,
      year
    });

    const previousMonthTotal =
      await this.metricsRepository.getPreviousMonthTotal({
        userId,
        month,
        year
      });

    const receiptsCount =
      await this.metricsRepository.getReceiptsCount({
        userId,
        month,
        year
      });

    const metricsSummary =
      await this.metricsRepository.getMetricsSummary({
        userId,
        month,
        year
      });

    if (bills.length === 0) {
      return this.buildEmptyResponse(
        month,
        year,
        previousMonthTotal,
        receiptsCount,
        metricsSummary.recurring,
        metricsSummary.oneOff
      );
    }

    const grouped = this.groupByCategory(bills);
    const byCategory = this.calculateByCategory(grouped, hourlyRate);

    const summary = this.calculateSummary(
      byCategory,
      previousMonthTotal,
      receiptsCount,
      metricsSummary.recurring,
      metricsSummary.oneOff
    );

    return {
      period: { month, year },
      summary,
      byCategory
    };
  }

  private groupByCategory(bills: BillAmountRow[]): Map<string, number[]> {
    const grouped = new Map<string, number[]>();

    for (const bill of bills) {
      const amount =
        typeof bill.amount === "string"
          ? parseFloat(bill.amount)
          : bill.amount;

      const category = bill.type;

      if (!grouped.has(category)) {
        grouped.set(category, []);
      }

      grouped.get(category)!.push(amount);
    }

    return grouped;
  }

  private calculateByCategory(
    grouped: Map<string, number[]>,
    hourlyRate: number
  ): MetricsByCategory[] {
    const result: MetricsByCategory[] = [];

    grouped.forEach((amounts, category) => {
      const totalAmount = amounts.reduce((sum, val) => sum + val, 0);

      result.push({
        category: category as MetricsByCategory["category"],
        totalAmount,
        hoursNeeded: this.round(totalAmount / hourlyRate)
      });
    });

    return result.sort((a, b) => a.category.localeCompare(b.category));
  }

  private calculateSummary(
    byCategory: MetricsByCategory[],
    previousMonthTotal: number,
    receiptsCount: number,
    recurring: number,
    oneOff: number
  ): MetricsSummary {

    const totalAmount = byCategory.reduce((sum, item) => sum + item.totalAmount, 0);

    const totalHours = byCategory.reduce((sum, item) => sum + item.hoursNeeded, 0);

    const percentChange =
      previousMonthTotal === 0
        ? 0
        : Number(
          (
            (
              (totalAmount - previousMonthTotal)
              / previousMonthTotal
            ) * 100
          ).toFixed(2)
        );

    return {
      totalAmount,
      totalHours: this.round(totalHours),
      previousMonthTotal,
      percentChange,
      receiptsCount,
      recurring,
      oneOff
    };
  }

  private round(value: number): number {
    return Math.round(value * 100) / 100;
  }

  private buildEmptyResponse(
    month: number,
    year: number,
    previousMonthTotal: number,
    receiptsCount: number,
    recurring: number,
    oneOff: number
  ): MetricsResponse {

    const percentChange =
      previousMonthTotal === 0
        ? 0
        : Number(
          (
            (-previousMonthTotal / previousMonthTotal) * 100
          ).toFixed(2)
        );

    return {
      period: { month, year },

      summary: {
        totalAmount: 0,
        totalHours: 0,
        previousMonthTotal,
        percentChange,
        receiptsCount,
        recurring,
        oneOff
      },
      byCategory: []
    };
  }
}