import { vi } from "vitest";

const { mockSendMail } = vi.hoisted(() => ({
  mockSendMail: vi.fn()
}));

vi.mock("../../../src/db.ts", () => ({
  default: {}
}));

vi.mock("../../../src/models/User.js", () => ({
  User: {
    findOne: vi.fn(),
    findByPk: vi.fn()
  }
}));

vi.mock("bcrypt", () => ({
  default: {
    compare: vi.fn(),
    hash: vi.fn()
  }
}));

vi.mock("../../../src/shared/providers/MailProvider.js", () => ({
  MailProvider: vi.fn().mockImplementation(function () {
    return { sendMail: mockSendMail };
  })
}));

import { describe, it, expect, beforeEach } from "vitest";
import { PasswordService, tokenStore } from "../../../src/services/PasswordService.js";
import { User } from "../../../src/models/User.js";
import bcrypt from "bcrypt";
import crypto from "crypto";

describe("PasswordService - sendForgotPasswordEmail", () => {
  let passwordService: PasswordService;

  const makeUser = (override = {}) => ({
    id: 1,
    email: "joao@example.com",
    password: "hashed_password",
    ...override
  });

  beforeEach(() => {
    vi.clearAllMocks();
    mockSendMail.mockResolvedValue(undefined);
    tokenStore.clear();
    passwordService = new PasswordService();
  });

  describe("Validações", () => {
    it("deve lançar erro se usuário não encontrado", async () => {
      vi.mocked(User.findOne).mockResolvedValue(null);

      await expect(
        passwordService.sendForgotPasswordEmail("naoexiste@example.com")
      ).rejects.toThrow("Usuário não encontrado");
    });
  });

  describe("Fluxo", () => {
    it("deve chamar findOne com o email correto", async () => {
      const mockUser = makeUser();
      vi.mocked(User.findOne).mockResolvedValue(mockUser as any);

      await passwordService.sendForgotPasswordEmail("joao@example.com");

      expect(User.findOne).toHaveBeenCalledWith({
        where: { email: "joao@example.com" }
      });
    });

    it("deve salvar o hash do token no cache com userId e expiração", async () => {
      const mockUser = makeUser();
      vi.mocked(User.findOne).mockResolvedValue(mockUser as any);

      await passwordService.sendForgotPasswordEmail("joao@example.com");

      expect(tokenStore.size).toBe(1);
      const [, entry] = [...tokenStore.entries()][0]!;
      expect(entry.userId).toBe(1);
      expect(entry.expiresAt).toBeInstanceOf(Date);
    });

    it("deve definir expiração de aproximadamente 1 hora", async () => {
      const mockUser = makeUser();
      vi.mocked(User.findOne).mockResolvedValue(mockUser as any);

      const agora = Date.now();
      await passwordService.sendForgotPasswordEmail("joao@example.com");

      const [, entry] = [...tokenStore.entries()][0]!;
      const diff = entry.expiresAt.getTime() - agora;

      expect(diff).toBeGreaterThanOrEqual(59 * 60 * 1000);
      expect(diff).toBeLessThanOrEqual(61 * 60 * 1000);
    });

    it("deve enviar e-mail para o endereço do usuário", async () => {
      const mockUser = makeUser();
      vi.mocked(User.findOne).mockResolvedValue(mockUser as any);

      await passwordService.sendForgotPasswordEmail("joao@example.com");

      expect(mockSendMail).toHaveBeenCalledWith(
        "joao@example.com",
        "Recuperação de Senha - Financial Hero",
        expect.stringContaining("reset-password?token=")
      );
    });

    it("deve salvar o hash do token e não o token bruto no cache", async () => {
      const mockUser = makeUser();
      vi.mocked(User.findOne).mockResolvedValue(mockUser as any);

      await passwordService.sendForgotPasswordEmail("joao@example.com");

      const emailHtml: string = mockSendMail.mock.calls[0]![2];
      const tokenInLink = emailHtml.match(/token=([a-f0-9]+)/)?.[1]!;
      const expectedHash = crypto.createHash('sha256').update(tokenInLink).digest('hex');

      expect(tokenStore.has(expectedHash)).toBe(true);
      expect(tokenStore.has(tokenInLink)).toBe(false);
    });
  });
});

