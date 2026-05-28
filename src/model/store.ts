import { create } from "zustand";
import type {
  DistanceCharacteristic,
  DzProtocol,
  ProtectionCalculation,
  Project,
} from "./types";
import { makeSeed } from "../data/seed";
import { parseDz } from "../dz/parseDz";

type CharField = keyof DistanceCharacteristic;
type CharSet = "current" | "calculated";

interface Store {
  project: Project;
  setActive: (id: string) => void;
  addCalculation: () => void;
  renameCalculation: (id: string, name: string) => void;
  updateChar: (
    stageIndex: number,
    set: CharSet,
    field: CharField,
    value: number
  ) => void;
  importDz: (buffer: ArrayBuffer, fileName: string) => void;
  toggleConditionVisible: (protocolId: string, conditionId: string) => void;
  setConditionColor: (protocolId: string, conditionId: string, color: string) => void;
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

export const useStore = create<Store>((set) => ({
  project: makeSeed(),

  setActive: (id) => set((s) => ({ project: { ...s.project, activeId: id } })),

  addCalculation: () =>
    set((s) => {
      const n = s.project.calculations.length + 1;
      const base = makeSeed().calculations[0];
      const calc: ProtectionCalculation = {
        ...base,
        id: `calc-${Date.now()}`,
        meta: { ...base.meta, name: `Расчёт ${n}`, protectionId: "" },
        protocols: [],
      };
      return {
        project: {
          calculations: [...s.project.calculations, calc],
          activeId: calc.id,
        },
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
                  cond.id === conditionId
                    ? { ...cond, visible: !cond.visible }
                    : cond
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
}));

export const selectActive = (s: Store) => activeCalc(s.project);
