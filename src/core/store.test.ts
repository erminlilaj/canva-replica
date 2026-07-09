import { beforeEach, describe, expect, it } from "vitest";
import { usePosterStore } from "./store";
import type { PosterDoc, TableBlock, TextBlock } from "./types";

function fixtureDoc(): PosterDoc {
  return {
    version: 1,
    title: "Test",
    page: { size: "A4", orientation: "portrait" },
    theme: "school",
    blocks: [
      { id: "text-1", type: "text", frame: { x: 10, y: 10, w: 40, h: "auto" }, data: { text: "Përshëndetje" } },
      {
        id: "table-1",
        type: "table",
        frame: { x: 10, y: 40, w: 60, h: "auto" },
        data: { columns: ["A", "B"], rows: [["1", "2"], ["3", "4"]] },
      },
    ],
  };
}

beforeEach(() => {
  usePosterStore.getState().openEditor(fixtureDoc());
});

describe("store: history", () => {
  it("a live drag (commit:false) followed by one final commit produces exactly one history entry", () => {
    const historyBase = usePosterStore.getState().doc;
    const { updateBlock } = usePosterStore.getState();

    updateBlock("text-1", { frame: { x: 12, y: 10, w: 40, h: "auto" } }, { commit: false });
    updateBlock("text-1", { frame: { x: 15, y: 11, w: 40, h: "auto" } }, { commit: false });
    updateBlock("text-1", { frame: { x: 20, y: 14, w: 40, h: "auto" } }, { commit: false });
    expect(usePosterStore.getState().past).toHaveLength(0);

    updateBlock("text-1", { frame: { x: 20, y: 14, w: 40, h: "auto" } }, { historyBase });
    const state = usePosterStore.getState();
    expect(state.past).toHaveLength(1);
    expect(state.past[0]).toBe(historyBase);
    expect(state.future).toHaveLength(0);
  });

  it("undo after deleting a table row restores the row", () => {
    const { updateBlockData, undo } = usePosterStore.getState();
    const table = () => usePosterStore.getState().doc.blocks.find((b) => b.id === "table-1") as TableBlock;

    expect(table().data.rows).toHaveLength(2);
    updateBlockData<TableBlock>("table-1", { rows: [table().data.rows[0]] });
    expect(table().data.rows).toHaveLength(1);

    undo();
    expect(table().data.rows).toHaveLength(2);
    expect(table().data.rows).toEqual([["1", "2"], ["3", "4"]]);
  });
});

describe("store: multi-select", () => {
  it("toggleSelectBlock builds up a selection and updateBlocks moves all selected blocks in one history entry", () => {
    const { toggleSelectBlock, updateBlocks } = usePosterStore.getState();
    toggleSelectBlock("text-1");
    toggleSelectBlock("table-1");
    expect(usePosterStore.getState().selectedIds).toEqual(["text-1", "table-1"]);

    const historyBase = usePosterStore.getState().doc;
    updateBlocks(
      [
        { id: "text-1", frame: { x: 20, y: 20, w: 40, h: "auto" } },
        { id: "table-1", frame: { x: 20, y: 50, w: 60, h: "auto" } },
      ],
      { historyBase },
    );

    const state = usePosterStore.getState();
    expect(state.past).toHaveLength(1);
    expect(state.doc.blocks.find((b) => b.id === "text-1")?.frame.x).toBe(20);
    expect(state.doc.blocks.find((b) => b.id === "table-1")?.frame.x).toBe(20);
  });

  it("deleteSelectedBlocks removes every selected block at once", () => {
    const { toggleSelectBlock, deleteSelectedBlocks } = usePosterStore.getState();
    toggleSelectBlock("text-1");
    toggleSelectBlock("table-1");
    deleteSelectedBlocks();

    const state = usePosterStore.getState();
    expect(state.doc.blocks).toHaveLength(0);
    expect(state.selectedIds).toEqual([]);
  });
});

describe("store: duplicateBlock", () => {
  it("deep-copies a block so mutating the copy's data does not touch the original", () => {
    const { duplicateBlock, updateBlockData } = usePosterStore.getState();
    duplicateBlock("text-1");

    const state = usePosterStore.getState();
    const copyId = state.selectedIds[0];
    expect(copyId).not.toBe("text-1");
    expect(state.doc.blocks).toHaveLength(3);

    updateBlockData<TextBlock>(copyId, { text: "Ndryshuar" });

    const original = usePosterStore.getState().doc.blocks.find((b) => b.id === "text-1") as TextBlock;
    const copy = usePosterStore.getState().doc.blocks.find((b) => b.id === copyId) as TextBlock;
    expect(original.data.text).toBe("Përshëndetje");
    expect(copy.data.text).toBe("Ndryshuar");
  });
});
