import { Check, Image, ListChecks, Table2, Target, TextCursorInput, Users, Boxes } from "lucide-react";
import type {
  Block,
  BlockType,
  ChecklistBlock,
  ImageFrameBlock,
  RiskCardBlock,
  SectionHeaderBlock,
  SwotGridBlock,
  TableBlock,
  TeamListBlock,
  TextBlock,
} from "../core/types";
import { themes } from "../core/themes";
import { usePosterStore } from "../core/store";
import { sq } from "../i18n/sq";

export const blockIcons: Record<BlockType, typeof TextCursorInput> = {
  text: TextCursorInput,
  section: Boxes,
  table: Table2,
  swot: Target,
  risk: Target,
  team: Users,
  checklist: ListChecks,
  image: Image,
};

interface BlockRendererProps {
  block: Block;
}

function EditableText({
  value,
  className,
  onCommit,
}: {
  value: string;
  className?: string;
  onCommit: (value: string) => void;
}) {
  return (
    <span
      className={className}
      contentEditable
      suppressContentEditableWarning
      onPointerDown={(event) => event.stopPropagation()}
      onBlur={(event) => onCommit(event.currentTarget.innerText.trim())}
    >
      {value}
    </span>
  );
}

function slotColor(block: Block, fallback = 0) {
  const theme = themes[usePosterStore.getState().doc.theme];
  return theme.slots[block.style?.colorSlot ?? fallback];
}

function softColor(block: Block, fallback = 0) {
  const theme = themes[usePosterStore.getState().doc.theme];
  return theme.softSlots[block.style?.colorSlot ?? fallback];
}

function TextRenderer({ block }: { block: TextBlock }) {
  const update = usePosterStore((state) => state.updateBlockData);
  return (
    <div className={`text-block text-${block.style?.size ?? "body"} align-${block.style?.align ?? "left"}`}>
      <EditableText value={block.data.text} onCommit={(text) => update<TextBlock>(block.id, { text })} />
    </div>
  );
}

function SectionRenderer({ block }: { block: SectionHeaderBlock }) {
  const update = usePosterStore((state) => state.updateBlockData);
  return (
    <div className="section-block" style={{ background: slotColor(block) }}>
      {block.data.badge ? <span className="section-badge">{block.data.badge}</span> : null}
      <EditableText value={block.data.title} onCommit={(title) => update<SectionHeaderBlock>(block.id, { title })} />
    </div>
  );
}

