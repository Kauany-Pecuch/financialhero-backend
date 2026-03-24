import type {RequestHandler} from "express";
import BillService from "../services/BillService.js";

const billService = new BillService();

const create: RequestHandler = async (
  _req,
  res
) => {
  try {
    const {userId = 0} = _req.params;
    const body = await billService.createBill(_req.body, userId)
    return res.status(200).json(body);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Erro inesperado";
    return res.status(400).json({
      message: message
    });
  }
};

export default {
  create
};