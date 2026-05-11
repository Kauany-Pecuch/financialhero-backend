import { FileUpload } from "../models/FileUpload.js";
import { AppError } from "../errors/AppError.js";
import { Bill } from "../models/Bill.js";
import {getFileHash} from "../shared/utils.js";
import type {TipoArquivo} from "../types/file-upload/file-upload-types.js";
import fs from "node:fs";
import path from "node:path";

export default class FileUploadService {

  async createFileUpload(
    billId: number,
    file: Express.Multer.File,
    type: TipoArquivo
  ): Promise<FileUpload> {
    const bill = await Bill.findByPk(billId);
    if (!bill) {
      throw new AppError("Conta nao encontrada", 404, "BILL_NOT_FOUND");
    }

    const b64 = await getFileHash(file);

    const existingFile = await FileUpload.findOne({
      where: {
        hash: b64
      }
    });

    if (existingFile) {
      throw new AppError("Arquivo já existente no sistema.")
    }

    return await FileUpload.create({
      billId,
      name: file.originalname,
      hash: b64,
      type: type,
      path: file.path.replace(/\\/g, "/"),
    });
  }
  
  async download(fileId: number): Promise<{ path: string; name: string }> {
    const fileUpload = await FileUpload.findByPk(fileId);
    if (!fileUpload) {
      throw new AppError("Arquivo nao encontrado", 404, "FILE_NOT_FOUND");
    }

    const normalizedPath = path.normalize(fileUpload.path);
    if (!fs.existsSync(normalizedPath)) {
      throw new AppError("Arquivo nao encontrado no disco", 404, "FILE_MISSING");
    }

    return {
      path: normalizedPath,
      name: fileUpload.name,
    };
  }
}