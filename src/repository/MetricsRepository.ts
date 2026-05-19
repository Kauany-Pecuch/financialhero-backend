import sequelize from "../db.js";
import { QueryTypes, Op } from "sequelize";
import { Bill } from "../models/Bill.js";
import { FileUpload } from "../models/FileUpload.js";

type MetricsSummaryRaw = {
  month: number;
  year: number;
  total: string;
  recurring: string | number;
  oneOff: string | number;
};

type MetricsSummaryResult = {
  recurring: number;
  oneOff: number;
};

export default class MetricsRepository {

  async getBillsByDateRange({
    userId,
    month,
    year
  }: {
    userId: number;
    month: number;
    year: number;
  }): Promise<Bill[]> {

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    return await Bill.findAll({
      where: {
        userId,
        expirationDate: {
          [Op.between]: [startDate, endDate]
        }
      }
    });
  }

  async getPreviousMonthTotal({
    userId,
    month,
    year
  }: {
    userId: number;
    month: number;
    year: number;
  }): Promise<number> {

    const previousMonthStart = new Date(year, month - 2, 1);
    const previousMonthEnd = new Date(year, month - 1, 0);

    const previousMonthBills = await Bill.findAll({
      where: {
        userId,
        expirationDate: {
          [Op.between]: [previousMonthStart, previousMonthEnd]
        }
      }
    });

    return previousMonthBills.reduce((sum, bill) => {

      const amount =
        typeof bill.amount === "string"
          ? parseFloat(bill.amount)
          : bill.amount;

      return sum + amount;

    }, 0);
  }

  async getReceiptsCount({
    userId,
    month,
    year
  }: {
    userId: number;
    month: number;
    year: number;
  }): Promise<number> {

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    try {

      const count = await FileUpload.count({
        include: [
          {
            model: Bill,
            where: {
              userId,
              expirationDate: {
                [Op.between]: [startDate, endDate]
              }
            }
          }
        ]
      });

      return count || 0;

    } catch {

      return 0;
    }
  }

  async getMetricsSummary({
    userId,
    month,
    year
  }: {
    userId: number;
    month: number;
    year: number;
  }): Promise<MetricsSummaryResult> {

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    const result = await sequelize.query<MetricsSummaryRaw>(`
      SELECT
        EXTRACT(MONTH FROM expiration_date) as month,
        EXTRACT(YEAR FROM expiration_date) as year,
        SUM(amount) as total,
        SUM(CASE WHEN is_recurring = true THEN 1 ELSE 0 END) as recurring,
        SUM(CASE WHEN is_recurring = false THEN 1 ELSE 0 END) as oneOff
      FROM bill
      WHERE user_id = :userId
        AND expiration_date >= :startDate
        AND expiration_date <= :endDate
      GROUP BY
        EXTRACT(YEAR FROM expiration_date),
        EXTRACT(MONTH FROM expiration_date)
      ORDER BY year ASC, month ASC
    `, {
      replacements: {
        userId,
        startDate,
        endDate
      },
      type: QueryTypes.SELECT
    });

    let recurring = 0;
    let oneOff = 0;

    const metrics = result[0];

    if (metrics) {

      recurring = Number(metrics.recurring) || 0;
      oneOff = Number(metrics.oneOff) || 0;
    }

    return {
      recurring,
      oneOff
    };
  }
}