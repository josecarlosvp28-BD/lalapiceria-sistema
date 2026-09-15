import { describe, expect, it } from "vitest";
import { calcularMargen } from "../productos";

describe("calcularMargen", () => {
  it("calcula el margen porcentual correctamente", () => {
    // costo 1000 centavos, precio 2000 centavos -> 50% de margen
    expect(calcularMargen(1000, 2000)).toBe(50);
  });

  it("devuelve 0 si el precio es 0 (evita división entre cero)", () => {
    expect(calcularMargen(1000, 0)).toBe(0);
  });

  it("permite margen negativo cuando se vende bajo costo", () => {
    expect(calcularMargen(2000, 1000)).toBe(-100);
  });
});
