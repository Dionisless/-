// Демоданные на основе листа «Концепт» и примеров расчётов.
import type {
  DistanceCharacteristic,
  ProtectionCalculation,
  Project,
  Stage,
} from "../model/types";

function char(
  XU: number,
  RU: number,
  T: number,
  over: Partial<DistanceCharacteristic> = {}
): DistanceCharacteristic {
  return {
    XU,
    RU,
    T,
    FMC: 75,
    AL: -25,
    F3: 115,
    F2: -15,
    RN1: 80,
    FN1: 30,
    tuskAvt: 0,
    tuskOper: 0.5,
    ...over,
  };
}

// Уставки 5 ступеней (XУ/RУ/T) из блока «Уставки Линии А-Б».
const STAGE_SETTINGS: Array<[number, number, number]> = [
  [10, 5, 0],
  [20, 10, 0.6],
  [40, 20, 1.2],
  [80, 40, 2.4],
  [160, 80, 4.8],
];

function makeStages(): Stage[] {
  return STAGE_SETTINGS.map(([XU, RU, T], i) => ({
    index: i + 1,
    current: char(XU, RU, T),
    calculated: char(XU, RU, T),
    selectedConditionIds: [],
  }));
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
    meta: {
      name,
      line,
      substation,
      protectionId,
      deviceType: "7SA522",
      branch,
      ctRatio: "1000/5",
      vtRatio: "2200",
    },
    stages: makeStages(),
    coordinations: [],
    sensitivity: [],
    detuning: [],
    loadDetuning: { Ko: 0.85, regimes: [] },
    protocols: [],
  };
}

export function makeSeed(): Project {
  const calcs = [
    makeCalc(
      "calc-1",
      "ВЛ-220 ЛОЗОВАЯ-ШИРОКАЯ",
      "ВЛ-220 ЛОЗОВАЯ-ШИРОКАЯ",
      "ШИРОКАЯ 220-2",
      "3302",
      "367-981"
    ),
    makeCalc(
      "calc-2",
      "КВЛ-220 ШИРОКАЯ-НАХОДКА",
      "КВЛ-220 ШИРОКАЯ-НАХОДКА",
      "ШИРОКАЯ 220-1",
      "9902",
      "366-990"
    ),
  ];
  return { calculations: calcs, activeId: calcs[0].id };
}
