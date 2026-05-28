import { useStore, selectActive, selectFocused } from "../model/store";
import { getAllConditions, computeCalculatedChar } from "../model/selectors";

const CHAR_PARAMS = [
  { key: "XU", label: "XУ" },
  { key: "RU", label: "RУ" },
  { key: "T",  label: "T"  },
  { key: "FMC", label: "ФМЧ" },
  { key: "AL",  label: "AL"  },
  { key: "F2",  label: "Ф2"  },
  { key: "F3",  label: "Ф3"  },
] as const;

export function StageConditionSelector() {
  const calc = useStore(selectActive);
  const focusedIdx = useStore(selectFocused);
  const setFocused = useStore((s) => s.setFocusedStage);
  const toggle = useStore((s) => s.toggleStageCondition);

  const stage = calc.stages.find((s) => s.index === focusedIdx) ?? calc.stages[0];
  const allConds = getAllConditions(calc);
  const selected = allConds.filter((c) => stage.selectedConditionIds.includes(c.id));
  const derived = computeCalculatedChar(stage, selected);

  return (
    <div className="scs">
      {/* Stage tabs */}
      <div className="scs-tabs">
        {calc.stages.map((st) => (
          <button
            key={st.index}
            className={st.index === focusedIdx ? "scs-tab active" : "scs-tab"}
            onClick={() => setFocused(st.index)}
          >
            {st.index} ст
          </button>
        ))}
      </div>

      <div className="scs-body">
        {/* Сводная таблица уставок: выбранная vs расчётная */}
        <table className="scs-sum">
          <thead>
            <tr>
              <th>Пар.</th>
              <th>Выбранная</th>
              <th>Расчётная</th>
            </tr>
          </thead>
          <tbody>
            {CHAR_PARAMS.map(({ key, label }) => {
              const calc_val = derived[key as keyof typeof derived];
              const cur = stage.current[key as keyof typeof stage.current];
              const hasDerived = calc_val !== undefined;
              const diff = hasDerived && Math.abs(Number(calc_val) - Number(cur)) > 0.01;
              return (
                <tr key={key} className={diff ? "diff" : ""}>
                  <td className="rowlabel">{label}</td>
                  <td>{typeof cur === "number" ? cur.toFixed(cur % 1 === 0 ? 0 : 2) : cur}</td>
                  <td className={diff ? "derived-diff" : "derived"}>
                    {hasDerived ? Number(calc_val).toFixed(Number(calc_val) % 1 === 0 ? 0 : 2) : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Список условий из протоколов */}
        <div className="scs-conds">
          <div className="scs-conds-head">
            Условия протоколов ({selected.length}/{allConds.length} выбрано)
          </div>
          {allConds.length === 0 ? (
            <div className="empty-hint">Импортируйте .dz для выбора условий.</div>
          ) : (
            <div className="scs-cond-list">
              {allConds.map((c) => {
                const checked = stage.selectedConditionIds.includes(c.id);
                return (
                  <label key={c.id} className={`scs-cond-item ${checked ? "checked" : ""}`}>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggle(stage.index, c.id)}
                    />
                    <span
                      className="cond-dot"
                      style={{ background: c.color }}
                    />
                    <span className="cond-lbl">
                      {c.label}&nbsp;
                      Z={c.measurement.Z.toFixed(1)}∠{c.measurement.phi.toFixed(0)}°
                      &nbsp;R={c.measurement.R.toFixed(1)}&nbsp;X={c.measurement.X.toFixed(1)}
                    </span>
                  </label>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
