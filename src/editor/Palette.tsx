import { useEffect, useRef, useState } from "react";
import type { BlockType } from "../core/types";
import { usePosterStore } from "../core/store";
import { blockIcons } from "../blocks/registry";
import { pxToMm } from "../core/geometry";
import { sq } from "../i18n/sq";

const blocks: Array<{ type: BlockType; label: string }> = [
  { type: "text", label: sq.palette.text },
  { type: "box", label: sq.palette.box },
  { type: "divider", label: sq.palette.divider },
  { type: "stat", label: sq.palette.stat },
  { type: "section", label: sq.palette.section },
  { type: "table", label: sq.palette.table },
  { type: "swot", label: sq.palette.swot },
  { type: "risk", label: sq.palette.risk },
  { type: "team", label: sq.palette.team },
  { type: "checklist", label: sq.palette.checklist },
  { type: "image", label: sq.palette.image },
];

const DRAG_THRESHOLD_PX = 6;

interface DragTracker {
  type: BlockType;
  label: string;
  startX: number;
  startY: number;
  dragging: boolean;
}

interface Ghost {
  type: BlockType;
  label: string;
  x: number;
  y: number;
}

export function Palette() {
  const addBlock = usePosterStore((state) => state.addBlock);
  const zoomRef = useRef(usePosterStore.getState().zoom);
  const [ghost, setGhost] = useState<Ghost>();
  const dragRef = useRef<DragTracker>();

  useEffect(() => usePosterStore.subscribe((state) => (zoomRef.current = state.zoom)), []);

  useEffect(() => {
    const onMove = (event: PointerEvent) => {
      const drag = dragRef.current;
      if (!drag) return;
      const dx = event.clientX - drag.startX;
      const dy = event.clientY - drag.startY;
      if (!drag.dragging && Math.hypot(dx, dy) > DRAG_THRESHOLD_PX) {
        drag.dragging = true;
      }
      if (drag.dragging) {
        setGhost({ type: drag.type, label: drag.label, x: event.clientX, y: event.clientY });
      }
    };
    const onUp = (event: PointerEvent) => {
      const drag = dragRef.current;
      dragRef.current = undefined;
      setGhost(undefined);
      if (!drag?.dragging) return;
      const target = document.elementFromPoint(event.clientX, event.clientY);
      const page = target?.closest<HTMLElement>(".poster-page");
      if (!page) return;
      const rect = page.getBoundingClientRect();
      addBlock(drag.type, {
        x: pxToMm((event.clientX - rect.left) / zoomRef.current),
        y: pxToMm((event.clientY - rect.top) / zoomRef.current),
      });
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [addBlock]);

  const GhostIcon = ghost ? blockIcons[ghost.type] : null;

  return (
    <aside className="side-panel palette">
      <h2>{sq.palette.title}</h2>
      <p>{sq.palette.hint}</p>
      <div className="palette-list">
        {blocks.map((item) => {
          const Icon = blockIcons[item.type];
          return (
            <button
              key={item.type}
              onClick={() => addBlock(item.type)}
              onPointerDown={(event) => {
                dragRef.current = { type: item.type, label: item.label, startX: event.clientX, startY: event.clientY, dragging: false };
              }}
            >
              <Icon size={22} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
      {ghost && GhostIcon ? (
        <div className="palette-ghost" style={{ left: ghost.x + 14, top: ghost.y + 14 }}>
          <GhostIcon size={18} />
          <span>{ghost.label}</span>
        </div>
      ) : null}
    </aside>
  );
}
