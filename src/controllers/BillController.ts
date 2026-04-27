import BillService from "../services/BillService.js";
import {
  type Params,
  type BillParams,
  paramsSchema,
  billParamsSchema,
  paginationSchema,
  type TypedRequest
} from "../types/requests.js";
import {
  type CreateBillRequest, monthlyBillParams, type MonthlyBillParams
} from "../types/bill/bill-types.js";
import type {
  Response
} from "express";

const billService = new BillService();

const create = async (
  req: TypedRequest<Params, CreateBillRequest>,
  res: Response
) => {
  try {
    const params = paramsSchema.parse(req.params);
    const body = await billService.createBill(req.body, params.userId)
    return res.status(200).json(body);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Erro inesperado";
    return res.status(400).json({
      message: message
    });
  }
};

//TODO endpoint talvez não seja necessário, verificar
const list = async (
  req: TypedRequest<Params>,
  res: Response
) => {
  try {
    const query = paginationSchema.parse(req.query);
    const params = paramsSchema.parse(req.params);

    const body = await billService.listBill({
      userId: params.userId,
      page: Number(query.page),
      size: Number(query.size),
      sort: query.sort
    });
    return res.status(200).json(body);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Erro inesperado";
    return res.status(400).json({
      message: message
    });
  }
};

const getBill = async (
  req: TypedRequest<BillParams>,
  res: Response
) => {
  try {
    const params = billParamsSchema.parse(req.params);
    const billId = params.billId;

    const bill = await billService.getBill(params.userId, billId);
    return res.status(200).json(bill);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Erro inesperado";
    const statusCode = message.includes('não encontrada') ? 404 : 400;
    return res.status(statusCode).json({
      message: message
    });
  }
};

const getBillMonthly = async (
  req: TypedRequest<MonthlyBillParams>,
  res: Response
) => {
  try {
    const userParams = paramsSchema.parse(req.params);
    const params = monthlyBillParams.parse(req.query);

    const response = await billService.findAndGroupBillMonthly(params, Number(userParams.userId));
    return res.status(200).json(Object.fromEntries(response));
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Erro inesperado";
    const statusCode = message.includes('não encontrada') ? 404 : 400;
    return res.status(statusCode).json({
      message: message
    });
  }
}

export default {
  create,
  list,
  getBill,
  getBillMonthly
};