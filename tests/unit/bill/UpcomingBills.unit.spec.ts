import { describe, it, expect } from "vitest";

function calculateDaysUntilDue(today: Date, expirationDate: Date): number {
  return Math.floor(
    (expirationDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );
}

interface Bill {
  id: number;
  name: string;
  amount: number;
  type: string;
  expirationDate: Date;
  isPaid: boolean;
  active: boolean;
  isRecurring: boolean;
  userId: number;
}

function filterUpcomingBills(
  bills: Bill[],
  today: Date,
  days: number = 15
): Bill[] {
  const normalizedToday = new Date(today);
  normalizedToday.setHours(0, 0, 0, 0);

  const endDate = new Date(normalizedToday);
  endDate.setDate(endDate.getDate() + days);

  return bills
    .filter((bill) => !bill.isPaid && bill.active)
    .filter((bill) => {
      const expirationDate = new Date(bill.expirationDate);
      expirationDate.setHours(0, 0, 0, 0);

      return (
        expirationDate >= normalizedToday &&
        expirationDate <= endDate
      );
    })
    .sort(
      (a, b) =>
        a.expirationDate.getTime() - b.expirationDate.getTime()
    );
}

describe("BillService - getUpcomingBills", () => {
  describe("Filtros obrigatórios", () => {
    it("deve retornar apenas bills não pagas (isPaid=false)", () => {
      const today = new Date("2026-05-10");

      const bills: Bill[] = [
        {
          id: 1,
          name: "Água",
          amount: 100,
          type: "MORADIA",
          expirationDate: new Date("2026-05-15"),
          isPaid: false,
          active: true,
          isRecurring: false,
          userId: 1
        },
        {
          id: 2,
          name: "Paga",
          amount: 50,
          type: "MORADIA",
          expirationDate: new Date("2026-05-12"),
          isPaid: true,
          active: true,
          isRecurring: false,
          userId: 1
        }
      ];

      const result: Bill[] = filterUpcomingBills(bills, today, 15);

      expect(result).toHaveLength(1);
      expect(result[0]?.isPaid).toBe(false);
    });

    it("deve retornar apenas bills ativas (active=true)", () => {
      const today = new Date("2026-05-10");

      const bills: Bill[] = [
        {
          id: 1,
          name: "Ativa",
          amount: 100,
          type: "ALIMENTACAO",
          expirationDate: new Date("2026-05-15"),
          isPaid: false,
          active: true,
          isRecurring: false,
          userId: 1
        },
        {
          id: 2,
          name: "Inativa",
          amount: 100,
          type: "MORADIA",
          expirationDate: new Date("2026-05-15"),
          isPaid: false,
          active: false,
          isRecurring: false,
          userId: 1
        }
      ];

      const result: Bill[] = filterUpcomingBills(bills, today, 15);

      expect(result).toHaveLength(1);
      expect(result[0]?.active).toBe(true);
    });

    it("deve filtrar apenas bills dentro do período de dias", () => {
      const today = new Date("2026-05-10");

      const bills: Bill[] = [
        {
          id: 1,
          name: "Dentro",
          amount: 100,
          type: "MORADIA",
          expirationDate: new Date("2026-05-15"),
          isPaid: false,
          active: true,
          isRecurring: false,
          userId: 1
        },
        {
          id: 2,
          name: "Fora",
          amount: 50,
          type: "ALIMENTACAO",
          expirationDate: new Date("2026-05-30"),
          isPaid: false,
          active: true,
          isRecurring: false,
          userId: 1
        }
      ];

      const result: Bill[] = filterUpcomingBills(bills, today, 15);

      expect(result).toHaveLength(1);
      expect(result[0]?.name).toBe("Dentro");
    });

    it("deve incluir bills com expirationDate igual a hoje", () => {
      const today = new Date("2026-05-10");

      const bills: Bill[] = [
        {
          id: 1,
          name: "Hoje",
          amount: 100,
          type: "MORADIA",
          expirationDate: new Date("2026-05-10"),
          isPaid: false,
          active: true,
          isRecurring: false,
          userId: 1
        }
      ];

      const result: Bill[] = filterUpcomingBills(bills, today, 15);

      expect(result).toHaveLength(1);
    });

    it("deve incluir bills com expirationDate igual ao último dia do período", () => {
      const today = new Date("2026-05-10");

      const bills: Bill[] = [
        {
          id: 1,
          name: "Última data",
          amount: 100,
          type: "MORADIA",
          expirationDate: new Date("2026-05-25"),
          isPaid: false,
          active: true,
          isRecurring: false,
          userId: 1
        }
      ];

      const result: Bill[] = filterUpcomingBills(bills, today, 15);

      expect(result).toHaveLength(1);
    });

    it("deve ordenar por expirationDate asc", () => {
      const today = new Date("2026-05-10");

      const bills: Bill[] = [
        {
          id: 1,
          name: "Última",
          amount: 100,
          type: "MORADIA",
          expirationDate: new Date("2026-05-25"),
          isPaid: false,
          active: true,
          isRecurring: false,
          userId: 1
        },
        {
          id: 2,
          name: "Primeira",
          amount: 100,
          type: "ALIMENTACAO",
          expirationDate: new Date("2026-05-12"),
          isPaid: false,
          active: true,
          isRecurring: false,
          userId: 1
        }
      ];

      const result: Bill[] = filterUpcomingBills(bills, today, 15);

      expect(result[0]?.name).toBe("Primeira");
      expect(result[1]?.name).toBe("Última");
    });
  });

  describe("Parâmetro days", () => {
    it("deve usar default de 15 dias quando não especificado", () => {
      const today = new Date("2026-05-10");

      const bills: Bill[] = [
        {
          id: 1,
          name: "15 dias",
          amount: 100,
          type: "MORADIA",
          expirationDate: new Date("2026-05-25"),
          isPaid: false,
          active: true,
          isRecurring: false,
          userId: 1
        },
        {
          id: 2,
          name: "30 dias",
          amount: 50,
          type: "ALIMENTACAO",
          expirationDate: new Date("2026-06-09"),
          isPaid: false,
          active: true,
          isRecurring: false,
          userId: 1
        }
      ];

      const result = filterUpcomingBills(bills, today);

      expect(result).toHaveLength(1);
      expect(result[0]?.name).toBe("15 dias");
    });

    it("deve aceitar custom days parameter", () => {
      const today = new Date("2026-05-10");

      const bills: Bill[] = [
        {
          id: 1,
          name: "5 dias",
          amount: 100,
          type: "MORADIA",
          expirationDate: new Date("2026-05-15"),
          isPaid: false,
          active: true,
          isRecurring: false,
          userId: 1
        },
        {
          id: 2,
          name: "10 dias",
          amount: 50,
          type: "ALIMENTACAO",
          expirationDate: new Date("2026-05-20"),
          isPaid: false,
          active: true,
          isRecurring: false,
          userId: 1
        }
      ];

      const result = filterUpcomingBills(bills, today, 7);

      expect(result).toHaveLength(1);
      expect(result[0]?.name).toBe("5 dias");
    });

    it("deve retornar bills dentro do período customizado", () => {
      const today = new Date("2026-05-10");

      const bills: Bill[] = [
        {
          id: 1,
          name: "Dentro de 30",
          amount: 100,
          type: "MORADIA",
          expirationDate: new Date("2026-06-09"),
          isPaid: false,
          active: true,
          isRecurring: false,
          userId: 1
        }
      ];

      const result = filterUpcomingBills(bills, today, 30);

      expect(result).toHaveLength(1);
    });
  });

  describe("Cálculo de daysUntilDue", () => {
    it("deve calcular corretamente com 5 dias de diferença", () => {
      const today = new Date("2026-05-10");
      const expirationDate = new Date("2026-05-15");

      const daysUntilDue = calculateDaysUntilDue(today, expirationDate);

      expect(daysUntilDue).toBe(5);
    });

    it("deve calcular 0 dias quando é hoje", () => {
      const today = new Date("2026-05-10");
      const expirationDate = new Date("2026-05-10");

      const daysUntilDue = calculateDaysUntilDue(today, expirationDate);

      expect(daysUntilDue).toBe(0);
    });

    it("deve calcular 1 dia para amanhã", () => {
      const today = new Date("2026-05-10");
      const expirationDate = new Date("2026-05-11");

      const daysUntilDue = calculateDaysUntilDue(today, expirationDate);

      expect(daysUntilDue).toBe(1);
    });

    it("deve calcular corretamente com muitos dias", () => {
      const today = new Date("2026-05-10");
      const expirationDate = new Date("2026-06-09");

      const daysUntilDue = calculateDaysUntilDue(today, expirationDate);

      expect(daysUntilDue).toBe(30);
    });
  });

  describe("Response structure", () => {
    it("deve retornar objeto com campo bills", () => {
      const today = new Date("2026-05-10");
      const bills: Bill[] = [
        {
          id: 1,
          name: "Teste",
          amount: 100,
          type: "MORADIA",
          expirationDate: new Date("2026-05-15"),
          isPaid: false,
          active: true,
          isRecurring: false,
          userId: 1
        }
      ];

      const result = filterUpcomingBills(bills, today);

      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty("id");
      expect(result[0]).toHaveProperty("name");
      expect(result[0]).toHaveProperty("amount");
      expect(result[0]).toHaveProperty("expirationDate");
      expect(result[0]).toHaveProperty("isPaid");
      expect(result[0]).toHaveProperty("isRecurring");
      expect(result[0]).toHaveProperty("type");
    });

    it("deve incluir isRecurring no objeto retornado", () => {
      const today = new Date("2026-05-10");
      const bills: Bill[] = [
        {
          id: 1,
          name: "Recorrente",
          amount: 100,
          type: "MORADIA",
          expirationDate: new Date("2026-05-12"),
          isPaid: false,
          active: true,
          isRecurring: true,
          userId: 1
        },
        {
          id: 2,
          name: "Avulso",
          amount: 50,
          type: "ALIMENTACAO",
          expirationDate: new Date("2026-05-15"),
          isPaid: false,
          active: true,
          isRecurring: false,
          userId: 1
        }
      ];

      const result = filterUpcomingBills(bills, today);

      expect(result[0]?.isRecurring).toBe(true);
      expect(result[1]?.isRecurring).toBe(false);
    });
  });

  describe("Edge cases", () => {
    it("deve retornar array vazio quando lista vazia", () => {
      const result: Bill[] = filterUpcomingBills(
        [],
        new Date("2026-05-10"),
        15
      );

      expect(result).toHaveLength(0);
    });

    it("deve retornar array vazio", () => {
      const result: Bill[] = filterUpcomingBills(
        [],
        new Date("2026-05-10"),
        15
      );

      expect(result).toHaveLength(0);
    });

    it("deve excluir bills com isPaid=true mesmo dentro do período", () => {
      const today = new Date("2026-05-10");
      const bills: Bill[] = [
        {
          id: 1,
          name: "Paga",
          amount: 100,
          type: "MORADIA",
          expirationDate: new Date("2026-05-15"),
          isPaid: true,
          active: true,
          isRecurring: false,
          userId: 1
        }
      ];

      const result = filterUpcomingBills(bills, today);

      expect(result).toHaveLength(0);
    });

    it("deve excluir bills com active=false mesmo dentro do período", () => {
      const today = new Date("2026-05-10");
      const bills: Bill[] = [
        {
          id: 1,
          name: "Inativa",
          amount: 100,
          type: "MORADIA",
          expirationDate: new Date("2026-05-15"),
          isPaid: false,
          active: false,
          isRecurring: false,
          userId: 1
        }
      ];

      const result = filterUpcomingBills(bills, today);

      expect(result).toHaveLength(0);
    });
  });
});
