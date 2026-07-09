import { describe, expect, it } from "vitest";
import { mmToPx, pageSizeMm, pxToMm, snapMm } from "./geometry";

describe("geometry", () => {
  it("round-trips millimeters and pixels", () => {
    expect(pxToMm(mmToPx(25))).toBeCloseTo(25);
  });

  it("snaps values to the 4mm grid by default", () => {
    expect(snapMm(6)).toBe(8);
    expect(snapMm(9)).toBe(8);
  });

  it("swaps page dimensions for landscape orientation", () => {
    expect(pageSizeMm("A3", "portrait")).toEqual({ w: 297, h: 420 });
    expect(pageSizeMm("A3", "landscape")).toEqual({ w: 420, h: 297 });
  });
});
