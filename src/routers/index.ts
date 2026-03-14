import express from "express";
import UserRouter from "./UserRouter.js";

const router = express.Router();

router.use('/user', UserRouter);

export default router;