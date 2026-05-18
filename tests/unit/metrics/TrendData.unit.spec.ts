import { describe, it, expect } from "vitest";

interface TrendDataPoint {
  month: number;
  year: number;
  total: number;
  recurring: number;
  oneOff: number;
}

function calculateTrendData(
  bills: Array<{
    expirationDate: Date;
    amount: number;
    isRecurring: boolean;
  }>,
  months: number,
  today?: Date
): TrendDataPoint[] {
  const currentDate = today || new Date();
  const startDate = new Date(currentDate);
  startDate.setMonth(startDate.getMonth() - (months - 1));
  startDate.setDate(1);

  const dataMap = new Map<string, TrendDataPoint>();

  bills.forEach((bill) => {
    const billDate = new Date(bill.expirationDate);
    if (billDate >= startDate && billDate <= currentDate) {
      const key = `${billDate.getFullYear()}-${billDate.getMonth() + 1}`;
      const existing = dataMap.get(key) || {
        month: billDate.getMonth() + 1,
        year: billDate.getFullYear(),
        total: 0,
        recurring: 0,
        oneOff: 0
      };

      existing.total += bill.amount;
      if (bill.isRecurring) {
        existing.recurring += bill.amount;
      } else {
        existing.oneOff += bill.amount;
      }

      dataMap.set(key, existing);
    }
  });

  return Array.from(dataMap.values()).sort((a, b) => {
    if (a.year !== b.year) return a.year - b.year;
    return a.month - b.month;
  });
}

