import express from "express";
import UserRouter from "./UserRouter.js";
import BillRouter from "./BillRouter.js";

const router = express.Router();

router.use('/user', UserRouter);
router.use('/bill', BillRouter);

export default router;