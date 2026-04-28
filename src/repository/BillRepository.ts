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
    sort
  }:{
    userId: string,
    page: number,
    size: number,
    sort: string | null
  }): Promise<Bill[]> {
    const [property, direction] = validateSort({sort});

    const bills = await sequelize.query<Bill>(`
        SELECT b.*
        FROM bill b
        WHERE b.user_id = :userId
        ${ sort ? 'ORDER BY ' + property + ' ' + direction : ''}
        LIMIT :pageSize
        OFFSET :pageOffset
      `,
      {
        replacements: {
          userId: userId,
          pageOffset: page * size,
          pageSize: size,
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
      -- recorrentes (replica para todos os meses)
      SELECT
          b.type,
          b.description,
          b.amount,
          b.name,
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
      WHERE b.user_id = $userId
        AND b.recurring = true
        AND b.active = true
  
      UNION ALL
  
      -- não recorrentes (só no mês correto)
      SELECT
          b.type,
          b.description,
          b.amount,
          b.name,
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
}