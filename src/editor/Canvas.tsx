import { PointerEvent, useMemo, useRef, useState } from "react";
import { BlockRenderer } from "../blocks/registry";
import { clampFrame, mmToPx, pageSizeMm, pxToMm, snapMm } from "../core/geometry";
import { themes } from "../core/themes";
import { usePosterStore } from "../core/store";
import type { Block, Frame } from "../core/types";
import { sq } from "../i18n/sq";

type DragMode = "move" | "resize";

interface DragState {
  id: string;
  mode: DragMode;
  startX: number;
  startY: number;
  frame: Frame;
}

function frameStyle(frame: Frame) {
  return {
    left: `${mmToPx(frame.x)}px`,
    top: `${mmToPx(frame.y)}px`,
    width: `${mmToPx(frame.w)}px`,
    minHeight: typeof frame.h === "number" ? `${mmToPx(frame.h)}px` : undefined,
    height: typeof frame.h === "number" ? `${mmToPx(frame.h)}px` : undefined,
  };
}

export function Canvas() {
  const canvasRef = useRef<HTMLDivElement>(null);
  const doc = usePosterStore((state) => state.doc);
  const selectedId = usePosterStore((state) => state.selectedId);
  const zoom = usePosterStore((state) => state.zoom);
  const selectBlock = usePosterStore((state) => state.selectBlock);
  const updateBlock = usePosterStore((state) => state.updateBlock);
  const [drag, setDrag] = useState<DragState>();
  const page = useMemo(() => pageSizeMm(doc.page.size, doc.page.orientation), [doc.page.orientation, doc.page.size]);
  const theme = themes[doc.theme];

  const startDrag = (event: PointerEvent, block: Block, mode: DragMode) => {
    event.preventDefault();
    event.stopPropagation();
    selectBlock(block.id);
    setDrag({ id: block.id, mode, startX: event.clientX, startY: event.clientY, frame: block.frame });
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const moveDrag = (event: PointerEvent) => {
    if (!drag) return;
    const dx = snapMm(pxToMm((event.clientX - drag.startX) / zoom));
    const dy = snapMm(pxToMm((event.clientY - drag.startY) / zoom));
    const nextFrame =
      drag.mode === "resize"
        ? { ...drag.frame, w: Math.max(28, snapMm(drag.frame.w + dx)), h: drag.frame.h }
        : { ...drag.frame, x: snapMm(drag.frame.x + dx), y: snapMm(drag.frame.y + dy) };
    updateBlock(drag.id, { frame: clampFrame(nextFrame, page) });
  };

  const endDrag = () => setDrag(undefined);

  return (
    <main className="canvas-stage" ref={canvasRef}>
      <div
        className="page-wrap"
        style={{
          width: `${mmToPx(page.w) * zoom}px`,
          height: `${mmToPx(page.h) * zoom}px`,
        }}
      >
        <div
          className="poster-page"
          aria-label={sq.canvas.page}
          onPointerDown={() => selectBlock(undefined)}
          style={{
            width: `${mmToPx(page.w)}px`,
            height: `${mmToPx(page.h)}px`,
            transform: `scale(${zoom})`,
            background: theme.page,
            color: theme.ink,
            fontFamily: theme.bodyFont,
          }}
        >
          {doc.blocks.map((block) => (
            <div
              key={block.id}
              className={`poster-block ${selectedId === block.id ? "selected" : ""}`}
              style={frameStyle(block.frame)}
              onPointerDown={(event) => {
                event.stopPropagation();
                selectBlock(block.id);
              }}
              onPointerMove={moveDrag}
              onPointerUp={endDrag}
              onPointerCancel={endDrag}
            >
              <button
                className="grab-handle"
                aria-label={sq.canvas.move}
                title={sq.canvas.move}
                onPointerDown={(event) => startDrag(event, block, "move")}
              />
              <BlockRenderer block={block} />
              <button
                className="resize-handle"
                aria-label={sq.canvas.resize}
                title={sq.canvas.resize}
                onPointerDown={(event) => startDrag(event, block, "resize")}
              />
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
