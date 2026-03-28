import express from "express";
import dotenv from "dotenv";
import routers from "./routers/index.js";
import sequelize from "./db.js";
import http from "http";
import { pinoHttp } from "pino-http";
import {logger} from "./shared/logger.js";
import { errorHandler, notFoundHandler } from "./middlewares/ErrorHandler.js";

dotenv.config();
const api = express();
const server = http.createServer(api);

api.use(
  pinoHttp({
    logger,
    customLogLevel: (req, res, err) => {
      if (err || res.statusCode >= 500) return "error";
      if (res.statusCode >= 400) return "warn";
      return "silent";
    },
  })
);

api.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }

  next();
});

api.use(express.json());
api.use(routers);

api.use(notFoundHandler);
api.use(errorHandler);

async function start() {
  try {
    await sequelize.authenticate();
    logger.info('Banco conectado com sucesso');

    await sequelize.sync({alter: true});
    logger.info('Tabelas sincronizadas');

    server.listen(8080, () => {
      logger.info('Servidor rodando na porta 8080');
      logger.info('Aguardando requisições...');
    });
  } catch (err) {
    logger.error({ err }, 'Erro ao iniciar aplicação');
    process.exit(1);
  }
}

start();
