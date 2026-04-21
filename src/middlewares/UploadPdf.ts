import fs from "node:fs";
import path from "node:path";
import multer from "multer";
import { AppError } from "../errors/AppError.js";

const uploadDirectory = path.resolve("C:\\", "financialhero", "uploads", "pdf");

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    fs.mkdirSync(uploadDirectory, { recursive: true });
    cb(null, uploadDirectory);
  },
  filename: (_req, file, cb) => {
    const safeName = file.originalname.replace(/\s+/g, "-").toLowerCase();
    const uniqueName = `${Date.now()}-${safeName}`;
    cb(null, uniqueName);
  },
});

const uploadPdf = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype !== "application/pdf") {
      cb(new AppError("Apenas arquivos PDF sao permitidos", 400, "INVALID_FILE_TYPE"));
      return;
    }

    cb(null, true);
  },
});

export default uploadPdf;

