import { FileUpload } from "../models/FileUpload.js";
import { AppError } from "../errors/AppError.js";
import { Bill } from "../models/Bill.js";
import {getFileHash} from "../shared/utils.js";
import type {TipoArquivo} from "../types/file-upload/file-upload-types.js";
import fs from "node:fs";
import path from "node:path";
import FileUploadRepository from "../repository/FileUploadRepository.js";

const fileUploadRepository = new FileUploadRepository();

export default class FileUploadService {

  async createFileUpload(
    billId: number,
    file: Express.Multer.File,
    type: TipoArquivo,
    year?: number,
    month?: number
  ): Promise<FileUpload> {
    const bill = await Bill.findByPk(billId);
    if (!bill) {
      throw new AppError("Conta nao encontrada", 404, "BILL_NOT_FOUND");
    }

    const b64 = await getFileHash(file);

    const duplicateWhere: Record<string, unknown> = {
      hash: b64,
      billId,
    };
    if (year !== undefined) duplicateWhere.year = year;
    if (month !== undefined) duplicateWhere.month = month;

    const existingFile = await FileUpload.findOne({
      where: duplicateWhere,
    });

    if (existingFile) {
      throw new AppError("Esse arquivo já foi anexado nesta conta/mês.");
    }

    return await FileUpload.create({
      billId,
      name: file.originalname,
      hash: b64,
      type: type,
      path: file.path.replace(/\\/g, "/"),
      year: year ?? null,
      month: month ?? null,
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

  async listFiles(
    {
      search,
      billId,
      type
    }:{
      search?: string | null;
      billId?: number | null;
      type?: TipoArquivo;
    }
  ): Promise<FileUpload[]> {
    const params: { search?: string | null; billId?: number | null; type?: TipoArquivo } = {
      search: search ?? null
    };
    if (type !== undefined) params.type = type;
    if (billId !== undefined) params.billId = billId;

    return await fileUploadRepository.findAllFiles(params);
  }
}