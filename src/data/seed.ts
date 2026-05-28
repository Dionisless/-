import type {
  CheckRow,
  Coordination,
  DistanceCharacteristic,
  LoadDetuning,
  OrderType,
  ProtectionCalculation,
  Project,
  Stage,
} from "../model/types";

let _id = 0;
function uid() {
  return `seed-${++_id}`;
}

function char(
  XU: number,
  RU: number,
  T: number,
  over: Partial<DistanceCharacteristic> = {}
): DistanceCharacteristic {
  return {
    XU, RU, T,
    FMC: 75, AL: -25, F3: 115, F2: -15,
    RN1: 80, FN1: 30, CM: 0,
    tuskAvt: 0, tuskOper: 0.5,
    ...over,
  };
}

// 5 ступеней из листа «Концепт»
const STAGE_DEF: Array<[number, number, number]> = [
  [10, 5, 0],
  [20, 10, 0.6],
  [40, 20, 1.2],
  [80, 40, 2.4],
  [160, 80, 4.8],
];

function makeStages(): Stage[] {
  return STAGE_DEF.map(([XU, RU, T], i) => ({
    index: i + 1,
    current: char(XU, RU, T),
    calculated: char(XU, RU, T),
    selectedConditionIds: [],
  }));
}

// Согласования: Б-Д и Б-С (из листа Концепт, строки 19 и 28)
function makeCoordinations(): Coordination[] {
  return [
    {
      id: uid(),
      targetLine: "Б-Д",
      orderTypeByStage: ["веер", "узX", "узX", "узX", "узX"] as OrderType[],
      Ko: 0.85,
      result: { X: 17.2, R: 21.4 },
    },
    {
      id: uid(),
      targetLine: "Б-С",
      orderTypeByStage: ["веер", "веер", "узX", "узX", "узX"] as OrderType[],
      Ko: 0.85,
      result: { X: 17.2, R: 21.4 },
    },
  ];
}

// Чувствительность (строки 38-43 листа Концепт)
function makeSensitivity(): CheckRow[] {
  const rows = [
    { name: "ПС Лозовая", node: "921", cascade: "БР" },
    { name: "ПС А",       node: "921", cascade: "ДР" },
    { name: "ПС Д",       node: "921", cascade: "К/Др" },
    { name: "ПС Р",       node: "921", cascade: "К/ДР" },
    { name: "ПС К",       node: "921", cascade: "ДР" },
  ];
  return rows.map((r) => ({
    id: uid(),
    name: r.name,
    faultNode: r.node,
    Rper: 5,
    cascade: r.cascade,
    coef: 1.25,
    X: 17.2,
    R: 21.41,
  }));
}

// Отстройка (строки 45-50 листа Концепт)
function makeDetuning(): CheckRow[] {
  const rows = [
    { name: "ПС Б", zone: "9921/2" },
    { name: "ПС В", zone: "9931/1" },
    { name: "ПС Г", zone: "321/1" },
    { name: "ПС Д", zone: "321/2" },
    { name: "ПС Е", zone: "321/3" },
  ];
  return rows.map((r) => ({
    id: uid(),
    name: r.name,
    faultNode: "921",
    Rper: 5,
    cascade: r.zone,
    coef: 0.85,
    X: 17.2,
    R: 21.41,
  }));
}

// Отстройка от нагрузки (строки 52-57 листа Концепт)
function makeLoadDetuning(): LoadDetuning {
  return {
    Ko: 0.85,
    regimes: Array.from({ length: 5 }, (_, i) => ({
      name: `Режим ${i + 1}`,
      X: 17.2,
      R: 21.41,
    })),
  };
}

function makeCalc(
  id: string,
  name: string,
  line: string,
  substation: string,
  protectionId: string,
  branch: string
): ProtectionCalculation {
  return {
    id,
    meta: { name, line, substation, protectionId, deviceType: "7SA522", branch, ctRatio: "1000/5", vtRatio: "2200" },
    stages: makeStages(),
    coordinations: makeCoordinations(),
    sensitivity: makeSensitivity(),
    detuning: makeDetuning(),
    loadDetuning: makeLoadDetuning(),
    protocols: [],
  };
}

export function makeSeed(): Project {
  _id = 0; // детерминированные id при каждом вызове
  const calcs = [
    makeCalc("calc-1", "ВЛ-220 ЛОЗОВАЯ-ШИРОКАЯ",   "ВЛ-220 ЛОЗОВАЯ-ШИРОКАЯ",   "ШИРОКАЯ 220-2", "3302", "367-981"),
    makeCalc("calc-2", "КВЛ-220 ШИРОКАЯ-НАХОДКА",  "КВЛ-220 ШИРОКАЯ-НАХОДКА",  "ШИРОКАЯ 220-1", "9902", "366-990"),
  ];
  return { calculations: calcs, activeId: calcs[0].id };
}
