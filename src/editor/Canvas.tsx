import { PointerEvent, WheelEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Lock } from "lucide-react";
import { BlockRenderer } from "../blocks/registry";
import { PX_PER_MM, clampFrame, mmToPx, pageSizeMm, pxToMm, snapMm } from "../core/geometry";
import { themes } from "../core/themes";
import { usePosterStore } from "../core/store";
import type { Block, Frame, PosterDoc } from "../core/types";
import { sq } from "../i18n/sq";

type DragMode = "move" | "resize-se" | "resize-e" | "resize-s";

interface DragState {
  id: string;
  mode: DragMode;
  startX: number;
  startY: number;
  frame: Frame;
  historyBase: PosterDoc;
  latestFrame: Frame;
  heightMm: number;
  edges: { v: number[]; h: number[] };
  groupStartFrames: Map<string, Frame>;
  groupLatestFrames: Map<string, Frame>;
}

interface Guides {
  v: number[];
  h: number[];
}

const GUIDE_THRESHOLD_MM = 2;

function snapToEdges(start: number, span: number, edges: number[]) {
  for (const offset of [0, span / 2, span]) {
    for (const edge of edges) {
      if (Math.abs(start + offset - edge) <= GUIDE_THRESHOLD_MM) {
        return { value: edge - offset, guide: edge };
      }
    }
  }
  return undefined;
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
  const pageRef = useRef<HTMLDivElement>(null);
  const spacePressed = useRef(false);
  const doc = usePosterStore((state) => state.doc);
  const selectedIds = usePosterStore((state) => state.selectedIds);
  const zoom = usePosterStore((state) => state.zoom);
  const selectBlock = usePosterStore((state) => state.selectBlock);
  const toggleSelectBlock = usePosterStore((state) => state.toggleSelectBlock);
  const updateBlock = usePosterStore((state) => state.updateBlock);
  const updateBlocks = usePosterStore((state) => state.updateBlocks);
  const setZoom = usePosterStore((state) => state.setZoom);
  const undo = usePosterStore((state) => state.undo);
  const redo = usePosterStore((state) => state.redo);
  const deleteSelectedBlocks = usePosterStore((state) => state.deleteSelectedBlocks);
  const nudgeSelectedBlock = usePosterStore((state) => state.nudgeSelectedBlock);
  const [drag, setDrag] = useState<DragState>();
  const [pan, setPan] = useState<PanState>();
  const [guides, setGuides] = useState<Guides>({ v: [], h: [] });
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
      if (event.key === "Delete" && selectedIds.length > 0) {
        event.preventDefault();
        if (window.confirm(sq.inspector.confirmDelete)) deleteSelectedBlocks();
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
  }, [deleteSelectedBlocks, nudgeSelectedBlock, redo, selectBlock, selectedIds, undo]);

  const startDrag = (event: PointerEvent, block: Block, mode: DragMode) => {
    event.preventDefault();
    event.stopPropagation();
    const isGroupMove = mode === "move" && selectedIds.includes(block.id) && selectedIds.length > 1;
    if (!isGroupMove) selectBlock(block.id);

    const measuredHeights = new Map<string, number>();
    pageRef.current?.querySelectorAll<HTMLElement>("[data-block-id]").forEach((element) => {
      if (element.dataset.blockId) measuredHeights.set(element.dataset.blockId, element.offsetHeight / PX_PER_MM);
    });
    const blockHeightMm = (item: Block) =>
      typeof item.frame.h === "number" ? item.frame.h : measuredHeights.get(item.id) ?? 20;

    const groupIds = isGroupMove ? selectedIds.filter((id) => !doc.blocks.find((item) => item.id === id)?.locked) : [block.id];
    const groupStartFrames = new Map<string, Frame>();
    for (const id of groupIds) {
      const other = doc.blocks.find((item) => item.id === id);
      if (other) groupStartFrames.set(id, other.frame);
    }

    const edges: DragState["edges"] = { v: [0, page.w / 2, page.w], h: [0, page.h / 2, page.h] };
    for (const other of doc.blocks) {
      if (groupIds.includes(other.id)) continue;
      const otherH = blockHeightMm(other);
      edges.v.push(other.frame.x, other.frame.x + other.frame.w / 2, other.frame.x + other.frame.w);
      edges.h.push(other.frame.y, other.frame.y + otherH / 2, other.frame.y + otherH);
    }
    setDrag({
      id: block.id,
      mode,
      startX: event.clientX,
      startY: event.clientY,
      frame: block.frame,
      historyBase: doc,
      latestFrame: block.frame,
      heightMm: blockHeightMm(block),
      edges,
      groupStartFrames,
      groupLatestFrames: new Map(groupStartFrames),
    });
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const moveDrag = (event: PointerEvent) => {
    if (!drag) return;
    if (drag.mode === "move") {
      const primaryStart = drag.groupStartFrames.get(drag.id) ?? drag.frame;
      const rawX = primaryStart.x + pxToMm((event.clientX - drag.startX) / zoom);
      const rawY = primaryStart.y + pxToMm((event.clientY - drag.startY) / zoom);
      const snapX = snapToEdges(rawX, primaryStart.w, drag.edges.v);
      const snapY = snapToEdges(rawY, drag.heightMm, drag.edges.h);
      const dx = (snapX?.value ?? snapMm(rawX)) - primaryStart.x;
      const dy = (snapY?.value ?? snapMm(rawY)) - primaryStart.y;
      setGuides({ v: snapX ? [snapX.guide] : [], h: snapY ? [snapY.guide] : [] });

      const nextLatest = new Map<string, Frame>();
      const patches: Array<{ id: string; frame: Frame }> = [];
      drag.groupStartFrames.forEach((startFrame, id) => {
        const frame = clampFrame({ ...startFrame, x: startFrame.x + dx, y: startFrame.y + dy }, page);
        nextLatest.set(id, frame);
        patches.push({ id, frame });
      });
      setDrag((current) => (current ? { ...current, latestFrame: nextLatest.get(drag.id) ?? current.latestFrame, groupLatestFrames: nextLatest } : current));
      updateBlocks(patches, { commit: false });
    } else {
      const dx = snapMm(pxToMm((event.clientX - drag.startX) / zoom));
      const dy = snapMm(pxToMm((event.clientY - drag.startY) / zoom));
      const w = drag.mode === "resize-s" ? drag.frame.w : Math.max(28, snapMm(drag.frame.w + dx));
      const h =
        typeof drag.frame.h === "number" && drag.mode !== "resize-e"
          ? Math.max(10, snapMm(drag.frame.h + dy))
          : drag.frame.h;
      const frame = clampFrame({ ...drag.frame, w, h }, page);
      setDrag((current) => (current ? { ...current, latestFrame: frame, groupLatestFrames: new Map([[drag.id, frame]]) } : current));
      updateBlock(drag.id, { frame }, { commit: false });
    }
  };

  const endDrag = () => {
    if (!drag) return;
    if (drag.mode === "move") {
      const patches: Array<{ id: string; frame: Frame }> = [];
      drag.groupStartFrames.forEach((startFrame, id) => {
        const latest = drag.groupLatestFrames.get(id);
        if (latest && !sameFrame(startFrame, latest)) patches.push({ id, frame: latest });
      });
      if (patches.length > 0) {
        updateBlocks(patches, { historyBase: drag.historyBase });
      }
    } else if (!sameFrame(drag.frame, drag.latestFrame)) {
      updateBlock(drag.id, { frame: drag.latestFrame }, { historyBase: drag.historyBase });
    }
    setDrag(undefined);
    setGuides({ v: [], h: [] });
  };

  const handleWheel = (event: WheelEvent<HTMLElement>) => {
    if (!event.ctrlKey) return;
    event.preventDefault();
    const nextZoom = Math.max(0.25, Math.min(4, zoom + (event.deltaY < 0 ? 0.08 : -0.08)));
    const stage = canvasRef.current;
    const wrap = pageRef.current?.parentElement;
    setZoom(nextZoom);
    if (!stage || !wrap || nextZoom === zoom) return;
    const rect = wrap.getBoundingClientRect();
    const pointX = event.clientX - rect.left;
    const pointY = event.clientY - rect.top;
    const ratio = nextZoom / zoom;
    requestAnimationFrame(() => {
      stage.scrollLeft += pointX * (ratio - 1);
      stage.scrollTop += pointY * (ratio - 1);
    });
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
          ref={pageRef}
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
              data-block-id={block.id}
              className={`poster-block ${selectedIds.includes(block.id) ? "selected" : ""}`}
              style={frameStyle(block.frame)}
              onPointerDown={(event) => {
                event.stopPropagation();
                if (event.shiftKey) toggleSelectBlock(block.id);
                else selectBlock(block.id);
              }}
            >
              {!block.locked ? (
                <button
                  className="grab-handle"
                  aria-label={sq.canvas.move}
                  title={sq.canvas.move}
                  onPointerDown={(event) => startDrag(event, block, "move")}
                  onPointerMove={moveDrag}
                  onPointerUp={endDrag}
                  onPointerCancel={endDrag}
                />
              ) : null}
              {block.locked ? <Lock className="lock-badge" size={14} aria-label={sq.canvas.locked} /> : null}
              <BlockRenderer block={block} />
              {!block.locked ? (
                <>
                  <button
                    className="resize-handle resize-se"
                    aria-label={sq.canvas.resize}
                    title={sq.canvas.resize}
                    onPointerDown={(event) => startDrag(event, block, "resize-se")}
                    onPointerMove={moveDrag}
                    onPointerUp={endDrag}
                    onPointerCancel={endDrag}
                  />
                  {typeof block.frame.h === "number" ? (
                    <>
                      <button
                        className="resize-handle resize-e"
                        aria-label={sq.canvas.resize}
                        title={sq.canvas.resize}
                        onPointerDown={(event) => startDrag(event, block, "resize-e")}
                        onPointerMove={moveDrag}
                        onPointerUp={endDrag}
                        onPointerCancel={endDrag}
                      />
                      <button
                        className="resize-handle resize-s"
                        aria-label={sq.canvas.resize}
                        title={sq.canvas.resize}
                        onPointerDown={(event) => startDrag(event, block, "resize-s")}
                        onPointerMove={moveDrag}
                        onPointerUp={endDrag}
                        onPointerCancel={endDrag}
                      />
                    </>
                  ) : null}
                </>
              ) : null}
            </div>
          ))}
          {guides.v.map((mm) => (
            <div key={`v-${mm}`} className="align-guide align-guide-v" style={{ left: `${mmToPx(mm)}px` }} />
          ))}
          {guides.h.map((mm) => (
            <div key={`h-${mm}`} className="align-guide align-guide-h" style={{ top: `${mmToPx(mm)}px` }} />
          ))}
        </div>
      </div>
    </main>
  );
}