describe("PasswordService - resetPassword", () => {
  let passwordService: PasswordService;

  const makeUser = (override = {}) => ({
    id: 1,
    email: "joao@example.com",
    password: "hashed_password",
    update: vi.fn().mockResolvedValue(undefined),
    ...override
  });

  const seedToken = (userId: number, expiresAt: Date) => {
    const tokenHash = crypto.createHash('sha256').update("valid_token").digest('hex');
    tokenStore.set(tokenHash, { userId, expiresAt });
  };

  beforeEach(() => {
    vi.clearAllMocks();
    tokenStore.clear();
    passwordService = new PasswordService();
  });

  describe("Validações", () => {
    it("deve lançar erro se token não existe no cache", async () => {
      await expect(
        passwordService.resetPassword("token_invalido", "novaSenha123")
      ).rejects.toThrow("Token inválido ou expirado");
    });

    it("deve lançar erro se token expirado", async () => {
      seedToken(1, new Date(Date.now() - 1000));

      await expect(
        passwordService.resetPassword("valid_token", "novaSenha123")
      ).rejects.toThrow("Token inválido ou expirado");
    });

    it("deve lançar erro se nova senha igual à anterior", async () => {
      const mockUser = makeUser();
      seedToken(1, new Date(Date.now() + 60 * 60 * 1000));
      vi.mocked(User.findByPk).mockResolvedValue(mockUser as any);
      vi.mocked(bcrypt.compare).mockResolvedValue(true as never);

      await expect(
        passwordService.resetPassword("valid_token", "mesma_senha")
      ).rejects.toThrow("A nova senha não pode ser igual à senha anterior");
    });
  });

  describe("Fluxo", () => {
    it("deve buscar o usuário pelo userId do cache", async () => {
      const mockUser = makeUser();
      seedToken(1, new Date(Date.now() + 60 * 60 * 1000));
      vi.mocked(User.findByPk).mockResolvedValue(mockUser as any);
      vi.mocked(bcrypt.compare).mockResolvedValue(false as never);
      vi.mocked(bcrypt.hash).mockResolvedValue("nova_senha_hashed" as never);

      await passwordService.resetPassword("valid_token", "novaSenha123");

      expect(User.findByPk).toHaveBeenCalledWith(1);
    });

    it("deve verificar se a nova senha é igual à anterior", async () => {
      const mockUser = makeUser();
      seedToken(1, new Date(Date.now() + 60 * 60 * 1000));
      vi.mocked(User.findByPk).mockResolvedValue(mockUser as any);
      vi.mocked(bcrypt.compare).mockResolvedValue(false as never);
      vi.mocked(bcrypt.hash).mockResolvedValue("nova_senha_hashed" as never);

      await passwordService.resetPassword("valid_token", "novaSenha123");

      expect(bcrypt.compare).toHaveBeenCalledWith("novaSenha123", "hashed_password");
    });

    it("deve atualizar a senha com o hash da nova senha", async () => {
      const mockUser = makeUser();
      seedToken(1, new Date(Date.now() + 60 * 60 * 1000));
      vi.mocked(User.findByPk).mockResolvedValue(mockUser as any);
      vi.mocked(bcrypt.compare).mockResolvedValue(false as never);
      vi.mocked(bcrypt.hash).mockResolvedValue("nova_senha_hashed" as never);

      await passwordService.resetPassword("valid_token", "novaSenha123");

      expect(mockUser.update).toHaveBeenCalledWith({ password: "nova_senha_hashed" });
    });

    it("deve remover o token do cache após reset bem-sucedido", async () => {
      const mockUser = makeUser();
      seedToken(1, new Date(Date.now() + 60 * 60 * 1000));
      vi.mocked(User.findByPk).mockResolvedValue(mockUser as any);
      vi.mocked(bcrypt.compare).mockResolvedValue(false as never);
      vi.mocked(bcrypt.hash).mockResolvedValue("nova_senha_hashed" as never);

      await passwordService.resetPassword("valid_token", "novaSenha123");

      expect(tokenStore.size).toBe(0);
    });
  });
});
