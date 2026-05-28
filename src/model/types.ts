// Единая структура данных приложения расчёта дистанционных защит (ДЗ).
// Все вью — производные от Project; правки идут только через экшены стора.

export type PhasorTag =
  | "IA" | "IB" | "IC" | "IAB" | "IBC" | "ICA" | "I1" | "I2" | "I0"
  | "UA" | "UB" | "UC" | "UAB" | "UBC" | "UCA" | "U1" | "U2" | "U0"
  | "ZA" | "ZB" | "ZC" | "ZAB" | "ZBC" | "ZCA" | "Z1" | "Z2" | "Z0";

/** Фазор: модуль и угол в градусах (как хранит ПК БРИЗ в .dz). */
export interface Phasor {
  mag: number;
  ang: number;
}

/** Точка замера в плоскости R-X. */
export interface Measurement {
  R: number;
  X: number;
  Z: number;
  phi: number;
}

export type ConditionStatus = "Р" | "НР" | "НС"; // расчётное / нерасчётное / несрабатывание

/** Одно расчётное условие из протокола (одна запись .dz). */
export interface CalcCondition {
  id: string;
  /** Базовый контур импеданса, по которому строится замер (обычно ZAB). */
  loopTag: PhasorTag;
  phasors: Partial<Record<PhasorTag, Phasor>>;
  measurement: Measurement;
  kind: string; // ОТСТРОЙКА / СОГЛАСОВАНИЕ / ЧУВСТВИ-НОСТЬ ...
  color: string;
  visible: boolean;
  status: ConditionStatus;
  label: string;
}

export interface DzHeader {
  deviceType: string; // 7SA522
  recordCount: number;
}

export interface DzProtocol {
  id: string;
  fileName: string;
  header: DzHeader;
  conditions: CalcCondition[];
}

/** Параметры полигональной характеристики ступени ДЗ. */
export interface DistanceCharacteristic {
  XU: number;   // уставка по оси X (реактивный охват)
  RU: number;   // уставка по оси R (активный охват)
  T: number;    // время срабатывания
  FMC: number;  // угол максимальной чувствительности (наклон линии реактанса)
  AL: number;   // угол скоса верхней части
  F3: number;   // угол наклона левой части
  F2: number;   // угол наклона нижней части
  RN1: number;  // граница выреза нагрузки
  FN1: number;  // угол выреза нагрузки
  tuskAvt: number;
  tuskOper: number;
}

export interface Stage {
  index: number; // 1..5
  current: DistanceCharacteristic;
  calculated: DistanceCharacteristic;
  selectedConditionIds: string[];
}

export interface CalcMeta {
  name: string;
  line: string;        // ЭЛ
  substation: string;  // ПС
  protectionId: string; // Защита
  deviceType: string;
  branch: string;      // Ветвь
  ctRatio: string;     // КТТ
  vtRatio: string;     // КТН
}

export type OrderType = "веер" | "узX" | "узR";

export interface Coordination {
  id: string;
  targetLine: string;
  orderTypeByStage: OrderType[];
  protocolId?: string;
  Ko: number;
  result: { X: number; R: number };
}

export interface CheckRow {
  id: string;
  name: string;
  faultNode: string; // Узел КЗ
  Rper: number;      // Rпер
  cascade: string;   // Каскад
  coef: number;      // Кч (чувствительность) или Ко (отстройка)
  protocolId?: string;
  X: number;
  R: number;
}

export interface LoadRegime {
  name: string;
  X: number;
  R: number;
}

export interface LoadDetuning {
  Ko: number;
  regimes: LoadRegime[];
}

export interface ProtectionCalculation {
  id: string;
  meta: CalcMeta;
  stages: Stage[];
  coordinations: Coordination[];
  sensitivity: CheckRow[];
  detuning: CheckRow[];
  loadDetuning: LoadDetuning;
  protocols: DzProtocol[];
}

export interface Project {
  calculations: ProtectionCalculation[];
  activeId: string;
}
