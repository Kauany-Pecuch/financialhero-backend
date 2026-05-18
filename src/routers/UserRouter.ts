import express from "express";
import UserController from "../controllers/UserController.js";
import { validateToken } from "../middlewares/Auth.js";

const routes = express.Router();

routes.post('/register', UserController.create);
routes.post('/login', UserController.login);
routes.put('/:userId', validateToken, UserController.update);
routes.post('/forgot-password', UserController.forgotPassword);
routes.patch('/reset-password', UserController.resetPassword);
routes.patch('/:userId/password', validateToken, UserController.changePassword);

export default routes;