import { useStore, selectActive } from "./model/store";
import { Tabs } from "./components/Tabs";
import { RXPlot } from "./components/RXPlot";
import { SelectivityMap } from "./components/SelectivityMap";
import { StageSettingsTable } from "./components/StageSettingsTable";
import { StageConditionSelector } from "./components/StageConditionSelector";
import { MeasurementList } from "./components/MeasurementList";
import { ImportButton } from "./components/ImportButton";
import { CoordinationPanel } from "./components/CoordinationPanel";
import { SensitivityPanel } from "./components/SensitivityPanel";
import { DetuningPanel } from "./components/DetuningPanel";
import { CollapsibleSection } from "./components/CollapsibleSection";

export default function App() {
  const calc = useStore(selectActive);

  return (
    <div className="app">
      {/* Шапка */}
      <header>
        <div className="header-left">
          <h1>Расчёт ДЗ</h1>
          <span className="header-sub">
            {calc.meta.line} · Защита {calc.meta.protectionId} · {calc.meta.deviceType}
          </span>
        </div>
        <ImportButton />
      </header>

      {/* Вкладки расчётов */}
      <Tabs />

      {/* Мета-строка */}
      <div className="meta">
        <span><b>ЭЛ:</b> {calc.meta.line}</span>
        <span><b>ПС:</b> {calc.meta.substation}</span>
        <span><b>Ветвь:</b> {calc.meta.branch}</span>
        <span><b>КТТ:</b> {calc.meta.ctRatio}</span>
        <span><b>КТН:</b> {calc.meta.vtRatio}</span>
      </div>

      {/* Рабочая область: левая панель + правая */}
      <div className="workspace">

        {/* ─── ЛЕВАЯ ПАНЕЛЬ: уставки, согласования, проверки ─── */}
        <aside className="sidebar">
          <CollapsibleSection title="Уставки (текущие)">
            <StageSettingsTable set="current" />
          </CollapsibleSection>

          <CollapsibleSection title="Уставки (расчётные)" defaultOpen={false}>
            <StageSettingsTable set="calculated" />
          </CollapsibleSection>

          <CollapsibleSection title="Согласования" badge={calc.coordinations.length}>
            <CoordinationPanel />
          </CollapsibleSection>

          <CollapsibleSection title="Чувствительность" badge={calc.sensitivity.length} defaultOpen={false}>
            <SensitivityPanel />
          </CollapsibleSection>

          <CollapsibleSection title="Отстройка" badge={calc.detuning.length} defaultOpen={false}>
            <DetuningPanel />
          </CollapsibleSection>

          <CollapsibleSection title="Замеры из протоколов" badge={calc.protocols.length} defaultOpen={false}>
            <MeasurementList />
          </CollapsibleSection>
        </aside>

        {/* ─── ПРАВАЯ ПАНЕЛЬ: график + выбор условий ─── */}
        <main className="main-right">
          <RXPlot />

          <CollapsibleSection title="Расчётные условия по ступени">
            <StageConditionSelector />
          </CollapsibleSection>

          <CollapsibleSection title="Карта селективности" defaultOpen={false}>
            <SelectivityMap />
          </CollapsibleSection>
        </main>

      </div>
    </div>
  );
}
