import { vi } from "vitest";

const { mockSendMail } = vi.hoisted(() => ({
  mockSendMail: vi.fn()
}));

vi.mock("../../../src/db.ts", () => ({
  default: {}
}));

vi.mock("../../../src/models/User.js", () => ({
  User: {
    findOne: vi.fn()
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
import { PasswordService } from "../../../src/services/PasswordService.js";
import { User } from "../../../src/models/User.js";
import bcrypt from "bcrypt";
import crypto from "crypto";

describe("PasswordService - sendForgotPasswordEmail", () => {
  let passwordService: PasswordService;

  const makeUser = (override = {}) => ({
    id: 1,
    email: "joao@example.com",
    password: "hashed_password",
    update: vi.fn().mockResolvedValue(undefined),
    ...override
  });

  beforeEach(() => {
    vi.clearAllMocks();
    mockSendMail.mockResolvedValue(undefined);
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

    it("deve salvar token e expiração no usuário", async () => {
      const mockUser = makeUser();
      vi.mocked(User.findOne).mockResolvedValue(mockUser as any);

      await passwordService.sendForgotPasswordEmail("joao@example.com");

      expect(mockUser.update).toHaveBeenCalledWith(
        expect.objectContaining({
          passwordResetToken: expect.any(String),
          passwordResetExpires: expect.any(Date)
        })
      );
    });

    it("deve definir expiração de aproximadamente 1 hora", async () => {
      const mockUser = makeUser();
      vi.mocked(User.findOne).mockResolvedValue(mockUser as any);

      const agora = Date.now();
      await passwordService.sendForgotPasswordEmail("joao@example.com");

      const { passwordResetExpires } = mockUser.update.mock.calls[0]![0];
      const diff = passwordResetExpires.getTime() - agora;

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

    it("deve salvar o hash do token e não o token bruto", async () => {
      const mockUser = makeUser();
      vi.mocked(User.findOne).mockResolvedValue(mockUser as any);

      await passwordService.sendForgotPasswordEmail("joao@example.com");

      const { passwordResetToken: savedHash } = mockUser.update.mock.calls[0]![0];
      const emailHtml: string = mockSendMail.mock.calls[0]![2];
      const tokenInLink = emailHtml.match(/token=([a-f0-9]+)/)?.[1]!;

      expect(savedHash).not.toBe(tokenInLink);
      expect(savedHash).toHaveLength(64);
      expect(crypto.createHash('sha256').update(tokenInLink).digest('hex')).toBe(savedHash);
    });
  });
});

describe("PasswordService - resetPassword", () => {
  let passwordService: PasswordService;

  const makeUser = (override = {}) => ({
    id: 1,
    email: "joao@example.com",
    password: "hashed_password",
    passwordResetToken: "valid_token",
    passwordResetExpires: new Date(Date.now() + 60 * 60 * 1000),
    update: vi.fn().mockResolvedValue(undefined),
    ...override
  });

  beforeEach(() => {
    vi.clearAllMocks();
    mockSendMail.mockResolvedValue(undefined);
    passwordService = new PasswordService();
  });

  describe("Validações", () => {
    it("deve lançar erro se token inválido", async () => {
      vi.mocked(User.findOne).mockResolvedValue(null);

      await expect(
        passwordService.resetPassword("token_invalido", "novaSenha123")
      ).rejects.toThrow("Token inválido ou expirado");
    });

    it("deve lançar erro se token expirado", async () => {
      const mockUser = makeUser({
        passwordResetExpires: new Date(Date.now() - 1000)
      });
      vi.mocked(User.findOne).mockResolvedValue(mockUser as any);

      await expect(
        passwordService.resetPassword("valid_token", "novaSenha123")
      ).rejects.toThrow("Token inválido ou expirado");
    });

    it("deve lançar erro se nova senha igual à anterior", async () => {
      const mockUser = makeUser();
      vi.mocked(User.findOne).mockResolvedValue(mockUser as any);
      vi.mocked(bcrypt.compare).mockResolvedValue(true as never);

      await expect(
        passwordService.resetPassword("valid_token", "mesma_senha")
      ).rejects.toThrow("A nova senha não pode ser igual à senha anterior");
    });
  });

  describe("Fluxo", () => {
    it("deve chamar findOne com o hash do token, não o token bruto", async () => {
      const mockUser = makeUser();
      vi.mocked(User.findOne).mockResolvedValue(mockUser as any);
      vi.mocked(bcrypt.compare).mockResolvedValue(false as never);
      vi.mocked(bcrypt.hash).mockResolvedValue("nova_senha_hashed" as never);

      await passwordService.resetPassword("valid_token", "novaSenha123");

      const expectedHash = crypto.createHash('sha256').update("valid_token").digest('hex');
      expect(User.findOne).toHaveBeenCalledWith({
        where: { passwordResetToken: expectedHash }
      });
    });

    it("deve verificar se a nova senha é igual à anterior", async () => {
      const mockUser = makeUser();
      vi.mocked(User.findOne).mockResolvedValue(mockUser as any);
      vi.mocked(bcrypt.compare).mockResolvedValue(false as never);
      vi.mocked(bcrypt.hash).mockResolvedValue("nova_senha_hashed" as never);

      await passwordService.resetPassword("valid_token", "novaSenha123");

      expect(bcrypt.compare).toHaveBeenCalledWith("novaSenha123", "hashed_password");
    });

    it("deve atualizar a senha com o hash da nova senha", async () => {
      const mockUser = makeUser();
      vi.mocked(User.findOne).mockResolvedValue(mockUser as any);
      vi.mocked(bcrypt.compare).mockResolvedValue(false as never);
      vi.mocked(bcrypt.hash).mockResolvedValue("nova_senha_hashed" as never);

      await passwordService.resetPassword("valid_token", "novaSenha123");

      expect(mockUser.update).toHaveBeenCalledWith(
        expect.objectContaining({ password: "nova_senha_hashed" })
      );
    });

    it("deve limpar token e expiração após reset bem-sucedido", async () => {
      const mockUser = makeUser();
      vi.mocked(User.findOne).mockResolvedValue(mockUser as any);
      vi.mocked(bcrypt.compare).mockResolvedValue(false as never);
      vi.mocked(bcrypt.hash).mockResolvedValue("nova_senha_hashed" as never);

      await passwordService.resetPassword("valid_token", "novaSenha123");

      expect(mockUser.update).toHaveBeenCalledWith({
        password: "nova_senha_hashed",
        passwordResetToken: null,
        passwordResetExpires: null
      });
    });
  });
});
