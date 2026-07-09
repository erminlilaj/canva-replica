import type { Frame, PageOrientation, PageSize } from "./types";

export const PX_PER_MM = 96 / 25.4;

export const PAGE_SIZES_MM: Record<PageSize, { w: number; h: number }> = {
  A4: { w: 210, h: 297 },
  A3: { w: 297, h: 420 },
  A2: { w: 420, h: 594 },
};

export function pageSizeMm(size: PageSize, orientation: PageOrientation) {
  const base = PAGE_SIZES_MM[size];
  return orientation === "portrait" ? base : { w: base.h, h: base.w };
}

export function mmToPx(mm: number) {
  return mm * PX_PER_MM;
}

export function pxToMm(px: number) {
  return px / PX_PER_MM;
}

export function snapMm(value: number, grid = 4) {
  return Math.round(value / grid) * grid;
}

export function clampFrame(frame: Frame, page: { w: number; h: number }): Frame {
  const w = Math.max(28, Math.min(frame.w, page.w - 8));
  const h = typeof frame.h === "number" ? Math.max(10, Math.min(frame.h, page.h - 8)) : frame.h;
  const occupiedH = typeof h === "number" ? h : 20;
  return {
    ...frame,
    x: Math.max(4, Math.min(frame.x, page.w - w - 4)),
    y: Math.max(4, Math.min(frame.y, page.h - occupiedH - 4)),
    w,
    h,
  };
}

export function firstFreeFrame(index: number, page: { w: number; h: number }): Frame {
  const margin = 10;
  const colW = Math.min(92, page.w - margin * 2);
  const row = Math.floor(index / 3);
  const col = index % 3;
  return clampFrame(
    {
      x: margin + col * (colW + 5),
      y: margin + row * 32,
      w: colW,
      h: "auto",
    },
    page,
  );
}
