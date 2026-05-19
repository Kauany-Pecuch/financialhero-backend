import { vi } from "vitest";

vi.mock("../../../src/db.ts", () => ({
  default: {}
}));

vi.mock("../../../src/models/User.js", () => ({
  User: {
    findByPk: vi.fn()
  }
}));

vi.mock("../../../src/models/FileUpload.js", () => ({
  FileUpload: {
    count: vi.fn()
  }
}));

vi.mock("../../../src/repository/MetricsRepository.js", () => {
  return {
    default: class MetricsRepository {
      getBillsByDateRange = vi.fn();
      getPreviousMonthTotal = vi.fn();
      getReceiptsCount = vi.fn();
      getMetricsSummary = vi.fn();
    }
  };
});

import { describe, it, expect, beforeEach } from "vitest";
import MetricsService from "../../../src/services/MetricsService.js";
import { User } from "../../../src/models/User.js";
import { FileUpload } from "../../../src/models/FileUpload.js";

describe("MetricsService", () => {
  let metricsService: MetricsService;
  let metricsRepository: any;

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
    type: "MORADIA",
    description: "Descrição",
    expirationDate: new Date(2026, 4, 15),
    userId: 1,
    ...override
  });

  beforeEach(() => {
    metricsService = new MetricsService();
    metricsRepository = (metricsService as any).metricsRepository;

    vi.clearAllMocks();

    vi.mocked(FileUpload.count).mockResolvedValue(0 as any);

    metricsRepository.getPreviousMonthTotal.mockResolvedValue(0);
    metricsRepository.getReceiptsCount.mockResolvedValue(0);
    metricsRepository.getMetricsSummary.mockResolvedValue({
      recurring: 0,
      oneOff: 0
    });
  });

  it("deve calcular métricas agrupadas por categoria", async () => {
    const user = makeUser();
    const bills = [
      makeBill({ type: "MORADIA", amount: 100 }),
      makeBill({ id: "2", type: "ALIMENTACAO", amount: 200 }),
      makeBill({ id: "3", type: "MORADIA", amount: 50 })
    ];

    vi.mocked(User.findByPk).mockResolvedValue(user as any);
    metricsRepository.getBillsByDateRange.mockResolvedValue(bills);

    const result = await metricsService.getMetrics(1, 5, 2026);

    expect(result.byCategory).toHaveLength(2);
  });

  it("deve somar corretamente totalAmount por categoria", async () => {
    const user = makeUser();
    const bills = [
      makeBill({ type: "MORADIA", amount: 100 }),
      makeBill({ id: "2", type: "MORADIA", amount: 50 })
    ];

    vi.mocked(User.findByPk).mockResolvedValue(user as any);
    metricsRepository.getBillsByDateRange.mockResolvedValue(bills);

    const result = await metricsService.getMetrics(1, 5, 2026);

    const moradia = result.byCategory.find(m => m.category === "MORADIA");
    expect(moradia?.totalAmount).toBe(150);
  });

  it("deve calcular corretamente hoursNeeded", async () => {
    const user = makeUser({ wage: 8000 });
    const bills = [makeBill({ amount: 400 })];

    vi.mocked(User.findByPk).mockResolvedValue(user as any);
    metricsRepository.getBillsByDateRange.mockResolvedValue(bills);

    const result = await metricsService.getMetrics(1, 5, 2026);

    const moradia = result.byCategory.find(m => m.category === "MORADIA");
    expect(moradia?.hoursNeeded).toBe(10);
  });

  it("deve arredondar hoursNeeded para 2 casas decimais", async () => {
    const user = makeUser({ wage: 1000 });
    const bills = [makeBill({ amount: 123 })];

    vi.mocked(User.findByPk).mockResolvedValue(user as any);
    metricsRepository.getBillsByDateRange.mockResolvedValue(bills);

    const result = await metricsService.getMetrics(1, 5, 2026);

    const moradia = result.byCategory.find(m => m.category === "MORADIA");
    expect(moradia?.hoursNeeded).toBe(24.6);
  });

  it("deve calcular summary.totalAmount corretamente", async () => {
    const user = makeUser();
    const bills = [
      makeBill({ amount: 100 }),
      makeBill({ id: "2", type: "ALIMENTACAO", amount: 200 }),
      makeBill({ id: "3", type: "SERVICOS", amount: 150 })
    ];

    vi.mocked(User.findByPk).mockResolvedValue(user as any);
    metricsRepository.getBillsByDateRange.mockResolvedValue(bills);

    const result = await metricsService.getMetrics(1, 5, 2026);

    expect(result.summary.totalAmount).toBe(450);
  });

  it("deve calcular summary.totalHours corretamente", async () => {
    const user = makeUser({ wage: 8000 });
    const bills = [
      makeBill({ amount: 400 }),
      makeBill({ id: "2", type: "ALIMENTACAO", amount: 400 })
    ];

    vi.mocked(User.findByPk).mockResolvedValue(user as any);
    metricsRepository.getBillsByDateRange.mockResolvedValue(bills);

    const result = await metricsService.getMetrics(1, 5, 2026);

    expect(result.summary.totalHours).toBe(20);
  });

  it("deve retornar vazio quando não há dados", async () => {
    const user = makeUser();

    vi.mocked(User.findByPk).mockResolvedValue(user as any);
    metricsRepository.getBillsByDateRange.mockResolvedValue([]);

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
    metricsRepository.getBillsByDateRange.mockResolvedValue(bills);

    const result = await metricsService.getMetrics(1, 5, 2026);

    const moradia = result.byCategory.find(m => m.category === "MORADIA");
    expect(moradia?.totalAmount).toBe(150);
    expect(typeof moradia?.totalAmount).toBe("number");
  });

  it("deve chamar o banco com userId correto", async () => {
    const user = makeUser({ id: 123 });

    vi.mocked(User.findByPk).mockResolvedValue(user as any);
    metricsRepository.getBillsByDateRange.mockResolvedValue([]);

    await metricsService.getMetrics(123, 5, 2026);

    expect(metricsRepository.getBillsByDateRange).toHaveBeenCalledWith({
      userId: 123,
      month: 5,
      year: 2026
    });
  });

  it("deve retornar o período correto", async () => {
    const user = makeUser();

    vi.mocked(User.findByPk).mockResolvedValue(user as any);
    metricsRepository.getBillsByDateRange.mockResolvedValue([]);

    const result = await metricsService.getMetrics(1, 5, 2026);

    expect(result.period.month).toBe(5);
    expect(result.period.year).toBe(2026);
  });

  it("deve calcular percentChange corretamente", async () => {
    const user = makeUser();

    vi.mocked(User.findByPk).mockResolvedValue(user as any);

    metricsRepository.getBillsByDateRange.mockResolvedValue([
      makeBill({ amount: 200 })
    ]);

    metricsRepository.getPreviousMonthTotal.mockResolvedValue(100);

    const result = await metricsService.getMetrics(1, 5, 2026);

    expect(result.summary.percentChange).toBe(100);
  });

  it("deve retornar receiptsCount corretamente", async () => {
    const user = makeUser();

    vi.mocked(User.findByPk).mockResolvedValue(user as any);

    metricsRepository.getBillsByDateRange.mockResolvedValue([]);

    metricsRepository.getReceiptsCount.mockResolvedValue(5);

    const result = await metricsService.getMetrics(1, 5, 2026);

    expect(result.summary.receiptsCount).toBe(5);
  });

  it("deve retornar recurring e oneOff corretamente", async () => {
    const user = makeUser();

    vi.mocked(User.findByPk).mockResolvedValue(user as any);

    metricsRepository.getBillsByDateRange.mockResolvedValue([]);

    metricsRepository.getMetricsSummary.mockResolvedValue({
      recurring: 3,
      oneOff: 2
    });

    const result = await metricsService.getMetrics(1, 5, 2026);

    expect(result.summary.recurring).toBe(3);
    expect(result.summary.oneOff).toBe(2);
  });
});