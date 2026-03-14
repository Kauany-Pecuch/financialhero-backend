import { Sequelize } from "sequelize-typescript";
import dotenv from "dotenv";
import {User} from "./models/User.js";

dotenv.config();

const { DB_NAME, DB_USER, DB_PASSWORD, DB_HOST, DB_PORT } = process.env;

if (!DB_NAME || !DB_USER || !DB_PASSWORD || !DB_HOST || !DB_PORT) {
  throw new Error(
    "Variáveis de ambiente obrigatórias não definidas para conexão com o banco."
  );
}

const sequelize = new Sequelize({
  database: DB_NAME,
  username: DB_USER,
  password: DB_PASSWORD,
  host: DB_HOST,
  port: DB_PORT ? Number(DB_PORT) : 5432,
  dialect: "postgres",
  models: [User],
  logging: false
});

export default sequelize;