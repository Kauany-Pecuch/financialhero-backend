import { Bill } from "../models/Bill.js";
import { User } from "../models/User.js";
import { AppError } from "../errors/AppError.js";
import type {
  MetricsResponse,
  MetricsByCategory,
  MetricsSummary
} from "../types/metrics/metrics-types.js";
import { Op } from "sequelize";

export default class MetricsService {
  private readonly HOURS_PER_MONTH = 200;

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

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const bills = await Bill.findAll({
      where: {
        userId,
        expirationDate: {
          [Op.between]: [startDate, endDate]
        }
      }
    });

    if (bills.length === 0) {
      return this.buildEmptyResponse(month, year);
    }

    const grouped = this.groupByCategory(bills);
    const byCategory = this.calculateByCategory(grouped, hourlyRate);
    const summary = this.calculateSummary(byCategory);

    return {
      period: { month, year },
      summary,
      byCategory
    };
  }

  private groupByCategory(bills: Bill[]): Map<string, number[]> {
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
        category,
        totalAmount,
        hoursNeeded: this.round(totalAmount / hourlyRate)
      });
    });

    return result.sort((a, b) => a.category.localeCompare(b.category));
  }

  private calculateSummary(byCategory: MetricsByCategory[]): MetricsSummary {
    const totalAmount = byCategory.reduce((sum, item) => sum + item.totalAmount, 0);
    const totalHours = byCategory.reduce((sum, item) => sum + item.hoursNeeded, 0);

    return {
      totalAmount,
      totalHours: this.round(totalHours)
    };
  }

  private round(value: number): number {
    return Math.round(value * 100) / 100;
  }

  private buildEmptyResponse(month: number, year: number): MetricsResponse {
    return {
      period: { month, year },
      summary: {
        totalAmount: 0,
        totalHours: 0
      },
      byCategory: []
    };
  }
}