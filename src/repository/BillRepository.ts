import type {Bill} from "../models/Bill.js";
import sequelize from "../db.js";
import {QueryTypes} from "sequelize";

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
}