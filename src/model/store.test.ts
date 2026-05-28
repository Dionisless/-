import { describe, it, expect, beforeEach } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { useStore, selectActive } from "./store";
import { makeSeed } from "../data/seed";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
function dzBuffer(name: string): ArrayBuffer {
  const buf = readFileSync(resolve(root, name));
  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
}

describe("store: единый поток данных", () => {
  beforeEach(() => {
    useStore.setState({ project: makeSeed() });
  });

  it("сид содержит несколько расчётов и активный по умолчанию", () => {
    const { project } = useStore.getState();
    expect(project.calculations.length).toBe(2);
    expect(project.activeId).toBe(project.calculations[0].id);
    expect(selectActive(useStore.getState()).stages.length).toBe(5);
  });

  it("переключение и добавление вкладок", () => {
    const ids = useStore.getState().project.calculations.map((c) => c.id);
    useStore.getState().setActive(ids[1]);
    expect(useStore.getState().project.activeId).toBe(ids[1]);
    useStore.getState().addCalculation();
    expect(useStore.getState().project.calculations.length).toBe(3);
  });

  it("импорт .dz добавляет замеры в активный расчёт", () => {
    useStore.getState().importDz(dzBuffer("Чувств.dz"), "Чувств.dz");
    const calc = selectActive(useStore.getState());
    expect(calc.protocols.length).toBe(1);
    expect(calc.protocols[0].conditions.length).toBe(6);
    // импорт идёт только в активную вкладку
    const other = useStore.getState().project.calculations[1];
    expect(other.protocols.length).toBe(0);
  });

  it("тоггл видимости и смена цвета замера", () => {
    useStore.getState().importDz(dzBuffer("Чувств.dz"), "Чувств.dz");
    const { id: pid } = selectActive(useStore.getState()).protocols[0];
    const cid = selectActive(useStore.getState()).protocols[0].conditions[0].id;
    useStore.getState().toggleConditionVisible(pid, cid);
    expect(selectActive(useStore.getState()).protocols[0].conditions[0].visible).toBe(false);
    useStore.getState().setConditionColor(pid, cid, "#123456");
    expect(selectActive(useStore.getState()).protocols[0].conditions[0].color).toBe("#123456");
  });

  it("правка уставки меняет только активный расчёт", () => {
    useStore.getState().updateChar(1, "current", "XU", 99);
    expect(selectActive(useStore.getState()).stages[0].current.XU).toBe(99);
    expect(useStore.getState().project.calculations[1].stages[0].current.XU).toBe(10);
  });
});
