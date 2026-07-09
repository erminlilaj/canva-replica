import { describe, expect, it } from "vitest";
import { validatePosterDoc } from "./validate";
import type { PosterDoc } from "./types";

const validDoc: PosterDoc = {
  version: 1,
  title: "Test",
  page: { size: "A4", orientation: "portrait" },
  theme: "school",
  blocks: [
    {
      id: "text-1",
      type: "text",
      frame: { x: 1, y: 2, w: 30, h: "auto" },
      data: { text: "Përshëndetje" },
    },
  ],
};

describe("validatePosterDoc", () => {
  it("accepts a valid document", () => {
    expect(validatePosterDoc(validDoc)?.blocks).toHaveLength(1);
  });

  it("rejects the wrong document version", () => {
    expect(validatePosterDoc({ ...validDoc, version: 2 })).toBeNull();
  });

  it("drops blocks with malformed frames when another block is valid", () => {
    const doc = validatePosterDoc({
      ...validDoc,
      blocks: [
        { ...validDoc.blocks[0], id: "bad", frame: { x: 1, y: 2, w: "wide", h: "auto" } },
        validDoc.blocks[0],
      ],
    });
    expect(doc?.blocks).toHaveLength(1);
    expect(doc?.blocks[0].id).toBe("text-1");
  });

  it("drops unknown block types", () => {
    const doc = validatePosterDoc({
      ...validDoc,
      blocks: [{ ...validDoc.blocks[0], type: "mystery" }, validDoc.blocks[0]],
    });
    expect(doc?.blocks).toHaveLength(1);
  });

  it("accepts a table block with zero rows", () => {
    const doc = validatePosterDoc({
      ...validDoc,
      blocks: [
        {
          id: "table-1",
          type: "table",
          frame: { x: 1, y: 1, w: 50, h: "auto" },
          data: { columns: ["A", "B"], rows: [] },
        },
      ],
    });
    expect(doc?.blocks).toHaveLength(1);
    expect(doc?.blocks[0].type === "table" && doc.blocks[0].data.rows).toEqual([]);
  });

  it("drops a table block with non-array rows", () => {
    const doc = validatePosterDoc({
      ...validDoc,
      blocks: [
        {
          id: "table-1",
          type: "table",
          frame: { x: 1, y: 1, w: 50, h: "auto" },
          data: { columns: ["A"], rows: "bad" },
        },
        validDoc.blocks[0],
      ],
    });
    expect(doc?.blocks).toHaveLength(1);
  });
});
