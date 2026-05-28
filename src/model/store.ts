import { create } from "zustand";
import type {
  CheckRow,
  Coordination,
  DistanceCharacteristic,
  DzProtocol,
  OrderType,
  ProtectionCalculation,
  Project,
} from "./types";
import { makeSeed } from "../data/seed";
import { parseDz } from "../dz/parseDz";

type CharField = keyof DistanceCharacteristic;
type CharSet = "current" | "calculated";

interface Store {
  project: Project;
  focusedStageIndex: number;

  // Навигация
  setActive: (id: string) => void;
  setFocusedStage: (idx: number) => void;
  addCalculation: () => void;
  renameCalculation: (id: string, name: string) => void;

  // Уставки
  updateChar: (stageIndex: number, set: CharSet, field: CharField, value: number) => void;

  // Выбор условий для ступени
  toggleStageCondition: (stageIndex: number, conditionId: string) => void;

  // Импорт протоколов .dz
  importDz: (buffer: ArrayBuffer, fileName: string) => void;

  // Тоггл / цвет замеров
  toggleConditionVisible: (protocolId: string, conditionId: string) => void;
  setConditionColor: (protocolId: string, conditionId: string, color: string) => void;

  // Согласования CRUD
  addCoordination: () => void;
  updateCoordination: (id: string, patch: Partial<Coordination>) => void;
  setCoordinationOrderType: (coordId: string, stageIdx: number, type: OrderType) => void;
  removeCoordination: (id: string) => void;

  // Чувствительность CRUD
  addSensitivityRow: () => void;
  updateSensitivityRow: (id: string, patch: Partial<CheckRow>) => void;
  removeSensitivityRow: (id: string) => void;

  // Отстройка CRUD
  addDetuningRow: () => void;
  updateDetuningRow: (id: string, patch: Partial<CheckRow>) => void;
  removeDetuningRow: (id: string) => void;

  // Отстройка от нагрузки
  updateLoadKo: (ko: number) => void;
}

function activeCalc(p: Project): ProtectionCalculation {
  return p.calculations.find((c) => c.id === p.activeId) ?? p.calculations[0];
}

function mapActive(
  p: Project,
  fn: (c: ProtectionCalculation) => ProtectionCalculation
): Project {
  return {
    ...p,
    calculations: p.calculations.map((c) => (c.id === p.activeId ? fn(c) : c)),
  };
}

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

