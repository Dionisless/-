import { useStore, selectActive } from "../model/store";

export function MeasurementList() {
  const calc = useStore(selectActive);
  const toggle = useStore((s) => s.toggleConditionVisible);
  const setColor = useStore((s) => s.setConditionColor);

  if (calc.protocols.length === 0) {
    return <div className="empty">Импортируйте .dz протокол, чтобы увидеть замеры.</div>;
  }

  return (
    <div className="measurements">
      {calc.protocols.map((p) => (
        <div key={p.id} className="protocol">
          <div className="protocol-head">
            {p.fileName} · {p.header.deviceType} · {p.header.recordCount} усл.
          </div>
          <table className="meas-table">
            <thead>
              <tr>
                <th>отобр</th>
                <th>№</th>
                <th>Z</th>
                <th>ф</th>
                <th>R</th>
                <th>X</th>
                <th>цвет</th>
              </tr>
            </thead>
            <tbody>
              {p.conditions.map((c) => (
                <tr key={c.id} className={c.visible ? "" : "dim"}>
                  <td>
                    <input
                      type="checkbox"
                      checked={c.visible}
                      onChange={() => toggle(p.id, c.id)}
                    />
                  </td>
                  <td>{c.label}</td>
                  <td>{c.measurement.Z.toFixed(2)}</td>
                  <td>{c.measurement.phi.toFixed(0)}</td>
                  <td>{c.measurement.R.toFixed(2)}</td>
                  <td>{c.measurement.X.toFixed(2)}</td>
                  <td>
                    <input
                      type="color"
                      value={c.color}
                      onChange={(e) => setColor(p.id, c.id, e.target.value)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}
