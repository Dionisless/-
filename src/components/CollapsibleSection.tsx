import { useState } from "react";

interface Props {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  badge?: number;
}

export function CollapsibleSection({ title, children, defaultOpen = true, badge }: Props) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="cs">
      <button className="cs-header" onClick={() => setOpen((o) => !o)}>
        <span className="cs-arrow">{open ? "▾" : "▸"}</span>
        {title}
        {badge !== undefined && <span className="cs-badge">{badge}</span>}
      </button>
      {open && <div className="cs-body">{children}</div>}
    </div>
  );
}
