// Построение полигональной характеристики ступени ДЗ в плоскости R-X.
//
// Полигон строится из уставок (как на листе «Концепт»):
//   XU  — реактивный охват (верхняя граница по X вдоль линии ФМЧ),
//   RU  — активный охват (правая граница по R),
//   FMC — угол максимальной чувствительности (наклон оси характеристики),
//   AL  — скос верхней грани,
//   F3  — наклон левой грани,
//   F2  — наклон нижней грани,
//   RN1/FN1 — вырез нагрузки (срез правого нижнего угла).
//
// Это корректная первая версия (шестигранник со срезом нагрузки); точный
// порядок вершин согласуется с пользователем.

import type { DistanceCharacteristic } from "../model/types";

export interface Point {
  R: number;
  X: number;
}

const deg = (d: number) => (d * Math.PI) / 180;

/** Пересечение прямой через точку p с направлением dir и прямой y=kx (через 0). */
function lineFromAngle(angleDeg: number): { dx: number; dy: number } {
  return { dx: Math.cos(deg(angleDeg)), dy: Math.sin(deg(angleDeg)) };
}

/** Возвращает вершины полигона характеристики по часовой стрелке. */
export function buildPolygon(c: DistanceCharacteristic): Point[] {
  const reach = lineFromAngle(c.FMC); // ось характеристики (ФМЧ)
  // верхняя точка охвата вдоль оси ФМЧ на высоте XU по X
  const topScale = c.XU / reach.dy;
  const apex: Point = { R: reach.dx * topScale, X: reach.dy * topScale };

  // правая граница по R
  const right = c.RU;
  // нижняя грань с наклоном F2 (через начало координат)
  const lower = lineFromAngle(c.F2);
  // левая грань с наклоном F3
  const left = lineFromAngle(c.F3);
  // скос верхней грани AL (через apex)
  const skew = lineFromAngle(c.AL);

  // Верхняя правая вершина: пересечение скоса (через apex) с вертикалью R=RU
  const tSkew = (right - apex.R) / (skew.dx || 1e-9);
  const upperRight: Point = { R: right, X: apex.X + skew.dy * tSkew };

  // Нижняя правая вершина: пересечение нижней грани с R=RU
  const tLower = right / (lower.dx || 1e-9);
  const lowerRight: Point = { R: right, X: lower.dy * tLower };

  // Левая нижняя/верхняя вершины по грани F3
  const tLeft = apex.X / (left.dy || 1e-9);
  const upperLeft: Point = { R: left.dx * tLeft, X: apex.X };

  let pts: Point[] = [
    { R: 0, X: 0 },
    upperLeft,
    apex,
    upperRight,
    lowerRight,
  ];

  // Вырез нагрузки: срез в правом нижнем секторе по RN1/FN1
  if (c.RN1 > 0) {
    const cut = lineFromAngle(c.FN1);
    const cutPoint: Point = { R: c.RN1, X: c.RN1 * (cut.dy / (cut.dx || 1e-9)) };
    pts = pts.filter((p) => !(p.R > c.RN1 && p.X < cutPoint.X));
    pts.splice(pts.length - 1, 0, cutPoint);
  }

  return pts;
}

export function polygonPath(pts: Point[], toR: (r: number) => number, toX: (x: number) => number): string {
  if (pts.length === 0) return "";
  return (
    pts.map((p, i) => `${i === 0 ? "M" : "L"} ${toR(p.R)} ${toX(p.X)}`).join(" ") + " Z"
  );
}
