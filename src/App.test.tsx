import { describe, it, expect, beforeEach } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import App from "./App";
import { useStore } from "./model/store";
import { makeSeed } from "./data/seed";

describe("App рендерится из единой структуры данных", () => {
  beforeEach(() => useStore.setState({ project: makeSeed() }));

  it("строит SVG с полигонами характеристик для 5 ступеней", () => {
    const html = renderToStaticMarkup(<App />);
    expect(html).toContain("<svg");
    // 5 ступеней × (текущая + расчётная) = 10 path-полигонов минимум
    const paths = html.match(/<path /g) ?? [];
    expect(paths.length).toBeGreaterThanOrEqual(10);
    // вкладки обоих расчётов
    expect(html).toContain("ЛОЗОВАЯ-ШИРОКАЯ");
    expect(html).toContain("ШИРОКАЯ-НАХОДКА");
  });
});
