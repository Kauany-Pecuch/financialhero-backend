import type { RequestHandler } from "express";
import UserService from "../services/UserService.js";

const userService = new UserService();

const create: RequestHandler = async (
  _req,
  res
) => {
  try {
    const body = await userService.createUser(_req.body);

    return res.status(200).json({
      token: body.token
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Erro inesperado";
    return res.status(400).json({
      message: message
    });
  }
};

export default {
  create,
};
