import { useMemo, useState } from "react";
import { scaleLinear } from "d3-scale";
import { useStore, selectActive, selectFocused } from "../model/store";
import { buildPolygon, polygonPath } from "../geometry/characteristic";
import type { CalcCondition } from "../model/types";

const WIDTH = 620;
const HEIGHT = 540;
const M = { top: 20, right: 20, bottom: 36, left: 46 };

const STAGE_COLORS = ["#1f77b4", "#2ca02c", "#ff7f0e", "#9467bd", "#8c564b"];

export function RXPlot() {
  const calc = useStore(selectActive);
  const focusedIdx = useStore(selectFocused);
  const [hover, setHover] = useState<CalcCondition | null>(null);

  const focusedStage = calc.stages.find((s) => s.index === focusedIdx);
  const focusedSelected = new Set(focusedStage?.selectedConditionIds ?? []);

  const points = useMemo(
    () =>
      calc.protocols.flatMap((p) =>
        p.conditions.filter((c) => c.visible).map((c) => ({ ...c, protocolId: p.id }))
      ),
    [calc.protocols]
  );

  const loadPoints = calc.loadDetuning.regimes;

  const { rMin, rMax, xMin, xMax } = useMemo(() => {
    let rMax = 0, xMax = 0, rMin = 0, xMin = -5;
    for (const st of calc.stages) {
      rMax = Math.max(rMax, st.current.RU, st.calculated.RU);
      xMax = Math.max(xMax, st.current.XU, st.calculated.XU);
    }
    for (const p of points) {
      rMax = Math.max(rMax, Math.abs(p.measurement.R));
      xMax = Math.max(xMax, Math.abs(p.measurement.X));
    }
    for (const p of loadPoints) {
      rMax = Math.max(rMax, Math.abs(p.R));
      xMax = Math.max(xMax, Math.abs(p.X));
    }
    rMax = (rMax || 10) * 1.15;
    xMax = (xMax || 10) * 1.15;
    return { rMin: rMin - rMax * 0.25, rMax, xMin, xMax };
  }, [calc.stages, points, loadPoints]);

  const sR = scaleLinear().domain([rMin, rMax]).range([M.left, WIDTH - M.right]);
  const sX = scaleLinear().domain([xMin, xMax]).range([HEIGHT - M.bottom, M.top]);

  const rTicks = sR.ticks(7);
  const xTicks = sX.ticks(7);

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
        <line x1={M.left} x2={WIDTH - M.right} y1={sX(0)} y2={sX(0)} stroke="#444" />
        <line x1={sR(0)} x2={sR(0)} y1={M.top} y2={HEIGHT - M.bottom} stroke="#444" />

        {rTicks.map((t) => (
          <text key={`rt${t}`} x={sR(t)} y={HEIGHT - M.bottom + 14} fontSize={10} textAnchor="middle" fill="#666">{t}</text>
        ))}
        {xTicks.map((t) => (
          <text key={`xt${t}`} x={M.left - 6} y={sX(t) + 3} fontSize={10} textAnchor="end" fill="#666">{t}</text>
        ))}
        <text x={WIDTH - M.right} y={sX(0) - 6} fontSize={11} textAnchor="end" fill="#555">R, Ом</text>
        <text x={sR(0) + 6} y={M.top + 4} fontSize={11} fill="#555">X, Ом</text>

        {/* характеристики ступеней */}
        {calc.stages.map((st, i) => {
          const color = STAGE_COLORS[i % STAGE_COLORS.length];
          const isFocused = st.index === focusedIdx;
          const cur  = polygonPath(buildPolygon(st.current),     sR, sX);
          const calcd = polygonPath(buildPolygon(st.calculated), sR, sX);

          // Линия ФМЧ (ось максимальной чувствительности) для выбранной ступени
          const fmcLine = isFocused ? (() => {
            const rad = (st.current.FMC * Math.PI) / 180;
            const cosF = Math.cos(rad), sinF = Math.sin(rad);
            const tR = cosF > 0 ? (rMax - 0) / cosF : Infinity;
            const tX = sinF > 0 ? (xMax - 0) / sinF : Infinity;
            const t = Math.min(tR, tX) * 1.05;
            return { x2: sR(cosF * t), y2: sX(sinF * t) };
          })() : null;

          return (
            <g key={st.index}>
              {fmcLine && (
                <line
                  x1={sR(0)} y1={sX(0)}
                  x2={fmcLine.x2} y2={fmcLine.y2}
                  stroke={color} strokeWidth={1} strokeDasharray="3 4" opacity={0.5}
                />
              )}
              <path
                d={cur}
                fill={color}
                fillOpacity={isFocused ? 0.1 : 0.04}
                stroke={color}
                strokeWidth={isFocused ? 2 : 1.5}
              />
              <path
                d={calcd}
                fill="none"
                stroke={color}
                strokeWidth={isFocused ? 1.5 : 1}
                strokeDasharray="5 3"
                opacity={0.7}
              />
            </g>
          );
        })}

        {/* нагрузочные точки */}
        {loadPoints.map((p, i) => (
          <g key={`load${i}`}>
            <line x1={sR(p.R) - 5} x2={sR(p.R) + 5} y1={sX(p.X)} y2={sX(p.X)} stroke="#a0522d" strokeWidth={1.5} />
            <line x1={sR(p.R)} x2={sR(p.R)} y1={sX(p.X) - 5} y2={sX(p.X) + 5} stroke="#a0522d" strokeWidth={1.5} />
          </g>
        ))}

        {/* замеры из протоколов */}
        {points.map((c) => {
          const inFocus = focusedSelected.has(c.id);
          return (
            <circle
              key={c.id}
              cx={sR(c.measurement.R)}
              cy={sX(c.measurement.X)}
              r={inFocus ? 6 : 4}
              fill={c.color}
              stroke={inFocus ? "#000" : "#fff"}
              strokeWidth={inFocus ? 1.5 : 1}
              onMouseEnter={() => setHover(c)}
              onMouseLeave={() => setHover(null)}
              style={{ cursor: "crosshair" }}
            />
          );
        })}
      </svg>

      {hover && (
        <div className="tooltip">
          <b>{hover.label}</b> {hover.kind && `· ${hover.kind}`}<br />
          Z = {hover.measurement.Z.toFixed(2)} ∠ {hover.measurement.phi.toFixed(1)}°<br />
          R = {hover.measurement.R.toFixed(2)}, X = {hover.measurement.X.toFixed(2)}
        </div>
      )}

      <div className="legend">
        {calc.stages.map((st, i) => (
          <span
            key={st.index}
            className={`legend-item${st.index === focusedIdx ? " focused" : ""}`}
          >
            <i style={{ background: STAGE_COLORS[i % STAGE_COLORS.length] }} />
            {st.index} ст
          </span>
        ))}
        <span className="legend-sep" />
        <span className="legend-note">▪ сплошная — текущая · пунктир — расчётная · + нагрузка</span>
      </div>
    </div>
  );
}
