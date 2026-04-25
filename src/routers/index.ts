import express from "express";
import UserRouter from "./UserRouter.js";
import BillRouter from "./BillRouter.js";
import FileUploadRouter from "./FileUploadRouter.js";
import MetricsRouter from "./MetricsRouter.js";

const router = express.Router();

router.use('/user', UserRouter);
router.use('/bill', BillRouter);
router.use('/file-upload', FileUploadRouter);
router.use('/metrics', MetricsRouter);

export default router;