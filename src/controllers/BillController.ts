import BillService from "../services/BillService.js";
import {type Params, paramsSchema, querySchema, type TypedRequest} from "../types/requests.js";
import type {CreateBillRequest} from "../types/bill/bill-types.js";
import type {Response} from "express";

const billService = new BillService();

type Req = TypedRequest<Params, CreateBillRequest>;

const create = async (
  req: Req,
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

const list = async (
  req: Req,
  res: Response
) => {
  try {
    const query = querySchema.parse(req.query);
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

export default {
  create,
  list
};