export const useStore = create<Store>((set) => ({
  project: makeSeed(),
  focusedStageIndex: 1,

  setActive: (id) => set((s) => ({ project: { ...s.project, activeId: id } })),
  setFocusedStage: (idx) => set({ focusedStageIndex: idx }),

  addCalculation: () =>
    set((s) => {
      const n = s.project.calculations.length + 1;
      const base = makeSeed().calculations[0];
      const calc: ProtectionCalculation = {
        ...base,
        id: `calc-${Date.now()}`,
        meta: { ...base.meta, name: `Расчёт ${n}`, protectionId: "" },
        protocols: [],
        coordinations: [],
        sensitivity: [],
        detuning: [],
      };
      return {
        project: { calculations: [...s.project.calculations, calc], activeId: calc.id },
      };
    }),

  renameCalculation: (id, name) =>
    set((s) => ({
      project: {
        ...s.project,
        calculations: s.project.calculations.map((c) =>
          c.id === id ? { ...c, meta: { ...c.meta, name } } : c
        ),
      },
    })),

  updateChar: (stageIndex, charSet, field, value) =>
    set((s) => ({
      project: mapActive(s.project, (c) => ({
        ...c,
        stages: c.stages.map((st) =>
          st.index === stageIndex
            ? { ...st, [charSet]: { ...st[charSet], [field]: value } }
            : st
        ),
      })),
    })),

  toggleStageCondition: (stageIndex, conditionId) =>
    set((s) => ({
      project: mapActive(s.project, (c) => ({
        ...c,
        stages: c.stages.map((st) => {
          if (st.index !== stageIndex) return st;
          const ids = st.selectedConditionIds;
          return {
            ...st,
            selectedConditionIds: ids.includes(conditionId)
              ? ids.filter((i) => i !== conditionId)
              : [...ids, conditionId],
          };
        }),
      })),
    })),

  importDz: (buffer, fileName) =>
    set((s) => {
      const protocol: DzProtocol = parseDz(buffer, fileName);
      return {
        project: mapActive(s.project, (c) => ({
          ...c,
          protocols: [...c.protocols, protocol],
        })),
      };
    }),

  toggleConditionVisible: (protocolId, conditionId) =>
    set((s) => ({
      project: mapActive(s.project, (c) => ({
        ...c,
        protocols: c.protocols.map((p) =>
          p.id !== protocolId
            ? p
            : {
                ...p,
                conditions: p.conditions.map((cond) =>
                  cond.id === conditionId ? { ...cond, visible: !cond.visible } : cond
                ),
              }
        ),
      })),
    })),

  setConditionColor: (protocolId, conditionId, color) =>
    set((s) => ({
      project: mapActive(s.project, (c) => ({
        ...c,
        protocols: c.protocols.map((p) =>
          p.id !== protocolId
            ? p
            : {
                ...p,
                conditions: p.conditions.map((cond) =>
                  cond.id === conditionId ? { ...cond, color } : cond
                ),
              }
        ),
      })),
    })),

  addCoordination: () =>
    set((s) => ({
      project: mapActive(s.project, (c) => ({
        ...c,
        coordinations: [
          ...c.coordinations,
          {
            id: uid(),
            targetLine: "Линия",
            orderTypeByStage: ["веер", "веер", "узX", "узX", "узX"] as OrderType[],
            Ko: 0.85,
            result: { X: 0, R: 0 },
          },
        ],
      })),
    })),

  updateCoordination: (id, patch) =>
    set((s) => ({
      project: mapActive(s.project, (c) => ({
        ...c,
        coordinations: c.coordinations.map((co) =>
          co.id === id ? { ...co, ...patch } : co
        ),
      })),
    })),

  setCoordinationOrderType: (coordId, stageIdx, type) =>
    set((s) => ({
      project: mapActive(s.project, (c) => ({
        ...c,
        coordinations: c.coordinations.map((co) => {
          if (co.id !== coordId) return co;
          const ot = [...co.orderTypeByStage];
          ot[stageIdx] = type;
          return { ...co, orderTypeByStage: ot };
        }),
      })),
    })),

  removeCoordination: (id) =>
    set((s) => ({
      project: mapActive(s.project, (c) => ({
        ...c,
        coordinations: c.coordinations.filter((co) => co.id !== id),
      })),
    })),

  addSensitivityRow: () =>
    set((s) => ({
      project: mapActive(s.project, (c) => ({
        ...c,
        sensitivity: [
          ...c.sensitivity,
          { id: uid(), name: "", faultNode: "", Rper: 0, cascade: "", coef: 1.25, X: 0, R: 0 },
        ],
      })),
    })),

  updateSensitivityRow: (id, patch) =>
    set((s) => ({
      project: mapActive(s.project, (c) => ({
        ...c,
        sensitivity: c.sensitivity.map((r) => (r.id === id ? { ...r, ...patch } : r)),
      })),
    })),

  removeSensitivityRow: (id) =>
    set((s) => ({
      project: mapActive(s.project, (c) => ({
        ...c,
        sensitivity: c.sensitivity.filter((r) => r.id !== id),
      })),
    })),

  addDetuningRow: () =>
    set((s) => ({
      project: mapActive(s.project, (c) => ({
        ...c,
        detuning: [
          ...c.detuning,
          { id: uid(), name: "", faultNode: "", Rper: 0, cascade: "", coef: 0.85, X: 0, R: 0 },
        ],
      })),
    })),

  updateDetuningRow: (id, patch) =>
    set((s) => ({
      project: mapActive(s.project, (c) => ({
        ...c,
        detuning: c.detuning.map((r) => (r.id === id ? { ...r, ...patch } : r)),
      })),
    })),

  removeDetuningRow: (id) =>
    set((s) => ({
      project: mapActive(s.project, (c) => ({
        ...c,
        detuning: c.detuning.filter((r) => r.id !== id),
      })),
    })),

  updateLoadKo: (ko) =>
    set((s) => ({
      project: mapActive(s.project, (c) => ({
        ...c,
        loadDetuning: { ...c.loadDetuning, Ko: ko },
      })),
    })),
}));

export const selectActive = (s: Store) => activeCalc(s.project);
export const selectFocused = (s: Store) => s.focusedStageIndex;
