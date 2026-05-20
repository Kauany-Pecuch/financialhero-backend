import {Bill} from "../models/Bill.js";
import {BillPayment} from "../models/BillPayment.js";
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
import { AppError } from "../errors/AppError.js";

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
    sort = "created_at,desc",
    year,
    month
  } : {
    userId: string,
    page: number,
    size: number,
    sort: string | null | undefined,
    year?: number | undefined,
    month?: number | undefined
  }): Promise<PagedResponse<Bill>> {
    const repoArgs: {
      userId: string;
      page: number;
      size: number;
      sort: string | null;
      year?: number;
      month?: number;
    } = { userId, page, size, sort: sort ?? null };
    if (year !== undefined) repoArgs.year = year;
    if (month !== undefined) repoArgs.month = month;

    const [resultList, totalItems] = await Promise.all([
        billRepository.findAllBillsByUserId(repoArgs),
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

  async payBill(
    billId: number,
    userId: number,
    isPaid: boolean,
    year?: number,
    month?: number
  ): Promise<{ message: string }> {
    const bill = await Bill.findOne({ where: { id: billId, userId } });
    if (!bill) {
      throw new AppError("Conta não encontrada", 404);
    }

    if (bill.isRecurring) {
      if (year === undefined || month === undefined) {
        throw new AppError(
          "Mês e ano são obrigatórios para pagar contas recorrentes",
          400
        );
      }
      if (month < 1 || month > 12) {
        throw new AppError("Mês inválido", 400);
      }

      const existing = await BillPayment.findOne({
        where: { billId, year, month },
      });

      if (existing) {
        await existing.update({
          isPaid,
          paidAt: isPaid ? new Date() : null,
        });
      } else {
        await BillPayment.create({
          billId,
          year,
          month,
          isPaid,
          paidAt: isPaid ? new Date() : null,
        });
      }
    } else {
      await bill.update({ isPaid });
    }

    return { message: `Conta ${isPaid ? 'marcada como paga' : 'desmarcada como paga'} com sucesso` };
  }
  async getUpcomingBills({
    userId,
    days = 15
  }: {
    userId: number | string,
    days?: number
  }): Promise<{
    bills: Array<{
      id: number;
      name: string;
      amount: number;
      expirationDate: string;
      daysUntilDue: number;
      isRecurring: boolean;
      type: string;
    }>
  }> {
    const upcomingBillsData = await billRepository.findUpcomingBills({
      userId,
      days
    });

    const bills = upcomingBillsData.map(bill => {
      const billDate = new Date(bill.expirationDate!);
      const expirationDateStr = billDate.toISOString().substring(0, 10);

      return {
        id: Number(bill.id),
        name: bill.name,
        amount: Number(bill.amount),
        expirationDate: expirationDateStr,
        daysUntilDue: Number(bill.daysUntilDue),
        isRecurring: bill.isRecurring,
        type: bill.type
      };
    });

    return { bills };
  }

  async getTrendData({
    userId,
    months = 12
  }: {
    userId: number | string,
    months?: number
  }): Promise<{
    series: Array<{
      month: number,
      year: number,
      total: number,
      recurring: number,
      oneOff: number
    }>
  }> {
    const allowedMonths = [3, 6, 12];
    if (!allowedMonths.includes(months)) {
      throw new Error("Parâmetro 'months' deve ser 3, 6 ou 12");
    }

    const trendData = await billRepository.getTrendData({
      userId,
      months
    });

    return { series: trendData };
  }
}