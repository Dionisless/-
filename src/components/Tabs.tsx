import { useStore } from "../model/store";

export function Tabs() {
  const project = useStore((s) => s.project);
  const setActive = useStore((s) => s.setActive);
  const addCalculation = useStore((s) => s.addCalculation);

  return (
    <div className="tabs">
      {project.calculations.map((c) => (
        <button
          key={c.id}
          className={c.id === project.activeId ? "tab active" : "tab"}
          onClick={() => setActive(c.id)}
          title={`${c.meta.line} · Защита ${c.meta.protectionId}`}
        >
          {c.meta.name}
        </button>
      ))}
      <button className="tab add" onClick={addCalculation}>+ расчёт</button>
    </div>
  );
}
