import type { Request, Response } from "express";
import { z } from "zod";
import { AppError } from "../errors/AppError.js";
import { logger } from "../shared/logger.js";
import FileUploadService from "../services/FileUploadService.js";
import {fileUploadQuerySchema, uploadFileSchema} from "../types/file-upload/file-upload-types.js";
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
		const params = uploadFileSchema.parse(req.query);

		if (!req.file) {
			throw new AppError("Arquivo nao enviado", 400, "FILE_REQUIRED");
		}

		const fileUpload = await fileUploadService.createFileUpload(
			billId,
			req.file,
			params.type,
			params.year,
			params.month
		);

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

const remove = async (req: TypedRequest, res: Response) => {
	try {
		const { fileId } = fileIdSchema.parse(req.params);
		const result = await fileUploadService.deleteFile(fileId);

		return res.status(200).json(result);
	} catch (e: unknown) {
		if (!(e instanceof AppError) && !(e instanceof z.ZodError)) {
			logger.error({ err: e, path: req.originalUrl, method: req.method }, "Falha ao excluir arquivo");
		}

		const error =
			e instanceof AppError
				? e
				: e instanceof z.ZodError
					? new AppError("Parametro fileId invalido", 400, "INVALID_FILE_ID")
					: new AppError("Erro ao excluir o arquivo", 500, "DELETE_FILE_ERROR");

		return res.status(error.statusCode).json({
			message: error.message,
			code: error.code,
			details: error.details,
		});
	}
};

const list = async (req: TypedRequest, res: Response) => {
	try {
		const { search, billId, type } = fileUploadQuerySchema.parse(req.query);
		const listParams: { type?: NonNullable<typeof type>; billId?: number | null; search?: string | null } = {};
		if (type !== undefined) listParams.type = type;
		if (billId !== undefined) listParams.billId = billId;
		if (search !== undefined) listParams.search = search;
		const files = await fileUploadService.listFiles(listParams);

		return res.status(200).json(files);
	} catch (e: unknown) {
		if (!(e instanceof AppError) && !(e instanceof z.ZodError)) {
			logger.error({ err: e, path: req.originalUrl, method: req.method }, "Falha ao listar arquivos");
		}

		const error =
			e instanceof AppError
				? e
				: e instanceof z.ZodError
					? new AppError("Parametros invalidos", 400, "INVALID_QUERY")
					: new AppError("Erro ao listar arquivos", 500, "LIST_FILES_ERROR");

		return res.status(error.statusCode).json({
			message: error.message,
			code: error.code,
			details: error.details,
		});
	}
};

export default {
  upload,
	download,
	list,
	remove
};
