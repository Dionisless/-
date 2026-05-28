import { useRef } from "react";
import { useStore } from "../model/store";

export function ImportButton() {
  const importDz = useStore((s) => s.importDz);
  const ref = useRef<HTMLInputElement>(null);

  async function onFiles(files: FileList | null) {
    if (!files) return;
    for (const file of Array.from(files)) {
      const buf = await file.arrayBuffer();
      importDz(buf, file.name);
    }
    if (ref.current) ref.current.value = "";
  }

  return (
    <>
      <button className="primary" onClick={() => ref.current?.click()}>
        Импорт .dz
      </button>
      <input
        ref={ref}
        type="file"
        accept=".dz"
        multiple
        style={{ display: "none" }}
        onChange={(e) => onFiles(e.target.files)}
      />
    </>
  );
}
