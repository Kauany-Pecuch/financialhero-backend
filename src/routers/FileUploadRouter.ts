import express from "express";
import FileUploadController from "../controllers/FileUploadController.js";
import { validateToken } from "../middlewares/Auth.js";
import uploadPdf from "../middlewares/UploadPdf.js";

const routes = express.Router();

routes.get("/", validateToken, FileUploadController.list);
routes.post("/:billId/upload", validateToken, uploadPdf.single("file"), FileUploadController.upload);
routes.get("/:fileId", validateToken, FileUploadController.download)

export default routes;