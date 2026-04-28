import {Bill} from "../models/Bill.js";
import {User} from "../models/User.js";
import {
  type CreateBillRequest,
  type MonthlyBillParams,
  type Month,
  MONTH,
  type MonthBills
} from "../types/bill/bill-types.js";
import type {PagedResponse} from "../types/requests.js";
import BillRepository from "../repository/BillRepository.js";
import {createPagedResponse} from "../shared/builders.js";
import {isEmpty} from "../shared/utils.js";
import {logger} from "../shared/logger.js";

const billRepository = new BillRepository();

export default class BillService {

  async createBill(
    creationRequest: CreateBillRequest,
    userId: number | string | string[]
  ): Promise<Bill> {
    const user = await User.findOne({
      where: {
        id: userId
      }
    });

    if (!user) {
      throw new Error('Usuário não encontrado');
    }

    const { billType, expirationDate, name, amount, description, isRecurring } = creationRequest;

    return await Bill.create({
      type: billType,
      description: description,
      amount: amount,
      name: name,
      expirationDate: expirationDate,
      isRecurring: isRecurring,
      userId: user.id
    });
  }

  async listBill({
    userId,
    page = 0,
    size = 10,
    sort = "created_at,desc"
  } : {
    userId: string,
    page: number,
    size: number,
    sort: string | null | undefined
  }): Promise<PagedResponse<Bill>> {
    const [resultList, totalItems] = await Promise.all([
        billRepository.findAllBillsByUserId({userId, page, size, sort}),
        billRepository.countItemsByUserId(userId)
    ]);

    let direction = '';
    let property = '';
    if (sort) {
      const [separatedProperty, separatedDirection] = sort.split(",");

      if (!separatedProperty || !separatedDirection) {
        throw new Error("Invalid sort format");
      }

      direction = separatedDirection;
      property = separatedProperty;
    }

    return createPagedResponse({
      content: resultList,
      totalItems: totalItems,
      sort: sort ? [{ property, direction }] : []
    });
  }

  async getBill(userId: string, billId: string): Promise<Bill> {
    const bill = await Bill.findOne({
      where: {
        id: billId,
        userId: userId
      }
    });

    if (!bill) {
      throw new Error('Conta não encontrada');
    }

    return bill;
  }

  async findAndGroupBillMonthly(
    q: MonthlyBillParams,
    userId: number
  ): Promise<Map<Month, MonthBills[]>> {
    const billMonthList = await billRepository.findAllBillByMonths({
      userId: userId,
      months: q.months,
      year: q.year
    });

    if (isEmpty(billMonthList)) {
      logger.info('Sem registros para exibir nos meses passados');
    }

    const grouped = billMonthList.reduce((acc, bill) => {
      const list = acc.get(bill.month) ?? [];
      list.push(bill);
      acc.set(bill.month, list);
      return acc;
    }, new Map<Month, MonthBills[]>());

    return grouped;
  }
}