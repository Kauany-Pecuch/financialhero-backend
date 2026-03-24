import {type Model, type ModelCtor, Sequelize} from "sequelize-typescript";
import dotenv from "dotenv";
import {User} from "./models/User.js";
import {Bill} from "./models/Bill.js";
import {FileUpload} from "./models/FileUpload.js";

dotenv.config();

const { DB_NAME, DB_USER, DB_PASSWORD, DB_HOST, DB_PORT } = process.env;

if (!DB_NAME || !DB_USER || !DB_PASSWORD || !DB_HOST || !DB_PORT) {
  throw new Error(
    "Variáveis de ambiente obrigatórias não definidas para conexão com o banco."
  );
}

const models: ModelCtor<Model<any, any>>[] = [
  User,
  Bill,
  FileUpload
]

const sequelize = new Sequelize({
  database: DB_NAME,
  username: DB_USER,
  password: DB_PASSWORD,
  host: DB_HOST,
  port: DB_PORT ? Number(DB_PORT) : 5432,
  dialect: "postgres",
  models: models,
  logging: false
});

export default sequelize;