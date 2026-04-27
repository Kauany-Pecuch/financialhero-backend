import type { RequestHandler } from "express";
import UserService from "../services/UserService.js";
import { AppError } from "../errors/AppError.js";

const userService = new UserService();

const create: RequestHandler = async (
  _req,
  res
) => {
  try {
    const body = await userService.createUser(_req.body);
    return res.status(200).json({
      token: body.token,
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Erro inesperado";
    return res.status(400).json({
      message: message
    });
  }
};

const login: RequestHandler = async (
  _req,
  res
) => {
  try {
    const body = await userService.login(_req.body);
    return res.status(200).json({
      token: body.token,
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Erro inesperado";
    return res.status(400).json({
      message: message
    });
  }
};

const update: RequestHandler = async (
  _req,
  res
) => {
  try {
    const { userId } = _req.params;
    const body = _req.body;

    const updatedData = await userService.updateUser(Number(userId), body);

    return res.status(200).json({
      data: updatedData,
      message: "Perfil atualizado com sucesso!"
    });
  } catch (e: unknown) {
    if (e instanceof AppError) {
      return res.status(e.statusCode).json({
        message: e.message
      });
    }

    const message = e instanceof Error ? e.message : "Erro inesperado";

    return res.status(400).json({
      message: message
    });
  }
};

export default {
  create,
  login,
    update,
};
