import { describe, expect, it } from "vitest";
import { clampFrame, firstFreeFrame, mmToPx, pageSizeMm, pxToMm, snapMm } from "./geometry";

describe("geometry", () => {
  it("clamps numeric heights to a 10mm minimum and inside the page", () => {
    const page = { w: 210, h: 297 };
    expect(clampFrame({ x: 10, y: 10, w: 50, h: 4 }, page).h).toBe(10);
    expect(clampFrame({ x: 10, y: 10, w: 50, h: 500 }, page).h).toBe(297 - 8);
  });

  it("keeps auto heights untouched and clamps position by width", () => {
    const page = { w: 210, h: 297 };
    const frame = clampFrame({ x: 500, y: 500, w: 90, h: "auto" }, page);
    expect(frame.h).toBe("auto");
    expect(frame.x).toBe(210 - 90 - 4);
    expect(frame.y).toBe(297 - 20 - 4);
  });

  it("round-trips millimeters and pixels", () => {
    expect(pxToMm(mmToPx(25))).toBeCloseTo(25);
  });

  it("snaps values to the 4mm grid by default", () => {
    expect(snapMm(6)).toBe(8);
    expect(snapMm(9)).toBe(8);
  });

  it("keeps firstFreeFrame inside the page even after many blocks", () => {
    const page = { w: 210, h: 297 };
    for (let index = 0; index < 60; index += 1) {
      const frame = firstFreeFrame(index, page);
      expect(frame.x).toBeGreaterThanOrEqual(4);
      expect(frame.x + frame.w).toBeLessThanOrEqual(page.w - 4 + 0.001);
      expect(frame.y).toBeGreaterThanOrEqual(4);
      expect(frame.y).toBeLessThanOrEqual(page.h - 4 + 0.001);
    }
  });

  it("swaps page dimensions for landscape orientation", () => {
    expect(pageSizeMm("A3", "portrait")).toEqual({ w: 297, h: 420 });
    expect(pageSizeMm("A3", "landscape")).toEqual({ w: 420, h: 297 });
  });
});
