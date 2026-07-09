import { PointerEvent, WheelEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BlockRenderer } from "../blocks/registry";
import { clampFrame, mmToPx, pageSizeMm, pxToMm, snapMm } from "../core/geometry";
import { themes } from "../core/themes";
import { usePosterStore } from "../core/store";
import type { Block, Frame, PosterDoc } from "../core/types";
import { sq } from "../i18n/sq";

type DragMode = "move" | "resize";

interface DragState {
  id: string;
  mode: DragMode;
  startX: number;
  startY: number;
  frame: Frame;
  historyBase: PosterDoc;
  latestFrame: Frame;
}

interface PanState {
  startX: number;
  startY: number;
  scrollLeft: number;
  scrollTop: number;
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

function sameFrame(a: Frame, b: Frame) {
  return a.x === b.x && a.y === b.y && a.w === b.w && a.h === b.h;
}

export function Canvas() {
  const canvasRef = useRef<HTMLDivElement>(null);
  const spacePressed = useRef(false);
  const doc = usePosterStore((state) => state.doc);
  const selectedId = usePosterStore((state) => state.selectedId);
  const zoom = usePosterStore((state) => state.zoom);
  const selectBlock = usePosterStore((state) => state.selectBlock);
  const updateBlock = usePosterStore((state) => state.updateBlock);
  const setZoom = usePosterStore((state) => state.setZoom);
  const undo = usePosterStore((state) => state.undo);
  const redo = usePosterStore((state) => state.redo);
  const deleteBlock = usePosterStore((state) => state.deleteBlock);
  const nudgeSelectedBlock = usePosterStore((state) => state.nudgeSelectedBlock);
  const [drag, setDrag] = useState<DragState>();
  const [pan, setPan] = useState<PanState>();
  const page = useMemo(() => pageSizeMm(doc.page.size, doc.page.orientation), [doc.page.orientation, doc.page.size]);
  const theme = themes[doc.theme];

  const fitPage = useCallback(() => {
    const stage = canvasRef.current;
    if (!stage) return;
    const nextZoom = Math.min((stage.clientWidth - 64) / mmToPx(page.w), (stage.clientHeight - 64) / mmToPx(page.h));
    setZoom(nextZoom);
  }, [page.h, page.w, setZoom]);

  useEffect(() => {
    window.addEventListener("postera:fit-page", fitPage);
    return () => window.removeEventListener("postera:fit-page", fitPage);
  }, [fitPage]);

  useEffect(() => {
    const isEditing = () => {
      const active = document.activeElement;
      return active instanceof HTMLElement && (active.isContentEditable || ["INPUT", "SELECT", "TEXTAREA"].includes(active.tagName));
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.code === "Space") spacePressed.current = true;
      if (isEditing()) {
        if (event.key === "Escape" && document.activeElement instanceof HTMLElement) document.activeElement.blur();
        return;
      }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z") {
        event.preventDefault();
        if (event.shiftKey) redo();
        else undo();
        return;
      }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "y") {
        event.preventDefault();
        redo();
        return;
      }
      if (event.key === "Delete" && selectedId) {
        event.preventDefault();
        if (window.confirm(sq.inspector.confirmDelete)) deleteBlock(selectedId);
        return;
      }
      if (event.key === "Escape") {
        selectBlock(undefined);
        return;
      }
      const step = event.shiftKey ? 10 : 1;
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        nudgeSelectedBlock(-step, 0);
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        nudgeSelectedBlock(step, 0);
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        nudgeSelectedBlock(0, -step);
      } else if (event.key === "ArrowDown") {
        event.preventDefault();
        nudgeSelectedBlock(0, step);
      }
    };
    const onKeyUp = (event: KeyboardEvent) => {
      if (event.code === "Space") spacePressed.current = false;
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [deleteBlock, nudgeSelectedBlock, redo, selectBlock, selectedId, undo]);

  const startDrag = (event: PointerEvent, block: Block, mode: DragMode) => {
    event.preventDefault();
    event.stopPropagation();
    selectBlock(block.id);
    setDrag({
      id: block.id,
      mode,
      startX: event.clientX,
      startY: event.clientY,
      frame: block.frame,
      historyBase: doc,
      latestFrame: block.frame,
    });
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
    const frame = clampFrame(nextFrame, page);
    setDrag((current) => (current ? { ...current, latestFrame: frame } : current));
    updateBlock(drag.id, { frame }, { commit: false });
  };

  const endDrag = () => {
    if (!drag) return;
    if (!sameFrame(drag.frame, drag.latestFrame)) {
      updateBlock(drag.id, { frame: drag.latestFrame }, { historyBase: drag.historyBase });
    }
    setDrag(undefined);
  };

  const handleWheel = (event: WheelEvent<HTMLElement>) => {
    if (!event.ctrlKey) return;
    event.preventDefault();
    setZoom(zoom + (event.deltaY < 0 ? 0.08 : -0.08));
  };

  const startPan = (event: PointerEvent<HTMLElement>) => {
    if (!spacePressed.current || event.button !== 0 || !canvasRef.current) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    setPan({
      startX: event.clientX,
      startY: event.clientY,
      scrollLeft: canvasRef.current.scrollLeft,
      scrollTop: canvasRef.current.scrollTop,
    });
  };

  const movePan = (event: PointerEvent<HTMLElement>) => {
    if (!pan || !canvasRef.current) return;
    canvasRef.current.scrollLeft = pan.scrollLeft - (event.clientX - pan.startX);
    canvasRef.current.scrollTop = pan.scrollTop - (event.clientY - pan.startY);
  };

  return (
    <main
      className="canvas-stage"
      ref={canvasRef}
      onWheel={handleWheel}
      onPointerDown={startPan}
      onPointerMove={movePan}
      onPointerUp={() => setPan(undefined)}
      onPointerCancel={() => setPan(undefined)}
    >
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
            >
              <button
                className="grab-handle"
                aria-label={sq.canvas.move}
                title={sq.canvas.move}
                onPointerDown={(event) => startDrag(event, block, "move")}
                onPointerMove={moveDrag}
                onPointerUp={endDrag}
                onPointerCancel={endDrag}
              />
              <BlockRenderer block={block} />
              <button
                className="resize-handle"
                aria-label={sq.canvas.resize}
                title={sq.canvas.resize}
                onPointerDown={(event) => startDrag(event, block, "resize")}
                onPointerMove={moveDrag}
                onPointerUp={endDrag}
                onPointerCancel={endDrag}
              />
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
