import { useStore, selectActive } from "./model/store";
import { Tabs } from "./components/Tabs";
import { RXPlot } from "./components/RXPlot";
import { StageSettingsTable } from "./components/StageSettingsTable";
import { MeasurementList } from "./components/MeasurementList";
import { ImportButton } from "./components/ImportButton";

export default function App() {
  const calc = useStore(selectActive);

  return (
    <div className="app">
      <header>
        <h1>Расчёт дистанционных защит</h1>
        <ImportButton />
      </header>

      <Tabs />

      <div className="meta">
        <span><b>ЭЛ:</b> {calc.meta.line}</span>
        <span><b>ПС:</b> {calc.meta.substation}</span>
        <span><b>Защита:</b> {calc.meta.protectionId}</span>
        <span><b>Тип:</b> {calc.meta.deviceType}</span>
        <span><b>Ветвь:</b> {calc.meta.branch}</span>
        <span><b>КТТ:</b> {calc.meta.ctRatio}</span>
        <span><b>КТН:</b> {calc.meta.vtRatio}</span>
      </div>

      <div className="layout">
        <div className="left">
          <StageSettingsTable set="current" />
          <StageSettingsTable set="calculated" />
          <h3>Замеры</h3>
          <MeasurementList />
        </div>
        <div className="right">
          <RXPlot />
        </div>
      </div>
    </div>
  );
}
