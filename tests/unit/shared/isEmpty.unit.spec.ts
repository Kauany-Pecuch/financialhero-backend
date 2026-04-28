import { describe, expect, it } from "vitest";
import { isEmpty } from "../../../src/shared/utils.js";

describe("isEmpty", () => {
  it("retorna true quando o array esta vazio", () => {
    expect(isEmpty([])).toBe(true);
  });

  it("retorna false quando o array tem itens", () => {
    expect(isEmpty(["valor"]))
      .toBe(false);
  });

  it("retorna true quando recebe undefined", () => {
    expect(isEmpty(undefined as unknown as string[])).toBe(true);
  });
});
