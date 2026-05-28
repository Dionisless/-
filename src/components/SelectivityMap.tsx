import { useMemo, useState } from "react";
import { scaleLinear } from "d3-scale";
import { useStore, selectActive } from "../model/store";

const WIDTH = 620;
const HEIGHT = 420;
const M = { top: 18, right: 18, bottom: 36, left: 50 };

const STAGE_COLORS = ["#1f77b4", "#2ca02c", "#ff7f0e", "#9467bd", "#8c564b"];

interface MapPoint {
  Rper: number;
  Z: number;
  label: string;
  group: "Чувствительность" | "Отстройка";
  color: string;
}

const deg = (d: number) => (d * Math.PI) / 180;
const stageReach = (XU: number, FMC: number) => XU / (Math.sin(deg(FMC)) || 1e-9);

export function SelectivityMap() {
  const calc = useStore(selectActive);
  const [hover, setHover] = useState<MapPoint | null>(null);

  const points = useMemo<MapPoint[]>(() => {
    const mk = (
      rows: typeof calc.sensitivity,
      group: MapPoint["group"],
      color: string,
    ): MapPoint[] =>
      rows.map((r) => ({
        Rper: r.Rper,
        Z: Math.hypot(r.X, r.R),
        label: r.name,
        group,
        color,
      }));
    return [
      ...mk(calc.sensitivity, "Чувствительность", "#2ca02c"),
      ...mk(calc.detuning, "Отстройка", "#d6602f"),
    ];
  }, [calc.sensitivity, calc.detuning]);

  const lines = useMemo(
    () =>
      calc.stages.map((st, i) => ({
        index: st.index,
        Z: stageReach(st.current.XU, st.current.FMC),
        color: STAGE_COLORS[i % STAGE_COLORS.length],
      })),
    [calc.stages],
  );

  const { rperMax, zMax } = useMemo(() => {
    let rper = 0, z = 0;
    for (const p of points) { rper = Math.max(rper, p.Rper); z = Math.max(z, p.Z); }
    for (const l of lines) z = Math.max(z, l.Z);
    return { rperMax: (rper || 10) * 1.15, zMax: (z || 10) * 1.15 };
  }, [points, lines]);

  const sR = scaleLinear().domain([0, rperMax]).range([M.left, WIDTH - M.right]);
  const sZ = scaleLinear().domain([0, zMax]).range([HEIGHT - M.bottom, M.top]);
  const rTicks = sR.ticks(7);
  const zTicks = sZ.ticks(7);

  return (
    <div className="plot">
      <svg width={WIDTH} height={HEIGHT}>
        {rTicks.map((t) => (
          <line key={`rg${t}`} x1={sR(t)} x2={sR(t)} y1={M.top} y2={HEIGHT - M.bottom} stroke="#eee" />
        ))}
        {zTicks.map((t) => (
          <line key={`zg${t}`} x1={M.left} x2={WIDTH - M.right} y1={sZ(t)} y2={sZ(t)} stroke="#eee" />
        ))}

        <line x1={M.left} x2={WIDTH - M.right} y1={sZ(0)} y2={sZ(0)} stroke="#444" />
        <line x1={sR(0)} x2={sR(0)} y1={M.top} y2={HEIGHT - M.bottom} stroke="#444" />

        {rTicks.map((t) => (
          <text key={`rt${t}`} x={sR(t)} y={HEIGHT - M.bottom + 14} fontSize={10} textAnchor="middle" fill="#666">{t}</text>
        ))}
        {zTicks.map((t) => (
          <text key={`zt${t}`} x={M.left - 6} y={sZ(t) + 3} fontSize={10} textAnchor="end" fill="#666">{t}</text>
        ))}
        <text x={WIDTH - M.right} y={HEIGHT - M.bottom + 26} fontSize={11} textAnchor="end" fill="#555">Rпер, Ом</text>
        <text x={sR(0) + 6} y={M.top + 4} fontSize={11} fill="#555">Z, Ом</text>

        {/* уставки ступеней — горизонтальные линии охвата */}
        {lines.map((l) => (
          <g key={`line${l.index}`}>
            <line
              x1={M.left} x2={WIDTH - M.right}
              y1={sZ(l.Z)} y2={sZ(l.Z)}
              stroke={l.color} strokeWidth={1.5} strokeDasharray="6 3"
            />
            <text x={WIDTH - M.right - 2} y={sZ(l.Z) - 3} fontSize={10} textAnchor="end" fill={l.color}>
              {l.index} ст
            </text>
          </g>
        ))}

        {/* точки проверок: чувствительность / отстройка */}
        {points.map((p, i) => (
          <g key={`pt${i}`}>
            <circle
              cx={sR(p.Rper)} cy={sZ(p.Z)} r={5}
              fill={p.color} stroke="#fff" strokeWidth={1}
              onMouseEnter={() => setHover(p)}
              onMouseLeave={() => setHover(null)}
              style={{ cursor: "crosshair" }}
            />
          </g>
        ))}
      </svg>

      {hover && (
        <div className="tooltip">
          <b>{hover.label}</b> · {hover.group}<br />
          Rпер = {hover.Rper.toFixed(2)} Ом<br />
          Z = {hover.Z.toFixed(2)} Ом
        </div>
      )}

      <div className="legend">
        <span className="legend-item"><i style={{ background: "#2ca02c" }} /> чувствительность</span>
        <span className="legend-item"><i style={{ background: "#d6602f" }} /> отстройка</span>
        <span className="legend-sep" />
        <span className="legend-note">▪ пунктир — охват ступени Z = XУ / sin ФМЧ</span>
      </div>
    </div>
  );
}
