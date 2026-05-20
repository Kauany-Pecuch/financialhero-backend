import type {Bill} from "../models/Bill.js";
import sequelize from "../db.js";
import {QueryTypes} from "sequelize";
import type {Month, MonthBills} from "../types/bill/bill-types.js";

const allowedColumns = ["name", "amount", "created_at", "expiration_date", "type"];
const allowedDirections = ["ASC", "DESC"];

const validateSort = ({sort}:{sort: string | null}): string[] => {
  if (!sort) return [];
  const [property, direction] = sort.split(",");

  if (!property || !direction) {
    throw new Error("Invalid sort format");
  }

  if (!allowedColumns.includes(property)) {
    throw new Error("Invalid sort property");
  }

  if (!allowedDirections.includes(direction.toUpperCase())) {
    throw new Error("Invalid sort direction");
  }

  return [property, direction];
}

type CountResult = {
  count: number;
};

const MONTH_TO_NUMBER = {
  JANEIRO: 1,
  FEVEREIRO: 2,
  MARCO: 3,
  ABRIL: 4,
  MAIO: 5,
  JUNHO: 6,
  JULHO: 7,
  AGOSTO: 8,
  SETEMBRO: 9,
  OUTUBRO: 10,
  NOVEMBRO: 11,
  DEZEMBRO: 12
} as const;

export default class BillRepository {

  async findAllBillsByUserId({
    userId,
    page,
    size,
    sort,
    year,
    month
  }:{
    userId: string,
    page: number,
    size: number,
    sort: string | null,
    year?: number,
    month?: number
  }): Promise<Bill[]> {
    const [property, direction] = validateSort({sort});

    const hasContext = year !== undefined && month !== undefined;

    const bills = await sequelize.query<Bill>(`
          SELECT
              b.id,
              b.name,
              b.type,
              b.amount,
              b.description,
              b.active,
              b.expiration_date AS "expirationDate",
              CASE
                WHEN b.recurring = true AND :hasContext = true
                  THEN COALESCE(bp.is_paid, false)
                ELSE b.is_paid
              END                AS "isPaid",
              b.recurring        AS "isRecurring",
              b.user_id          AS "userId",
              b.created_at       AS "createdAt",
              b.updated_at       AS "updatedAt"
          FROM bill b
          LEFT JOIN bill_payment bp
            ON :hasContext = true
           AND b.recurring = true
           AND bp.bill_id = b.id
           AND bp.year = :year
           AND bp.month = :month
          WHERE b.user_id = :userId
              ${ sort ? 'ORDER BY b.' + property + ' ' + direction : ''}
          LIMIT :pageSize
          OFFSET :pageOffset
      `,
      {
        replacements: {
          userId: userId,
          pageOffset: page * size,
          pageSize: size,
          hasContext,
          year: year ?? 0,
          month: month ?? 0,
        },
        type: QueryTypes.SELECT
      }
    )

    return bills;
  }

  async countItemsByUserId(userId: string): Promise<number> {
    const result = await sequelize.query<CountResult>(`
        SELECT COUNT(*) as count
        FROM bill b
        WHERE b.user_id = :userId
    `, {
      replacements: { userId },
      type: QueryTypes.SELECT
    });

    if (!result.length) {
      return 0;
    }

    return Number(result[0]?.count ?? 0);
  }

  async findAllBillByMonths({
    userId,
    months,
    year
  }: {
    userId: number,
    months: Month[],
    year: string
  }): Promise<MonthBills[]> {
    const monthNumbers = months.map(m => MONTH_TO_NUMBER[m]);

    return await sequelize.query<MonthBills>(`
      -- recorrentes (replica para todos os meses, com pagamento por mês)
      SELECT
          b.id,
          b.type,
          b.description,
          b.amount,
          b.name,
          COALESCE(bp.is_paid, false) AS "isPaid",
          b.expiration_date AS "expirationDate",
          CASE m.month_num
              WHEN 1 THEN 'JANEIRO'
              WHEN 2 THEN 'FEVEREIRO'
              WHEN 3 THEN 'MARCO'
              WHEN 4 THEN 'ABRIL'
              WHEN 5 THEN 'MAIO'
              WHEN 6 THEN 'JUNHO'
              WHEN 7 THEN 'JULHO'
              WHEN 8 THEN 'AGOSTO'
              WHEN 9 THEN 'SETEMBRO'
              WHEN 10 THEN 'OUTUBRO'
              WHEN 11 THEN 'NOVEMBRO'
              WHEN 12 THEN 'DEZEMBRO'
          END AS "month",
          $year::int AS "year"
      FROM bill b
      JOIN LATERAL (
          SELECT unnest($monthNumbers::int[]) AS month_num
      ) m ON true
      LEFT JOIN bill_payment bp
        ON bp.bill_id = b.id
       AND bp.year = $year::int
       AND bp.month = m.month_num
      WHERE b.user_id = $userId
        AND b.recurring = true
        AND b.active = true
        AND MAKE_DATE($year::int, m.month_num::int, 1)
              >= DATE_TRUNC('month', b.expiration_date)::date

      UNION ALL

      -- não recorrentes (só no mês correto)
      SELECT
          b.id,
          b.type,
          b.description,
          b.amount,
          b.name,
          b.is_paid AS "isPaid",
          b.expiration_date AS "expirationDate",
          CASE m.month_num
              WHEN 1 THEN 'JANEIRO'
              WHEN 2 THEN 'FEVEREIRO'
              WHEN 3 THEN 'MARCO'
              WHEN 4 THEN 'ABRIL'
              WHEN 5 THEN 'MAIO'
              WHEN 6 THEN 'JUNHO'
              WHEN 7 THEN 'JULHO'
              WHEN 8 THEN 'AGOSTO'
              WHEN 9 THEN 'SETEMBRO'
              WHEN 10 THEN 'OUTUBRO'
              WHEN 11 THEN 'NOVEMBRO'
              WHEN 12 THEN 'DEZEMBRO'
          END AS "month",
          $year::int AS "year"
      FROM bill b
      JOIN LATERAL (
          SELECT unnest($monthNumbers::int[]) AS month_num
      ) m
        ON EXTRACT(MONTH FROM b.expiration_date) = m.month_num
      WHERE b.user_id = $userId
        AND b.recurring = false
        AND EXTRACT(YEAR FROM b.expiration_date) = $year::int;
    `, {
        bind: {
          userId,
          year: Number(year),
          monthNumbers
        },
        type: QueryTypes.SELECT
      });
  }