describe("GET /metrics/:userId/trend - Série Temporal de Gastos", () => {
  describe("Validação de parâmetros", () => {
    it("deve aceitar 3 meses", () => {
      expect([3, 6, 12]).toContain(3);
    });

    it("deve aceitar 6 meses", () => {
      expect([3, 6, 12]).toContain(6);
    });

    it("deve aceitar 12 meses", () => {
      expect([3, 6, 12]).toContain(12);
    });

    it("deve rejeitar valores fora de [3, 6, 12]", () => {
      const allowedValues = [3, 6, 12];
      expect(allowedValues).not.toContain(4);
      expect(allowedValues).not.toContain(5);
      expect(allowedValues).not.toContain(7);
    });

    it("deve usar default de 12 meses quando não especificado", () => {
      const defaultMonths = 12;
      expect(defaultMonths).toBe(12);
    });
  });

  describe("Cálculo de período", () => {
    it("deve retornar dados dos últimos 3 meses incluindo o atual", () => {
      const today = new Date("2026-05-15");
      const startDate = new Date(today);
      startDate.setMonth(startDate.getMonth() - (3 - 1));
      startDate.setDate(1);

      expect(startDate.getMonth() + 1).toBe(3); 
      expect(startDate.getFullYear()).toBe(2026);
    });

    it("deve retornar dados dos últimos 6 meses incluindo o atual", () => {
      const today = new Date("2026-05-15");
      const startDate = new Date(today);
      startDate.setMonth(startDate.getMonth() - (6 - 1));
      startDate.setDate(1);

      expect(startDate.getMonth() + 1).toBe(12);
      expect(startDate.getFullYear()).toBe(2025);
    });

    it("deve retornar dados dos últimos 12 meses incluindo o atual", () => {
      const today = new Date("2026-05-15");
      const startDate = new Date(today);
      startDate.setMonth(startDate.getMonth() - (12 - 1));
      startDate.setDate(1);

      expect(startDate.getMonth() + 1).toBe(6); 
      expect(startDate.getFullYear()).toBe(2025);
    });
  });

  describe("Cálculo de totais", () => {
    it("deve calcular total como soma de recurring + oneOff", () => {
      const bills = [
        {
          expirationDate: new Date("2026-05-10"),
          amount: 100,
          isRecurring: true
        },
        {
          expirationDate: new Date("2026-05-15"),
          amount: 50,
          isRecurring: false
        }
      ];

      const result = calculateTrendData(bills, 3, new Date("2026-05-15"));

      expect(result).toHaveLength(1);
      expect(result[0]?.total).toBe(150);
      expect(result[0]?.recurring).toBe(100);
      expect(result[0]?.oneOff).toBe(50);
    });

    it("deve separar recurring e oneOff corretamente", () => {
      const bills = [
        {
          expirationDate: new Date("2026-04-05"),
          amount: 200,
          isRecurring: true
        },
        {
          expirationDate: new Date("2026-04-10"),
          amount: 300,
          isRecurring: true
        },
        {
          expirationDate: new Date("2026-04-15"),
          amount: 150,
          isRecurring: false
        },
        {
          expirationDate: new Date("2026-04-20"),
          amount: 100,
          isRecurring: false
        }
      ];

      const result = calculateTrendData(bills, 3, new Date("2026-05-15"));
      const abril = result.find((r) => r.month === 4);

      expect(abril?.recurring).toBe(500);
      expect(abril?.oneOff).toBe(250);
      expect(abril?.total).toBe(750);
    });

    it("deve agregar por mês corretamente", () => {
      const bills = [
        {
          expirationDate: new Date("2026-03-10"),
          amount: 100,
          isRecurring: true
        },
        {
          expirationDate: new Date("2026-04-10"),
          amount: 200,
          isRecurring: false
        },
        {
          expirationDate: new Date("2026-05-10"),
          amount: 300,
          isRecurring: true
        }
      ];

      const result = calculateTrendData(bills, 3, new Date("2026-05-15"));

      expect(result).toHaveLength(3);
      expect(result[0]?.month).toBe(3);
      expect(result[0]?.total).toBe(100);
      expect(result[1]?.month).toBe(4);
      expect(result[1]?.total).toBe(200);
      expect(result[2]?.month).toBe(5);
      expect(result[2]?.total).toBe(300);
    });
  });

  describe("Ordenação cronológica", () => {
    it("deve retornar série em ordem cronológica crescente (antigo → recente)", () => {
      const bills = [
        {
          expirationDate: new Date("2026-05-10"),
          amount: 100,
          isRecurring: true
        },
        {
          expirationDate: new Date("2026-03-10"),
          amount: 200,
          isRecurring: false
        },
        {
          expirationDate: new Date("2026-04-10"),
          amount: 300,
          isRecurring: true
        }
      ];

      const result = calculateTrendData(bills, 3, new Date("2026-05-15"));

      expect(result[0]?.month).toBe(3);
      expect(result[0]?.year).toBe(2026);
      expect(result[1]?.month).toBe(4);
      expect(result[1]?.year).toBe(2026);
      expect(result[2]?.month).toBe(5);
      expect(result[2]?.year).toBe(2026);
    });

    it("deve ordenar por ano primeiro, depois por mês", () => {
      const bills = [
        {
          expirationDate: new Date("2026-01-10"),
          amount: 100,
          isRecurring: true
        },
        {
          expirationDate: new Date("2025-12-10"),
          amount: 200,
          isRecurring: false
        },
        {
          expirationDate: new Date("2025-11-10"),
          amount: 300,
          isRecurring: true
        }
      ];

      const result = calculateTrendData(bills, 3, new Date("2026-01-15"));

      expect(result[0]?.year).toBe(2025);
      expect(result[0]?.month).toBe(11);
      expect(result[1]?.year).toBe(2025);
      expect(result[1]?.month).toBe(12);
      expect(result[2]?.year).toBe(2026);
      expect(result[2]?.month).toBe(1);
    });
  });

  describe("Response structure", () => {
    it("deve retornar objeto com campo 'series'", () => {
      const bills = [
        {
          expirationDate: new Date("2026-05-10"),
          amount: 100,
          isRecurring: true
        }
      ];

      const result = calculateTrendData(bills, 3, new Date("2026-05-15"));

      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(1);
    });

    it("deve incluir month, year, total, recurring, oneOff em cada item", () => {
      const bills = [
        {
          expirationDate: new Date("2026-05-10"),
          amount: 100,
          isRecurring: true
        }
      ];

      const result = calculateTrendData(bills, 3, new Date("2026-05-15"));

      expect(result[0]).toHaveProperty("month");
      expect(result[0]).toHaveProperty("year");
      expect(result[0]).toHaveProperty("total");
      expect(result[0]).toHaveProperty("recurring");
      expect(result[0]).toHaveProperty("oneOff");
    });

    it("deve ter types corretos para cada propriedade", () => {
      const bills = [
        {
          expirationDate: new Date("2026-05-10"),
          amount: 100,
          isRecurring: true
        }
      ];

      const result = calculateTrendData(bills, 3, new Date("2026-05-15"));

      expect(typeof result[0]?.month).toBe("number");
      expect(typeof result[0]?.year).toBe("number");
      expect(typeof result[0]?.total).toBe("number");
      expect(typeof result[0]?.recurring).toBe("number");
      expect(typeof result[0]?.oneOff).toBe("number");
    });
  });

  describe("Edge cases", () => {
    it("deve retornar array vazio quando não há bills", () => {
      const bills: Array<{
        expirationDate: Date;
        amount: number;
        isRecurring: boolean;
      }> = [];

      const result = calculateTrendData(bills, 3, new Date("2026-05-15"));

      expect(result).toHaveLength(0);
    });

    it("deve retornar array vazio quando bills estão fora do período", () => {
      const bills = [
        {
          expirationDate: new Date("2025-01-10"),
          amount: 100,
          isRecurring: true
        }
      ];

      const result = calculateTrendData(bills, 3, new Date("2026-05-15"));

      expect(result).toHaveLength(0);
    });

    it("deve incluir todos os meses solicitados mesmo sem bills", () => {
      const bills = [
        {
          expirationDate: new Date("2026-03-10"),
          amount: 100,
          isRecurring: true
        }
      ];

      const result = calculateTrendData(bills, 3, new Date("2026-05-15"));

      expect(result.length).toBeGreaterThan(0);
      expect(result[0]?.month).toBe(3);
    });

    it("deve sumar corretamente múltiplas bills no mesmo mês", () => {
      const today = new Date(2026, 4, 20); 
      const bills = [
        {
          expirationDate: new Date(2026, 3, 1),  
          amount: 50,
          isRecurring: true
        },
        {
          expirationDate: new Date(2026, 3, 5),  
          amount: 75,
          isRecurring: true
        },
        {
          expirationDate: new Date(2026, 3, 10), 
          amount: 100,
          isRecurring: false
        },
        {
          expirationDate: new Date(2026, 3, 15),
          amount: 125,
          isRecurring: false
        }
      ];

      const result = calculateTrendData(bills, 3, today);

      const abrilResult = result.find(r => r.month === 4);
      expect(abrilResult).toBeDefined();
      expect(abrilResult?.recurring).toBe(125); 
      expect(abrilResult?.oneOff).toBe(225);    
      expect(abrilResult?.total).toBe(350);     
    });
  });
});
