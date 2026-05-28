import type { DistanceCharacteristic } from "../model/types";

export interface Point { R: number; X: number; }

const deg = (d: number) => (d * Math.PI) / 180;

/** Вершины полигональной характеристики ступени ДЗ в плоскости R-X, по часовой стрелке. */
export function buildPolygon(c: DistanceCharacteristic): Point[] {
  const cosF = Math.cos(deg(c.FMC));
  const sinF = Math.sin(deg(c.FMC));

  // Верхняя точка оси ФМЧ — apex на высоте XU
  const apexDist = c.XU / (sinF || 1e-9);
  const apex: Point = { R: cosF * apexDist, X: c.XU };

  // Левая вершина: грань F3 от начала координат, пересечение с горизонталью X=XU
  const cosF3 = Math.cos(deg(c.F3));
  const sinF3 = Math.sin(deg(c.F3));
  const upperLeft: Point = { R: cosF3 * (c.XU / (sinF3 || 1e-9)), X: c.XU };

  // Правая верхняя вершина: скос AL через apex до R=RU
  const cosAL = Math.cos(deg(c.AL));
  const sinAL = Math.sin(deg(c.AL));
  const tSkew = (c.RU - apex.R) / (cosAL || 1e-9);
  const upperRight: Point = { R: c.RU, X: apex.X + sinAL * tSkew };

  const pts: Point[] = [{ R: 0, X: 0 }, upperLeft, apex, upperRight];

  // Вырез нагрузки: заменяет нижнюю правую вершину тремя вершинами
  if (c.RN1 > 0 && c.RU > c.RN1) {
    const tanFN1 = Math.tan(deg(c.FN1));
    const tanF2  = Math.tan(deg(c.F2));
    pts.push(
      { R: c.RU,  X: c.RU  * tanFN1 },  // начало выреза на правой границе R=RU
      { R: c.RN1, X: c.RN1 * tanFN1 },  // внутренний угол выреза
      { R: c.RN1, X: c.RN1 * tanF2  },  // выход на нижнюю грань F2 при R=RN1
    );
  } else {
    pts.push({ R: c.RU, X: c.RU * Math.tan(deg(c.F2)) });
  }

  // Смещение CM%: сдвиг всего полигона вдоль оси ФМЧ
  if (c.CM) {
    const dR = cosF * (c.CM / 100) * apexDist;
    const dX = sinF * (c.CM / 100) * apexDist;
    for (const p of pts) { p.R += dR; p.X += dX; }
  }

  return pts;
}

export function polygonPath(
  pts: Point[],
  toR: (r: number) => number,
  toX: (x: number) => number,
): string {
  if (!pts.length) return "";
  return pts.map((p, i) => `${i === 0 ? "M" : "L"} ${toR(p.R)} ${toX(p.X)}`).join(" ") + " Z";
}