  async findUpcomingBills({
    userId,
    days = 15
  }: {
    userId: number | string,
    days?: number
  }): Promise<Array<Bill & { daysUntilDue: number }>> {

    const bills = await sequelize.query<Bill & { daysUntilDue: number }>(`
        SELECT
            b.id,
            b.name,
            b.type,
            b.amount,
            b.description,
            b.active,
            b.expiration_date  AS "expirationDate",
            b.recurring        AS "isRecurring",
            b.user_id          AS "userId",
            b.created_at       AS "createdAt",
            b.updated_at       AS "updatedAt",
            (b.expiration_date::date - CURRENT_DATE) AS "daysUntilDue"
        FROM bill b
        LEFT JOIN bill_payment bp
          ON b.recurring = true
         AND bp.bill_id = b.id
         AND bp.year  = EXTRACT(YEAR  FROM CURRENT_DATE)::int
         AND bp.month = EXTRACT(MONTH FROM CURRENT_DATE)::int
        WHERE b.user_id = :userId
          AND b.active = true
          AND b.expiration_date::date >= CURRENT_DATE
          AND b.expiration_date::date <= CURRENT_DATE + CAST(:days AS INTEGER)
          AND (
            (b.recurring = false AND b.is_paid = false)
            OR
            (b.recurring = true AND COALESCE(bp.is_paid, false) = false)
          )
        ORDER BY b.expiration_date ASC
      `,
      {
        replacements: {
          userId: userId,
          days: days
        },
        type: QueryTypes.SELECT
      }
    );

    return bills;
  }

  async getTrendData({
    userId,
    months
  }: {
    userId: number | string,
    months: number
  }): Promise<Array<{
    month: number,
    year: number,
    total: number,
    recurring: number,
    oneOff: number
  }>> {
    const today = new Date();
    const startDate = new Date(
      today.getFullYear(),
      today.getMonth() - (months - 1),
      1,
      0, 0, 0, 0
    );

    const endDate = new Date(
      today.getFullYear(),
      today.getMonth() + 1,
      0,
      23, 59, 59, 999
    );

    const results = await sequelize.query<{
      month: number,
      year: number,
      total: string,
      recurring: string,
      oneOff: string
    }>(`
      SELECT
        EXTRACT(MONTH FROM b.expiration_date)::int AS month,
        EXTRACT(YEAR FROM b.expiration_date)::int AS year,
        COALESCE(SUM(b.amount), 0) AS total,
        COALESCE(SUM(CASE WHEN b.recurring = true THEN b.amount ELSE 0 END), 0) AS recurring,
        COALESCE(SUM(CASE WHEN b.recurring = false THEN b.amount ELSE 0 END), 0) AS "oneOff"
      FROM bill b
      WHERE b.user_id = :userId
        AND b.expiration_date >= :startDate
        AND b.expiration_date <= :endDate
      GROUP BY EXTRACT(YEAR FROM b.expiration_date), EXTRACT(MONTH FROM b.expiration_date)
      ORDER BY year ASC, month ASC
    `, {
      replacements: {
        userId: userId,
        startDate: startDate,
        endDate: endDate
      },
      type: QueryTypes.SELECT
    });

    return results.map(r => ({
      month: r.month,
      year: r.year,
      total: Number(r.total),
      recurring: Number(r.recurring),
      oneOff: Number(r.oneOff)
    }));
  }
}