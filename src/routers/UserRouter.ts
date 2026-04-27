import express from "express";
import UserController from "../controllers/UserController.js";
import { validateToken } from "../middlewares/Auth.js";

const routes = express.Router();

routes.post('/register', UserController.create);
routes.post('/login', UserController.login);
routes.put('/:userId', validateToken, UserController.update);

export default routes;