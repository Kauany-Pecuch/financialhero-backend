import { vi } from "vitest";

vi.mock("../../../src/db.ts", () => ({
  default: {}
}));

vi.mock("../../../src/models/FileUpload.js", () => ({
  FileUpload: {
    findByPk: vi.fn()
  }
}));

vi.mock("node:fs", () => ({
  default: {
    existsSync: vi.fn()
  },
  existsSync: vi.fn()
}));

import { describe, it, expect, beforeEach } from "vitest";
import FileUploadService from "../../../src/services/FileUploadService.js";
import { FileUpload } from "../../../src/models/FileUpload.js";
import fs from "node:fs";
import path from "node:path";

describe("FileUploadService - download", () => {
  let fileUploadService: FileUploadService;

  const makeFileUpload = (override = {}) => ({
    id: 1,
    name: "arquivo.pdf",
    path: "C:\\financialhero\\uploads\\pdf\\arquivo.pdf",
    ...override
  });

  beforeEach(() => {
    fileUploadService = new FileUploadService();
    vi.clearAllMocks();
  });

  it("deve retornar path e name quando arquivo existe", async () => {
    const mockFile = makeFileUpload();

    vi.mocked(FileUpload.findByPk).mockResolvedValue(mockFile as any);
    vi.mocked(fs.existsSync as any).mockReturnValue(true);

    const result = await fileUploadService.download(1);

    expect(result).toEqual({
      path: path.normalize(mockFile.path),
      name: mockFile.name
    });
  });

  it("deve lançar erro quando registro não existe", async () => {
    vi.mocked(FileUpload.findByPk).mockResolvedValue(null);

    await expect(fileUploadService.download(999)).rejects.toThrow("Arquivo nao encontrado");
  });

  it("deve lançar erro quando arquivo não existe no disco", async () => {
    const mockFile = makeFileUpload();

    vi.mocked(FileUpload.findByPk).mockResolvedValue(mockFile as any);
    vi.mocked(fs.existsSync as any).mockReturnValue(false);

    await expect(fileUploadService.download(1)).rejects.toThrow("Arquivo nao encontrado no disco");
  });

  it("deve validar existência com o path normalizado", async () => {
    const mockFile = makeFileUpload({ path: "C:/financialhero/uploads/pdf/arquivo.pdf" });

    vi.mocked(FileUpload.findByPk).mockResolvedValue(mockFile as any);
    vi.mocked(fs.existsSync as any).mockReturnValue(true);

    await fileUploadService.download(1);

    expect(fs.existsSync).toHaveBeenCalledWith(path.normalize(mockFile.path));
  });
});

