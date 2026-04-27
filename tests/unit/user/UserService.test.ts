import { vi } from "vitest";

vi.mock("../../../src/db.ts", () => ({
  default: {}
}));

vi.mock("../../../src/models/User.js", () => ({
  User: {
    findByPk: vi.fn(),
    findOne: vi.fn()
  }
}));

import { describe, it, expect, beforeEach } from "vitest";
import UserService from "../../../src/services/UserService.js";
import { User } from "../../../src/models/User.js";

describe("UserService - updateUser", () => {
  let userService: UserService;

  const makeUser = (override = {}) => ({
    id: 1,
    firstName: "John",
    lastName: "Doe",
    email: "john@example.com",
    wage: 1000,
    password: "hashed_password",
    update: vi.fn().mockResolvedValue(undefined),
    ...override
  });

  beforeEach(() => {
    userService = new UserService();
    vi.clearAllMocks();
  });

  describe("Atualização", () => {
    it("deve atualizar firstName", async () => {
      const mockUser = makeUser();
      vi.mocked(User.findByPk).mockResolvedValue(mockUser as any);

      await userService.updateUser(1, { firstName: "Jane" });

      expect(mockUser.update).toHaveBeenCalledWith({
        firstName: "Jane"
      });
    });

    it("deve atualizar lastName", async () => {
      const mockUser = makeUser();
      vi.mocked(User.findByPk).mockResolvedValue(mockUser as any);

      await userService.updateUser(1, { lastName: "Smith" });

      expect(mockUser.update).toHaveBeenCalledWith({
        lastName: "Smith"
      });
    });

    it("deve atualizar wage", async () => {
      const mockUser = makeUser();
      vi.mocked(User.findByPk).mockResolvedValue(mockUser as any);

      await userService.updateUser(1, { wage: 2000 });

      expect(mockUser.update).toHaveBeenCalledWith({
        wage: 2000
      });
    });

    it("deve permitir wage = 0", async () => {
      const mockUser = makeUser();
      vi.mocked(User.findByPk).mockResolvedValue(mockUser as any);

      await userService.updateUser(1, { wage: 0 });

      expect(mockUser.update).toHaveBeenCalledWith({
        wage: 0
      });
    });

    it("deve atualizar email quando não existe", async () => {
      const mockUser = makeUser();
      vi.mocked(User.findByPk).mockResolvedValue(mockUser as any);
      vi.mocked(User.findOne).mockResolvedValue(null);

      await userService.updateUser(1, {
        email: "new@email.com"
      });

      expect(mockUser.update).toHaveBeenCalledWith({
        email: "new@email.com"
      });
    });

    it("deve atualizar múltiplos campos", async () => {
      const mockUser = makeUser();
      vi.mocked(User.findByPk).mockResolvedValue(mockUser as any);

      await userService.updateUser(1, {
        firstName: "Jane",
        lastName: "Smith",
        wage: 3000
      });

      expect(mockUser.update).toHaveBeenCalledWith({
        firstName: "Jane",
        lastName: "Smith",
        wage: 3000
      });
    });
  });

  describe("Validações", () => {
    it("deve lançar erro se usuário não existe", async () => {
      vi.mocked(User.findByPk).mockResolvedValue(null);

      await expect(
        userService.updateUser(1, { firstName: "Jane" })
      ).rejects.toThrow("Usuário não encontrado");
    });

    it("deve lançar erro se email já existe", async () => {
      const mockUser = makeUser();
      vi.mocked(User.findByPk).mockResolvedValue(mockUser as any);
      vi.mocked(User.findOne).mockResolvedValue({ id: 2 } as any);

      await expect(
        userService.updateUser(1, { email: "teste@email.com" })
      ).rejects.toThrow("Email já está em uso por outro usuário");
    });

    it("deve permitir manter o mesmo email", async () => {
      const mockUser = makeUser();
      vi.mocked(User.findByPk).mockResolvedValue(mockUser as any);

      await userService.updateUser(1, {
        email: "john@example.com"
      });

      expect(User.findOne).not.toHaveBeenCalled();
      expect(mockUser.update).toHaveBeenCalled();
    });

    it("deve lançar erro se email vazio", async () => {
      const mockUser = makeUser();
      vi.mocked(User.findByPk).mockResolvedValue(mockUser as any);

      await expect(
        userService.updateUser(1, { email: "   " })
      ).rejects.toThrow("Email não pode estar vazio");
    });

    it("deve lançar erro se firstName vazio", async () => {
      const mockUser = makeUser();
      vi.mocked(User.findByPk).mockResolvedValue(mockUser as any);

      await expect(
        userService.updateUser(1, { firstName: "" })
      ).rejects.toThrow("FirstName não pode estar vazio");
    });

    it("deve lançar erro se lastName vazio", async () => {
      const mockUser = makeUser();
      vi.mocked(User.findByPk).mockResolvedValue(mockUser as any);

      await expect(
        userService.updateUser(1, { lastName: "" })
      ).rejects.toThrow("LastName não pode estar vazio");
    });

    it("deve lançar erro se wage negativo", async () => {
      const mockUser = makeUser();
      vi.mocked(User.findByPk).mockResolvedValue(mockUser as any);

      await expect(
        userService.updateUser(1, { wage: -100 })
      ).rejects.toThrow("Wage não pode ser negativo");
    });
  });

  describe("Fluxo", () => {
    it("deve chamar findByPk com id correto", async () => {
      const mockUser = makeUser();
      vi.mocked(User.findByPk).mockResolvedValue(mockUser as any);

      await userService.updateUser(123, { firstName: "Jane" });

      expect(User.findByPk).toHaveBeenCalledWith(123);
    });

    it("deve retornar o usuário", async () => {
      const mockUser = makeUser();
      vi.mocked(User.findByPk).mockResolvedValue(mockUser as any);

      const result = await userService.updateUser(1, {
        firstName: "Jane"
      });

      expect(result).toBe(mockUser);
    });
  });
});