import { Copy, Trash2 } from "lucide-react";
import { sq } from "../i18n/sq";
import { themes } from "../core/themes";
import { usePosterStore } from "../core/store";
import type { TableBlock } from "../core/types";

export function Inspector() {
  const doc = usePosterStore((state) => state.doc);
  const selectedId = usePosterStore((state) => state.selectedId);
  const updateBlock = usePosterStore((state) => state.updateBlock);
  const updateBlockData = usePosterStore((state) => state.updateBlockData);
  const deleteBlock = usePosterStore((state) => state.deleteBlock);
  const duplicateBlock = usePosterStore((state) => state.duplicateBlock);
  const block = doc.blocks.find((item) => item.id === selectedId);
  const theme = themes[doc.theme];

  if (!block) {
    return (
      <aside className="side-panel inspector">
        <h2>{sq.inspector.title}</h2>
        <p>{sq.inspector.empty}</p>
      </aside>
    );
  }

  const setColor = (colorSlot: number) => updateBlock(block.id, { style: { ...block.style, colorSlot } });
  const addRow = () => {
    if (block.type !== "table") return;
    updateBlockData<TableBlock>(block.id, {
      rows: [...block.data.rows, block.data.columns.map(() => "")],
    });
  };
  const addColumn = () => {
    if (block.type !== "table") return;
    updateBlockData<TableBlock>(block.id, {
      columns: [...block.data.columns, `Kolona ${block.data.columns.length + 1}`],
      rows: block.data.rows.map((row) => [...row, ""]),
    });
  };

  return (
    <aside className="side-panel inspector">
      <h2>{sq.inspector.title}</h2>
      <label>
        {sq.inspector.position}
        <span className="position-readout">
          {Math.round(block.frame.x)} mm, {Math.round(block.frame.y)} mm
        </span>
      </label>
      <label>
        {sq.inspector.width}
        <input
          type="range"
          min="28"
          max="280"
          value={block.frame.w}
          onChange={(event) => updateBlock(block.id, { frame: { ...block.frame, w: Number(event.target.value) } })}
        />
      </label>
      <div className="control-label">{sq.inspector.color}</div>
      <div className="swatches">
        {theme.slots.map((slot, index) => (
          <button
            key={slot}
            className={block.style?.colorSlot === index ? "active" : ""}
            style={{ background: slot }}
            aria-label={`${sq.inspector.color} ${index + 1}`}
            onClick={() => setColor(index)}
          />
        ))}
      </div>
      {block.type === "table" ? (
        <div className="inspector-actions">
          <button onClick={addRow}>{sq.inspector.addRow}</button>
          <button onClick={addColumn}>{sq.inspector.addColumn}</button>
        </div>
      ) : null}
      <div className="inspector-actions">
        <button onClick={() => duplicateBlock(block.id)}>
          <Copy size={18} />
          {sq.inspector.duplicate}
        </button>
        <button
          className="danger"
          onClick={() => {
            if (window.confirm(sq.inspector.confirmDelete)) deleteBlock(block.id);
          }}
        >
          <Trash2 size={18} />
          {sq.inspector.delete}
        </button>
      </div>
    </aside>
  );
}
