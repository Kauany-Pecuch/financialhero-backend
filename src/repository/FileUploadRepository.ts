import { Op, col, fn, where } from "sequelize";
import { FileUpload } from "../models/FileUpload.js";
import type { TipoArquivo } from "../types/file-upload/file-upload-types.js";

export default class FileUploadRepository {
  async findAllFiles({
    search,
    billId,
    type
  }: {
    search?: string | null;
    billId?: number | null;
    type?: TipoArquivo;
  }): Promise<FileUpload[]> {
    const filters: Record<string, unknown> = {};
    if (type !== undefined) filters.type = type;

    if (billId != null) {
      filters.billId = billId;
    }

    if (search) {
      filters.name = where(
        fn("LOWER", col("name")),
        {
          [Op.like]: `%${search.toLowerCase()}%`
        }
      );
    }

    return FileUpload.findAll({ where: filters });
  }
}