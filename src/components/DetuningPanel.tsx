import { useStore, selectActive } from "../model/store";
import type { CheckRow } from "../model/types";

type Field = keyof CheckRow;

export function DetuningPanel() {
  const calc = useStore(selectActive);
  const add = useStore((s) => s.addDetuningRow);
  const update = useStore((s) => s.updateDetuningRow);
  const remove = useStore((s) => s.removeDetuningRow);

  function cell(row: CheckRow, field: Field, numeric = false) {
    return (
      <input
        className={numeric ? "num-sm" : "str-sm"}
        type={numeric ? "number" : "text"}
        value={String(row[field])}
        onChange={(e) =>
          update(row.id, { [field]: numeric ? Number(e.target.value) : e.target.value })
        }
      />
    );
  }

  return (
    <div className="check-panel">
      <table className="check-table">
        <thead>
          <tr>
            <th>Название</th>
            <th>Узел</th>
            <th>Rпер</th>
            <th>Ступень</th>
            <th>Ко</th>
            <th>X</th>
            <th>R</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {calc.detuning.map((row) => (
            <tr key={row.id}>
              <td>{cell(row, "name")}</td>
              <td>{cell(row, "faultNode")}</td>
              <td>{cell(row, "Rper", true)}</td>
              <td>{cell(row, "cascade")}</td>
              <td>{cell(row, "coef", true)}</td>
              <td>{cell(row, "X", true)}</td>
              <td>{cell(row, "R", true)}</td>
              <td>
                <button className="btn-icon remove" onClick={() => remove(row.id)}>×</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {calc.detuning.length === 0 && (
        <div className="empty-hint">Нет строк отстройки.</div>
      )}
      <button className="btn-add" onClick={add}>+ строка</button>
    </div>
  );
}
