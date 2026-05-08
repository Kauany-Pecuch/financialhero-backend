import type { Request, Response } from "express";
import { z } from "zod";
import { AppError } from "../errors/AppError.js";
import { logger } from "../shared/logger.js";
import FileUploadService from "../services/FileUploadService.js";
import {uploadFileSchema} from "../types/file-upload/file-upload-types.js";
import type {TypedRequest} from "../types/requests.js";

const fileUploadService = new FileUploadService();

const billIdSchema = z.object({
  billId: z.coerce.number().int().positive(),
});

const fileIdSchema = z.object({
  fileId: z.coerce.number().int().positive(),
});

const upload = async (req: Request, res: Response) => {
  try {
		const { billId } = billIdSchema.parse(req.params);
		const params = uploadFileSchema.parse(req.params);

		if (!req.file) {
			throw new AppError("Arquivo nao enviado", 400, "FILE_REQUIRED");
		}

		const fileUpload = await fileUploadService.createFileUpload(billId, req.file, params.type);

		return res.status(201).json(fileUpload);
  } catch (e: unknown) {
		if (!(e instanceof AppError) && !(e instanceof z.ZodError)) {
			logger.error({ err: e, path: req.originalUrl, method: req.method }, "Falha no upload de arquivo");
		}

		const error =
			e instanceof AppError
			? e
			: e instanceof z.ZodError
				? new AppError("Parametro billId invalido", 400, "INVALID_BILL_ID")
				: new AppError("Erro ao fazer upload do arquivo", 500, "UPLOAD_ERROR");

		return res.status(error.statusCode).json({
			message: error.message,
			code: error.code,
			details: error.details,
		});
  }
};

const download = async (req: TypedRequest, res: Response) => {
	try {
		const { fileId } = fileIdSchema.parse(req.params);
		const fileInfo = await fileUploadService.download(fileId);

		return res.download(fileInfo.path, fileInfo.name);
	} catch (e: unknown) {
		if (!(e instanceof AppError) && !(e instanceof z.ZodError)) {
			logger.error({ err: e, path: req.originalUrl, method: req.method }, "Falha no download de arquivo");
		}

		const error =
			e instanceof AppError
				? e
				: e instanceof z.ZodError
					? new AppError("Parametro fileId invalido", 400, "INVALID_FILE_ID")
					: new AppError("Erro ao fazer download do arquivo", 500, "DOWNLOAD_ERROR");

		return res.status(error.statusCode).json({
			message: error.message,
			code: error.code,
			details: error.details,
		});
	}
};

export default {
  upload,
	download
};
