import { createHash } from "node:crypto";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { describe, expect, it } from "vitest";
import { AppError } from "../../../src/errors/AppError.js";
import { getFileHash } from "../../../src/shared/utils.js";

describe("getFileHash", () => {
  it("gera hash SHA-256 quando o arquivo vem em buffer", async () => {
    const content = Buffer.from("conteudo-em-buffer");
    const file = {
      buffer: content,
      path: "",
    } as Express.Multer.File;

    const result = await getFileHash(file);
    const expected = createHash("sha256").update(content).digest("hex");

    expect(result).toBe(expected);
  });

  it("usa file.path quando o buffer esta vazio", async () => {
    const tempDir = await mkdtemp(join(tmpdir(), "financialhero-hash-"));
    const filePath = join(tempDir, "upload.pdf");
    const content = Buffer.from("conteudo-no-disco");

    try {
      await writeFile(filePath, content);

      const file = {
        buffer: Buffer.alloc(0),
        path: filePath,
      } as Express.Multer.File;

      const result = await getFileHash(file);
      const expected = createHash("sha256").update(content).digest("hex");

      expect(result).toBe(expected);
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  it("lanca AppError quando nao consegue ler o payload", async () => {
    const file = {
      buffer: Buffer.alloc(0),
      path: "",
    } as Express.Multer.File;

    expect(getFileHash(file)).rejects.toBeInstanceOf(AppError);
    expect(getFileHash(file)).rejects.toMatchObject({
      message: "Nao foi possivel ler o arquivo enviado",
      statusCode: 400,
      code: "INVALID_FILE_PAYLOAD",
    });
  });
});


