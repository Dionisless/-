// Парсер бинарного протокола ПК БРИЗ / АРМ СРЗА (.dz).
//
// Формат записи: последовательность полей вида
//   тег (4 байта, ASCII-имя дополнено нулями) + |Z| (float32 LE) + угол° (float32 LE).
// Теги — токи (IA..I0), напряжения (UA..U0), сопротивления (ZA..Z0).
// Каждое расчётное условие — группа полей, начинающаяся с тега IA.
// Контур ZAB даёт точку замера: R = |Z|·cosφ, X = |Z|·sinφ.

import type { CalcCondition, DzHeader, DzProtocol, Phasor, PhasorTag } from "../model/types";

const TAGS: PhasorTag[] = [
  "IA", "IB", "IC", "IAB", "IBC", "ICA", "I1", "I2", "I0",
  "UA", "UB", "UC", "UAB", "UBC", "UCA", "U1", "U2", "U0",
  "ZA", "ZB", "ZC", "ZAB", "ZBC", "ZCA", "Z1", "Z2", "Z0",
];
const TAG_SET = new Set<string>(TAGS);

function readTag(bytes: Uint8Array, pos: number): PhasorTag | null {
  if (pos + 4 > bytes.length) return null;
  // имя — байты до первого нуля; должны быть печатные ASCII (буквы/цифры)
  let name = "";
  for (let i = 0; i < 4; i++) {
    const b = bytes[pos + i];
    if (b === 0) break;
    if (b < 0x30 || b > 0x7a) return null;
    name += String.fromCharCode(b);
  }
  return TAG_SET.has(name) ? (name as PhasorTag) : null;
}

function toMeasurement(p: Phasor) {
  const rad = (p.ang * Math.PI) / 180;
  return {
    R: p.mag * Math.cos(rad),
    X: p.mag * Math.sin(rad),
    Z: p.mag,
    phi: p.ang,
  };
}

function readDeviceType(bytes: Uint8Array): string {
  // Тип реле хранится ASCII в заголовке (напр. "7SA522").
  const text = new TextDecoder("latin1").decode(bytes.subarray(0, 256));
  const m = text.match(/[0-9][A-Z]{2}\d{3}/);
  return m ? m[0] : "";
}

const PALETTE = ["#d62728", "#1f77b4", "#2ca02c", "#9467bd", "#ff7f0e", "#8c564b"];

export function parseDz(buffer: ArrayBuffer, fileName = "protocol.dz"): DzProtocol {
  const bytes = new Uint8Array(buffer);
  const view = new DataView(buffer);

  const conditions: CalcCondition[] = [];
  let current: Partial<Record<PhasorTag, Phasor>> | null = null;

  let pos = 0;
  while (pos + 12 <= bytes.length) {
    const tag = readTag(bytes, pos);
    if (tag === null) {
      pos += 1;
      continue;
    }
    const mag = view.getFloat32(pos + 4, true);
    const ang = view.getFloat32(pos + 8, true);
    // отбрасываем нечисловые/мусорные значения
    if (!Number.isFinite(mag) || !Number.isFinite(ang)) {
      pos += 1;
      continue;
    }

    if (tag === "IA") {
      // начало новой записи (расчётного условия)
      if (current) flush(current);
      current = {};
    }
    if (current) current[tag] = { mag, ang };
    pos += 12;
  }
  if (current) flush(current);

  function flush(phasors: Partial<Record<PhasorTag, Phasor>>) {
    const loop = phasors.ZAB ?? phasors.Z1 ?? phasors.ZA;
    if (!loop) return;
    const idx = conditions.length;
    conditions.push({
      id: `${fileName}#${idx}`,
      loopTag: phasors.ZAB ? "ZAB" : phasors.Z1 ? "Z1" : "ZA",
      phasors,
      measurement: toMeasurement(loop),
      kind: "",
      color: PALETTE[idx % PALETTE.length],
      visible: true,
      status: "Р",
      label: `№${idx + 1}`,
    });
  }

  const header: DzHeader = {
    deviceType: readDeviceType(bytes),
    recordCount: conditions.length,
  };

  return {
    id: `${fileName}-${Date.now()}`,
    fileName,
    header,
    conditions,
  };
}
