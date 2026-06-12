import sequelize from "../db.js";
import { QueryTypes } from "sequelize";

export type BillAmountRow = {
  type: string;
  amount: string | number;
};

type SummaryRaw = {
  recurring: string | number;
  oneOff: string | number;
};

type SumRaw = { total: string | number };
type CountRaw = { count: string | number };

// Um gasto pertence ao mês (:year, :month) quando:
//  - é recorrente e ativo, e a recorrência já começou até aquele mês
//    (mesma regra usada no calendário / findAllBillByMonths); ou
//  - é avulso e vence exatamente naquele mês.
const BILL_IN_MONTH = `
  (
    (
      b.recurring = true
      AND b.active = true
      AND MAKE_DATE(:year, :month, 1) >= DATE_TRUNC('month', b.expiration_date)::date
    )
    OR
    (
      b.recurring = false
      AND EXTRACT(YEAR FROM b.expiration_date) = :year
      AND EXTRACT(MONTH FROM b.expiration_date) = :month
    )
  )
`;

export default class MetricsRepository {

  async getBillsByDateRange({
    userId,
    month,
    year
  }: {
    userId: number;
    month: number;
    year: number;
  }): Promise<BillAmountRow[]> {

    return await sequelize.query<BillAmountRow>(`
      SELECT b.type, b.amount
      FROM bill b
      WHERE b.user_id = :userId
        AND ${BILL_IN_MONTH}
    `, {
      replacements: { userId, month, year },
      type: QueryTypes.SELECT
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

    // Mês anterior, com virada de ano.
    let prevMonth = month - 1;
    let prevYear = year;
    if (prevMonth === 0) {
      prevMonth = 12;
      prevYear = year - 1;
    }

    const result = await sequelize.query<SumRaw>(`
      SELECT COALESCE(SUM(b.amount), 0) AS total
      FROM bill b
      WHERE b.user_id = :userId
        AND ${BILL_IN_MONTH}
    `, {
      replacements: { userId, month: prevMonth, year: prevYear },
      type: QueryTypes.SELECT
    });

    return Number(result[0]?.total ?? 0);
  }

  async getReceiptsCount({
    userId
  }: {
    userId: number;
    month: number;
    year: number;
  }): Promise<number> {

    try {
      // "documentos salvos": total de arquivos do usuário, incluindo
      // comprovantes (COMPROVANTE) e faturas/cobranças (COBRANCA).
      const result = await sequelize.query<CountRaw>(`
        SELECT COUNT(*) AS count
        FROM file_upload f
        JOIN bill b ON b.id = f.bill_id
        WHERE b.user_id = :userId
      `, {
        replacements: { userId },
        type: QueryTypes.SELECT
      });

      return Number(result[0]?.count ?? 0);

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
  }): Promise<{ recurring: number; oneOff: number }> {

    const result = await sequelize.query<SummaryRaw>(`
      SELECT
        SUM(CASE WHEN b.recurring = true THEN 1 ELSE 0 END) AS recurring,
        SUM(CASE WHEN b.recurring = false THEN 1 ELSE 0 END) AS "oneOff"
      FROM bill b
      WHERE b.user_id = :userId
        AND ${BILL_IN_MONTH}
    `, {
      replacements: { userId, month, year },
      type: QueryTypes.SELECT
    });

    const metrics = result[0];

    return {
      recurring: Number(metrics?.recurring) || 0,
      oneOff: Number(metrics?.oneOff) || 0
    };
  }
}
