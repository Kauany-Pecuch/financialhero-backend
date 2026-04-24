import { vi } from "vitest";

vi.mock("../../../src/db.ts", () => ({
  default: {}
}));

vi.mock("../../../src/models/Bill.js", () => ({
  Bill: {
    findAll: vi.fn()
  }
}));

vi.mock("../../../src/models/User.js", () => ({
  User: {
    findByPk: vi.fn()
  }
}));

import { describe, it, expect, beforeEach } from "vitest";
import MetricsService from "../../../src/services/MetricsService.js";
import { Bill } from "../../../src/models/Bill.js";
import { User } from "../../../src/models/User.js";

describe("MetricsService", () => {
  let metricsService: MetricsService;

  const makeUser = (override = {}) => ({
    id: 1,
    firstName: "John",
    lastName: "Doe",
    email: "john@example.com",
    wage: 8000,
    ...override
  });

  const makeBill = (override = {}) => ({
    id: "1",
    name: "Conta",
    amount: 100,
    type: "AGUA",
    description: "Descrição",
    expirationDate: new Date(2026, 4, 15),
    userId: 1,
    ...override
  });

  beforeEach(() => {
    metricsService = new MetricsService();
    vi.clearAllMocks();
  });

  it("deve calcular métricas agrupadas por categoria", async () => {
    const user = makeUser();
    const bills = [
      makeBill({ type: "AGUA", amount: 100 }),
      makeBill({ id: "2", type: "LUZ", amount: 200 }),
      makeBill({ id: "3", type: "AGUA", amount: 50 })
    ];

    vi.mocked(User.findByPk).mockResolvedValue(user as any);
    vi.mocked(Bill.findAll).mockResolvedValue(bills as any);

    const result = await metricsService.getMetrics(1, 5, 2026);

    expect(result.byCategory).toHaveLength(2);
  });

  it("deve somar corretamente totalAmount por categoria", async () => {
    const user = makeUser();
    const bills = [
      makeBill({ type: "AGUA", amount: 100 }),
      makeBill({ id: "2", type: "AGUA", amount: 50 })
    ];

    vi.mocked(User.findByPk).mockResolvedValue(user as any);
    vi.mocked(Bill.findAll).mockResolvedValue(bills as any);

    const result = await metricsService.getMetrics(1, 5, 2026);

    const agua = result.byCategory.find(m => m.category === "AGUA");
    expect(agua?.totalAmount).toBe(150);
  });

  it("deve calcular corretamente hoursNeeded", async () => {
    const user = makeUser({ wage: 8000 });
    const bills = [makeBill({ amount: 400 })];

    vi.mocked(User.findByPk).mockResolvedValue(user as any);
    vi.mocked(Bill.findAll).mockResolvedValue(bills as any);

    const result = await metricsService.getMetrics(1, 5, 2026);

    const agua = result.byCategory.find(m => m.category === "AGUA");
    expect(agua?.hoursNeeded).toBe(10);
  });

  it("deve arredondar hoursNeeded para 2 casas decimais", async () => {
    const user = makeUser({ wage: 1000 });
    const bills = [makeBill({ amount: 123 })];

    vi.mocked(User.findByPk).mockResolvedValue(user as any);
    vi.mocked(Bill.findAll).mockResolvedValue(bills as any);

    const result = await metricsService.getMetrics(1, 5, 2026);

    const agua = result.byCategory.find(m => m.category === "AGUA");
    expect(agua?.hoursNeeded).toBe(24.6);
  });

  it("deve calcular summary.totalAmount corretamente", async () => {
    const user = makeUser();
    const bills = [
      makeBill({ amount: 100 }),
      makeBill({ id: "2", type: "LUZ", amount: 200 }),
      makeBill({ id: "3", type: "CONDOMINIO", amount: 150 })
    ];

    vi.mocked(User.findByPk).mockResolvedValue(user as any);
    vi.mocked(Bill.findAll).mockResolvedValue(bills as any);

    const result = await metricsService.getMetrics(1, 5, 2026);

    expect(result.summary.totalAmount).toBe(450);
  });

  it("deve calcular summary.totalHours corretamente", async () => {
    const user = makeUser({ wage: 8000 });
    const bills = [
      makeBill({ amount: 400 }),
      makeBill({ id: "2", type: "LUZ", amount: 400 })
    ];

    vi.mocked(User.findByPk).mockResolvedValue(user as any);
    vi.mocked(Bill.findAll).mockResolvedValue(bills as any);

    const result = await metricsService.getMetrics(1, 5, 2026);

    expect(result.summary.totalHours).toBe(20);
  });

  it("deve retornar vazio quando não há dados", async () => {
    const user = makeUser();

    vi.mocked(User.findByPk).mockResolvedValue(user as any);
    vi.mocked(Bill.findAll).mockResolvedValue([]);

    const result = await metricsService.getMetrics(1, 5, 2026);

    expect(result.byCategory).toEqual([]);
    expect(result.summary.totalAmount).toBe(0);
    expect(result.summary.totalHours).toBe(0);
  });

  it("deve lançar erro quando usuário não existe", async () => {
    vi.mocked(User.findByPk).mockResolvedValue(null);

    await expect(
      metricsService.getMetrics(999, 5, 2026)
    ).rejects.toThrow("Usuário não encontrado");
  });

  it("deve converter amount de string para number", async () => {
    const user = makeUser();
    const bills = [
      makeBill({ amount: "100" as any }),
      makeBill({ id: "2", amount: "50" as any })
    ];

    vi.mocked(User.findByPk).mockResolvedValue(user as any);
    vi.mocked(Bill.findAll).mockResolvedValue(bills as any);

    const result = await metricsService.getMetrics(1, 5, 2026);

    const agua = result.byCategory.find(m => m.category === "AGUA");
    expect(agua?.totalAmount).toBe(150);
    expect(typeof agua?.totalAmount).toBe("number");
  });

  it("deve chamar o banco com userId correto", async () => {
    const user = makeUser({ id: 123 });

    vi.mocked(User.findByPk).mockResolvedValue(user as any);
    vi.mocked(Bill.findAll).mockResolvedValue([]);

    await metricsService.getMetrics(123, 5, 2026);

    const calls = vi.mocked(Bill.findAll).mock.calls;

    expect(calls.length).toBeGreaterThan(0);

    const call = calls[0];

    if (call && call[0]) {
      expect(call[0].where).toHaveProperty("userId", 123);
    }
  });

  it("deve retornar o período correto", async () => {
    const user = makeUser();

    vi.mocked(User.findByPk).mockResolvedValue(user as any);
    vi.mocked(Bill.findAll).mockResolvedValue([]);

    const result = await metricsService.getMetrics(1, 5, 2026);

    expect(result.period.month).toBe(5);
    expect(result.period.year).toBe(2026);
  });
});