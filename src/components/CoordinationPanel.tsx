import { useStore, selectActive } from "../model/store";
import type { OrderType } from "../model/types";

const ORDER_TYPES: OrderType[] = ["веер", "узX", "узR"];

export function CoordinationPanel() {
  const calc = useStore(selectActive);
  const add = useStore((s) => s.addCoordination);
  const update = useStore((s) => s.updateCoordination);
  const setOrder = useStore((s) => s.setCoordinationOrderType);
  const remove = useStore((s) => s.removeCoordination);

  return (
    <div className="coord-panel">
      {calc.coordinations.length === 0 && (
        <div className="empty-hint">Нет согласований. Нажмите «+», чтобы добавить.</div>
      )}
      {calc.coordinations.map((co) => (
        <div key={co.id} className="coord-row">
          <div className="coord-head">
            <input
              className="coord-name"
              value={co.targetLine}
              onChange={(e) => update(co.id, { targetLine: e.target.value })}
              placeholder="Линия"
            />
            <label>
              Ко&nbsp;
              <input
                type="number"
                className="num-sm"
                value={co.Ko}
                step={0.01}
                onChange={(e) => update(co.id, { Ko: Number(e.target.value) })}
              />
            </label>
            <label>
              X&nbsp;
              <input
                type="number"
                className="num-sm"
                value={co.result.X}
                onChange={(e) => update(co.id, { result: { ...co.result, X: Number(e.target.value) } })}
              />
            </label>
            <label>
              R&nbsp;
              <input
                type="number"
                className="num-sm"
                value={co.result.R}
                onChange={(e) => update(co.id, { result: { ...co.result, R: Number(e.target.value) } })}
              />
            </label>
            <button className="btn-icon remove" onClick={() => remove(co.id)} title="Удалить">×</button>
          </div>
          <div className="coord-stages">
            {calc.stages.map((st, i) => (
              <div key={st.index} className="coord-stage">
                <span className="stage-lbl">{st.index}ст</span>
                <select
                  value={co.orderTypeByStage[i] ?? "узX"}
                  onChange={(e) => setOrder(co.id, i, e.target.value as OrderType)}
                >
                  {ORDER_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </div>
      ))}
      <button className="btn-add" onClick={add}>+ согласование</button>
    </div>
  );
}
