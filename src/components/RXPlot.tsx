import { useMemo, useState } from "react";
import { scaleLinear } from "d3-scale";
import { useStore, selectActive } from "../model/store";
import { buildPolygon, polygonPath } from "../geometry/characteristic";
import type { CalcCondition } from "../model/types";

const WIDTH = 640;
const HEIGHT = 560;
const M = { top: 20, right: 20, bottom: 36, left: 44 };

const STAGE_COLORS = ["#1f77b4", "#2ca02c", "#ff7f0e", "#9467bd", "#8c564b"];

export function RXPlot() {
  const calc = useStore(selectActive);
  const [hover, setHover] = useState<CalcCondition | null>(null);

  const points = useMemo(
    () =>
      calc.protocols.flatMap((p) =>
        p.conditions
          .filter((c) => c.visible)
          .map((c) => ({ ...c, protocolId: p.id }))
      ),
    [calc.protocols]
  );

  const { rMax, xMax } = useMemo(() => {
    let r = 0;
    let x = 0;
    for (const st of calc.stages) {
      r = Math.max(r, st.current.RU, st.calculated.RU);
      x = Math.max(x, st.current.XU, st.calculated.XU);
    }
    for (const p of points) {
      r = Math.max(r, Math.abs(p.measurement.R));
      x = Math.max(x, Math.abs(p.measurement.X));
    }
    return { rMax: r * 1.15 || 10, xMax: x * 1.15 || 10 };
  }, [calc.stages, points]);

  const sR = scaleLinear().domain([-rMax * 0.25, rMax]).range([M.left, WIDTH - M.right]);
  const sX = scaleLinear().domain([-xMax * 0.25, xMax]).range([HEIGHT - M.bottom, M.top]);

  const rTicks = sR.ticks(8);
  const xTicks = sX.ticks(8);

  return (
    <div className="plot">
      <svg width={WIDTH} height={HEIGHT}>
        {/* сетка */}
        {rTicks.map((t) => (
          <line key={`rg${t}`} x1={sR(t)} x2={sR(t)} y1={M.top} y2={HEIGHT - M.bottom} stroke="#eee" />
        ))}
        {xTicks.map((t) => (
          <line key={`xg${t}`} x1={M.left} x2={WIDTH - M.right} y1={sX(t)} y2={sX(t)} stroke="#eee" />
        ))}

        {/* оси */}
        <line x1={M.left} x2={WIDTH - M.right} y1={sX(0)} y2={sX(0)} stroke="#333" />
        <line x1={sR(0)} x2={sR(0)} y1={M.top} y2={HEIGHT - M.bottom} stroke="#333" />
        {rTicks.map((t) => (
          <text key={`rt${t}`} x={sR(t)} y={HEIGHT - M.bottom + 14} fontSize={10} textAnchor="middle" fill="#666">{t}</text>
        ))}
        {xTicks.map((t) => (
          <text key={`xt${t}`} x={M.left - 6} y={sX(t) + 3} fontSize={10} textAnchor="end" fill="#666">{t}</text>
        ))}
        <text x={WIDTH - M.right} y={sX(0) - 6} fontSize={11} textAnchor="end" fill="#333">R, Ом</text>
        <text x={sR(0) + 6} y={M.top + 4} fontSize={11} fill="#333">X, Ом</text>

        {/* характеристики ступеней: текущие (сплошные) и расчётные (пунктир) */}
        {calc.stages.map((st, i) => {
          const color = STAGE_COLORS[i % STAGE_COLORS.length];
          const cur = polygonPath(buildPolygon(st.current), sR, sX);
          const calcd = polygonPath(buildPolygon(st.calculated), sR, sX);
          return (
            <g key={st.index}>
              <path d={cur} fill={color} fillOpacity={0.05} stroke={color} strokeWidth={1.5} />
              <path d={calcd} fill="none" stroke={color} strokeWidth={1} strokeDasharray="4 3" opacity={0.7} />
            </g>
          );
        })}

        {/* замеры из протоколов */}
        {points.map((c) => (
          <circle
            key={c.id}
            cx={sR(c.measurement.R)}
            cy={sX(c.measurement.X)}
            r={4}
            fill={c.color}
            stroke="#fff"
            strokeWidth={1}
            onMouseEnter={() => setHover(c)}
            onMouseLeave={() => setHover(null)}
          />
        ))}
      </svg>
      {hover && (
        <div className="tooltip">
          <b>{hover.label}</b> {hover.kind}<br />
          Z = {hover.measurement.Z.toFixed(2)} ∠ {hover.measurement.phi.toFixed(1)}°<br />
          R = {hover.measurement.R.toFixed(2)}, X = {hover.measurement.X.toFixed(2)}
        </div>
      )}
      <div className="legend">
        {calc.stages.map((st, i) => (
          <span key={st.index} className="legend-item">
            <i style={{ background: STAGE_COLORS[i % STAGE_COLORS.length] }} /> {st.index} ст
          </span>
        ))}
        <span className="legend-note">сплошная — текущая, пунктир — расчётная</span>
      </div>
    </div>
  );
}
