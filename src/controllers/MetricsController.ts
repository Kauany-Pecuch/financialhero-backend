import type { RequestHandler } from "express";
import MetricsService from "../services/MetricsService.js";
import { paramsSchema } from "../types/requests.js";
import { metricsQuerySchema } from "../types/metrics/metrics-types.js";
import { AppError } from "../errors/AppError.js";
import { logger } from "../shared/logger.js";

const metricsService = new MetricsService();

const getMetrics: RequestHandler = async (req, res) => {
  try {
    const { userId } = paramsSchema.parse(req.params);
    const { month, year } = metricsQuerySchema.parse(req.query);

    const metrics = await metricsService.getMetrics(
      Number(userId),
      Number(month),
      Number(year)
    );

    return res.status(200).json(metrics);
  } catch (e: unknown) {
    if (!(e instanceof AppError)) {
      logger.error(
        { err: e, path: req.originalUrl, method: req.method },
        "Erro ao buscar métricas"
      );
    }

    const error =
      e instanceof AppError
        ? e
        : new AppError("Erro ao buscar métricas", 500, "METRICS_ERROR");

    return res.status(error.statusCode).json({
      message: error.message,
      code: error.code,
      details: error.details,
    });
  }
};

export default {
  getMetrics,
};