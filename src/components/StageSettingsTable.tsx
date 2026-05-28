import { useStore, selectActive } from "../model/store";
import type { DistanceCharacteristic } from "../model/types";

const FIELDS: Array<{ key: keyof DistanceCharacteristic; label: string }> = [
  { key: "XU", label: "XУ" },
  { key: "RU", label: "RУ" },
  { key: "T", label: "T" },
  { key: "FMC", label: "ФМЧ" },
  { key: "AL", label: "AL" },
  { key: "F3", label: "Ф3" },
  { key: "F2", label: "Ф2" },
  { key: "RN1", label: "RН1" },
  { key: "FN1", label: "ФН1" },
];

export function StageSettingsTable({ set }: { set: "current" | "calculated" }) {
  const calc = useStore(selectActive);
  const updateChar = useStore((s) => s.updateChar);

  return (
    <table className="settings">
      <thead>
        <tr>
          <th>{set === "current" ? "Текущие" : "Расчётные"}</th>
          {calc.stages.map((st) => (
            <th key={st.index}>{st.index} ст</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {FIELDS.map((f) => (
          <tr key={f.key}>
            <td className="rowlabel">{f.label}</td>
            {calc.stages.map((st) => (
              <td key={st.index}>
                <input
                  type="number"
                  value={st[set][f.key]}
                  onChange={(e) =>
                    updateChar(st.index, set, f.key, Number(e.target.value))
                  }
                />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
