import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { parseDz } from "./parseDz";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

function load(name: string) {
  const buf = readFileSync(resolve(root, name));
  return parseDz(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength), name);
}

describe("parseDz", () => {
  it("Чувств.dz: число записей и замеры ZAB сверены с .xlsx", () => {
    const p = load("Чувств.dz");
    expect(p.header.deviceType).toBe("7SA522");
    expect(p.header.recordCount).toBe(6); // 6 блоков ЧУВСТВИ-НОСТЬ в .xlsx

    const z = p.conditions[0].phasors.ZAB!;
    expect(z.mag).toBeCloseTo(13.91, 1); // xlsx: ZAB=13.91
    expect(z.ang).toBeCloseTo(76.1, 0);  // xlsx: 76
    expect(p.conditions[0].measurement.R).toBeCloseTo(3.33, 1);
    expect(p.conditions[0].measurement.X).toBeCloseTo(13.51, 1);

    // вся последовательность модулей ZAB совпадает с протоколом в .xlsx
    const expected = [13.91, 14.55, 15.78, 17.48, 19.53, 21.84];
    p.conditions.forEach((c, i) => {
      expect(c.phasors.ZAB!.mag).toBeCloseTo(expected[i], 1);
    });
  });

  it("Отст.dz: число расчётных условий совпадает с протоколом", () => {
    const p = load("Отст.dz");
    expect(p.header.deviceType).toBe("7SA522");
    expect(p.header.recordCount).toBe(33);
  });

  it("каждое условие имеет конечные R/X", () => {
    for (const name of ["Чувств.dz", "Отст.dz"]) {
      const p = load(name);
      for (const c of p.conditions) {
        expect(Number.isFinite(c.measurement.R)).toBe(true);
        expect(Number.isFinite(c.measurement.X)).toBe(true);
      }
    }
  });
});
