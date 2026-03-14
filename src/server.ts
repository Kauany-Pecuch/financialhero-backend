import express from "express";
import dotenv from "dotenv";
import http from "http";
import routers from "./routers/index.js";
import sequelize from "./db.js";

dotenv.config();
const api = express();
const server = http.createServer(api);

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

async function start() {
  try {
    await sequelize.authenticate();
    console.log('Banco conectado com sucesso');

    await sequelize.sync({alter: true});
    console.log('Tabelas sincronizadas');

    server.listen(8080, () => {
      console.log('🚀 Servidor rodando na porta 8080');
      console.log('📡 Aguardando requisições...');
    });
  } catch (err) {
    console.error('❌ Erro ao iniciar aplicação:', err);
  }
}

start();
