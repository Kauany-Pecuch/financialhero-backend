import type { NextFunction, Request, Response } from "express";
import { AppError } from "../errors/AppError.js";
import { logger } from "../shared/logger.js";

export function notFoundHandler(req: Request, res: Response) {
  return res.status(404).json({
    message: "Rota nao encontrada",
    path: req.originalUrl,
  });
}

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction
) {
  if (err instanceof AppError) {
    logger.warn(
      {
        err,
        path: req.originalUrl,
        method: req.method,
        code: err.code,
        details: err.details,
      },
      "Erro de negocio"
    );

    return res.status(err.statusCode).json({
      message: err.message,
      code: err.code,
      details: err.details,
    });
  }

  logger.error(
    { err, path: req.originalUrl, method: req.method },
    "Erro interno nao tratado"
  );

  return res.status(500).json({
    message: "Erro interno do servidor",
  });
}