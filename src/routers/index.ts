import express from "express";
import UserRouter from "./UserRouter.js";
import BillRouter from "./BillRouter.js";
import FileUploadRouter from "./FileUploadRouter.js";

const router = express.Router();

router.use('/user', UserRouter);
router.use('/bill', BillRouter);
router.use('/file-upload', FileUploadRouter);

export default router;