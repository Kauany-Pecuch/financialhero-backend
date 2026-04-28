import { createHash } from "node:crypto";
import { AppError } from "../errors/AppError.js";
import { readFile } from "node:fs/promises";

export const getFileHash = async (
  file: Express.Multer.File
): Promise<string> => {
  const fileContent = file.buffer?.length
    ? file.buffer
    : file.path
      ? await readFile(file.path)
      : null;

  if (!fileContent) {
    throw new AppError("Nao foi possivel ler o arquivo enviado", 400, "INVALID_FILE_PAYLOAD");
  }

  return createHash("sha256").update(fileContent).digest("hex");
};

export function isEmpty<T>(arr: T[]): boolean {
  return !arr || arr.length === 0;
}
