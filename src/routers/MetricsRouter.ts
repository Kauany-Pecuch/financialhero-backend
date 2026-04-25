import express from "express";
import MetricsController from "../controllers/MetricsController.js";
import { validateToken } from "../middlewares/Auth.js";

const routes = express.Router();

routes.get("/:userId", validateToken, MetricsController.getMetrics);

export default routes;
