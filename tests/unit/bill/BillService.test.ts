import { vi } from "vitest";


vi.mock("../../../src/db.ts", () => ({
  default: {}
}));


vi.mock("../../../src/models/Bill.js", () => ({
  Bill: {
    findOne: vi.fn()
  }
}));


import { describe, it, expect, beforeEach } from "vitest";
import BillService from "../../../src/services/BillService.js";
import { Bill } from "../../../src/models/Bill.js";

describe("BillService - getBill", () => {
  let billService: BillService;

 
  const makeBill = (override = {}) => ({
    id: "1",
    name: "Conta",
    amount: 100,
    type: "GENERIC",
    description: "Descrição",
    expirationDate: new Date(),
    userId: "123",
    ...override
  });

  beforeEach(() => {
    billService = new BillService();
    vi.clearAllMocks();
  });

  it("deve retornar uma conta quando existe", async () => {
    const mockBill = makeBill();

    vi.mocked(Bill.findOne).mockResolvedValue(mockBill as any);

    const result = await billService.getBill("123", "1");

    expect(result).toEqual(mockBill);
    expect(Bill.findOne).toHaveBeenCalledTimes(1);
    expect(Bill.findOne).toHaveBeenCalledWith({
      where: {
        id: "1",
        userId: "123"
      }
    });
  });

  it("deve lançar erro quando a conta não existe", async () => {
    vi.mocked(Bill.findOne).mockResolvedValue(null);

    await expect(
      billService.getBill("123", "999")
    ).rejects.toThrow("Conta não encontrada");

    expect(Bill.findOne).toHaveBeenCalledTimes(1);
  });

  it("deve chamar o banco com os parâmetros corretos", async () => {
    const mockBill = makeBill({ id: "2", userId: "456" });

    vi.mocked(Bill.findOne).mockResolvedValue(mockBill as any);

    await billService.getBill("456", "2");

    expect(Bill.findOne).toHaveBeenCalledWith({
      where: {
        id: "2",
        userId: "456"
      }
    });
  });

  it("deve retornar os dados corretamente", async () => {
    const mockBill = makeBill({
      id: "3",
      amount: 99.99,
      userId: "789"
    });

    vi.mocked(Bill.findOne).mockResolvedValue(mockBill as any);

    const result = await billService.getBill("789", "3");

    expect(result.id).toBe("3");
    expect(result.amount).toBe(99.99);
    expect(result.userId).toBe("789");
  });
});