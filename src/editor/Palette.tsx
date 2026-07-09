import type { BlockType } from "../core/types";
import { usePosterStore } from "../core/store";
import { blockIcons } from "../blocks/registry";
import { sq } from "../i18n/sq";

const blocks: Array<{ type: BlockType; label: string }> = [
  { type: "text", label: sq.palette.text },
  { type: "section", label: sq.palette.section },
  { type: "table", label: sq.palette.table },
  { type: "swot", label: sq.palette.swot },
  { type: "risk", label: sq.palette.risk },
  { type: "team", label: sq.palette.team },
  { type: "checklist", label: sq.palette.checklist },
  { type: "image", label: sq.palette.image },
];

export function Palette() {
  const addBlock = usePosterStore((state) => state.addBlock);
  return (
    <aside className="side-panel palette">
      <h2>{sq.palette.title}</h2>
      <p>{sq.palette.hint}</p>
      <div className="palette-list">
        {blocks.map((item) => {
          const Icon = blockIcons[item.type];
          return (
            <button key={item.type} onClick={() => addBlock(item.type)}>
              <Icon size={22} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </aside>
  );
}