function TableRenderer({ block }: { block: TableBlock }) {
  const update = usePosterStore((state) => state.updateBlockData);
  const commitCell = (rowIndex: number, colIndex: number, value: string) => {
    const rows = block.data.rows.map((row, index) =>
      index === rowIndex ? row.map((cell, cellIndex) => (cellIndex === colIndex ? value : cell)) : row,
    );
    update<TableBlock>(block.id, { rows });
  };
  return (
    <div className="table-block" style={{ borderColor: slotColor(block), background: softColor(block) }}>
      {block.data.title ? (
        <div className="block-title" style={{ background: slotColor(block) }}>
          <EditableText value={block.data.title} onCommit={(title) => update<TableBlock>(block.id, { title })} />
        </div>
      ) : null}
      <table>
        <thead>
          <tr>
            {block.data.columns.map((column, index) => (
              <th key={`${column}-${index}`}>
                <EditableText
                  value={column}
                  onCommit={(value) =>
                    update<TableBlock>(block.id, {
                      columns: block.data.columns.map((item, itemIndex) => (itemIndex === index ? value : item)),
                    })
                  }
                />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {block.data.rows.map((row, rowIndex) => (
            <tr key={`${rowIndex}-${row.join("-")}`}>
              {block.data.columns.map((_, colIndex) => (
                <td key={`${rowIndex}-${colIndex}`}>
                  <EditableText value={row[colIndex] ?? ""} onCommit={(value) => commitCell(rowIndex, colIndex, value)} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SwotRenderer({ block }: { block: SwotGridBlock }) {
  const update = usePosterStore((state) => state.updateBlockData);
  return (
    <div className="swot-block">
      <div className="swot-risk">
        <EditableText value={block.data.riskLabel} onCommit={(riskLabel) => update<SwotGridBlock>(block.id, { riskLabel })} />
      </div>
      {block.data.columns.map((column, index) => (
        <div className="swot-column" key={column.title} style={{ background: themes.school.softSlots[index + 1] }}>
          <strong>{column.title}</strong>
          <ul>
            {column.items.map((item, itemIndex) => (
              <li key={`${item}-${itemIndex}`}>
                <EditableText
                  value={item}
                  onCommit={(value) => {
                    const columns = block.data.columns.map((entry, columnIndex) =>
                      columnIndex === index
                        ? {
                            ...entry,
                            items: entry.items.map((current, currentIndex) => (currentIndex === itemIndex ? value : current)),
                          }
                        : entry,
                    );
                    update<SwotGridBlock>(block.id, { columns });
                  }}
                />
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

function RiskRenderer({ block }: { block: RiskCardBlock }) {
  const update = usePosterStore((state) => state.updateBlockData);
  return (
    <div className="risk-card" style={{ borderColor: slotColor(block), background: softColor(block) }}>
      <div className="risk-number" style={{ background: slotColor(block) }}>{block.data.number}</div>
      <div className="risk-main">
        <strong>
          <EditableText value={block.data.label} onCommit={(label) => update<RiskCardBlock>(block.id, { label })} />
        </strong>
        <small>
          <EditableText value={block.data.dataCount} onCommit={(dataCount) => update<RiskCardBlock>(block.id, { dataCount })} />
        </small>
      </div>
      <div className="risk-stats">
        <span>{sq.risk.probability}: {block.data.probability}</span>
        <span>{sq.risk.impact}: {block.data.impact}</span>
        <span>{sq.risk.score}: {block.data.score}</span>
      </div>
      <div className="risk-ratings">
        {block.data.ratings.map((rating, index) => (
          <span key={`${rating}-${index}`}>{rating}</span>
        ))}
      </div>
    </div>
  );
}

function TeamRenderer({ block }: { block: TeamListBlock }) {
  const update = usePosterStore((state) => state.updateBlockData);
  return (
    <div className="team-block">
      <div className="block-title" style={{ background: slotColor(block) }}>
        <EditableText value={block.data.title} onCommit={(title) => update<TeamListBlock>(block.id, { title })} />
      </div>
      {block.data.members.map((member, index) => (
        <div className="team-row" key={`${member.role}-${index}`}>
          <Users size={14} />
          <span>{member.role}</span>
          <strong>{member.name}</strong>
        </div>
      ))}
    </div>
  );
}

function ChecklistRenderer({ block }: { block: ChecklistBlock }) {
  const update = usePosterStore((state) => state.updateBlockData);
  return (
    <div className="checklist-block">
      <div className="block-title" style={{ background: slotColor(block) }}>
        <EditableText value={block.data.title} onCommit={(title) => update<ChecklistBlock>(block.id, { title })} />
      </div>
      {block.data.items.map((item, index) => (
        <div className="check-row" key={`${item}-${index}`}>
          <Check size={14} />
          <EditableText
            value={item}
            onCommit={(value) =>
              update<ChecklistBlock>(block.id, {
                items: block.data.items.map((entry, itemIndex) => (itemIndex === index ? value : entry)),
              })
            }
          />
        </div>
      ))}
    </div>
  );
}

function ImageRenderer({ block }: { block: ImageFrameBlock }) {
  const src = block.data.src;
  return (
    <figure className="image-block">
      {src ? <img src={src} alt={block.data.caption ?? ""} className={`fit-${block.data.fit}`} /> : <div className="school-placeholder" />}
      {block.data.caption ? <figcaption>{block.data.caption}</figcaption> : null}
    </figure>
  );
}

export function BlockRenderer({ block }: BlockRendererProps) {
  if (block.type === "section") return <SectionRenderer block={block} />;
  if (block.type === "table") return <TableRenderer block={block} />;
  if (block.type === "swot") return <SwotRenderer block={block} />;
  if (block.type === "risk") return <RiskRenderer block={block} />;
  if (block.type === "team") return <TeamRenderer block={block} />;
  if (block.type === "checklist") return <ChecklistRenderer block={block} />;
  if (block.type === "image") return <ImageRenderer block={block} />;
  return <TextRenderer block={block} />;
}
