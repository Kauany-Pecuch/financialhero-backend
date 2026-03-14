import express from "express";
import UserController from "../controllers/UserController.js";

const routes = express.Router();

routes.post('/register', UserController.create);
routes.post('/login', UserController.login);

export default routes;