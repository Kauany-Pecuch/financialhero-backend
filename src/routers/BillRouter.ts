import express from "express";
import BillController from "../controllers/BillController.js"
import {validateToken} from "../middlewares/Auth.js";

const routes = express.Router();

routes.post('/:userId/create', validateToken, BillController.create);
routes.get('/:userId/list', validateToken, BillController.list);
routes.get('/:userId/bill/:billId', validateToken, BillController.getBill);
routes.get('/:userId/monthly', validateToken, BillController.getBillMonthly);

export default routes;