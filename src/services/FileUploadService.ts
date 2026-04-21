import { FileUpload } from "../models/FileUpload.js";
import { AppError } from "../errors/AppError.js";
import { Bill } from "../models/Bill.js";
import {getFileHash} from "../shared/utils.js";

export default class FileUploadService {

  async createFileUpload(
    billId: number,
    file: Express.Multer.File
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
      path: file.path.replace(/\\/g, "/"),
    });
  }
}