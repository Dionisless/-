// Производные значения (не хранятся в сторе, вычисляются на лету).
import type {
  CalcCondition,
  DistanceCharacteristic,
  ProtectionCalculation,
  Stage,
} from "./types";

export function getAllConditions(calc: ProtectionCalculation): CalcCondition[] {
  return calc.protocols.flatMap((p) => p.conditions);
}

export function getStageSelectedConditions(
  calc: ProtectionCalculation,
  stageIndex: number
): CalcCondition[] {
  const stage = calc.stages.find((s) => s.index === stageIndex);
  if (!stage) return [];
  const all = getAllConditions(calc);
  return all.filter((c) => stage.selectedConditionIds.includes(c.id));
}

/** Упрощённая расчётная уставка: max(X)/max(R) из выбранных условий. */
export function computeCalculatedChar(
  _stage: Stage,
  selected: CalcCondition[]
): Partial<DistanceCharacteristic> {
  if (!selected.length) return {};
  const xs = selected.map((c) => c.measurement.X).filter((v) => v > 0);
  const rs = selected.map((c) => c.measurement.R).filter((v) => v > 0);
  const result: Partial<DistanceCharacteristic> = {};
  if (xs.length) result.XU = Math.max(...xs);
  if (rs.length) result.RU = Math.max(...rs);
  return result;
}
