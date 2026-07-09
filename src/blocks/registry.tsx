import { Component, type ErrorInfo, type ReactNode } from "react";
import { Check, Image, ListChecks, Minus, Square, Table2, Target, TextCursorInput, Users, Boxes, Hash } from "lucide-react";
import type {
  Block,
  BlockType,
  BoxBlock,
  ChecklistBlock,
  DividerBlock,
  ImageFrameBlock,
  RiskCardBlock,
  SectionHeaderBlock,
  StatBlock,
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
  box: Square,
  divider: Minus,
  stat: Hash,
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

class BlockErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(error, info);
  }

  render() {
    if (this.state.hasError) return <div className="block-error">{sq.error.block}</div>;
    return this.props.children;
  }
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
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.currentTarget.blur();
        }
      }}
      onBlur={(event) => onCommit(event.currentTarget.innerText.trim())}
    >
      {value}
    </span>
  );
}

function slotColor(block: Block, fallback = 0) {
  const theme = themes[usePosterStore.getState().doc.theme];
  return block.style?.accent ?? theme.slots[block.style?.colorSlot ?? fallback];
}

function softColor(block: Block, fallback = 0) {
  const theme = themes[usePosterStore.getState().doc.theme];
  return theme.softSlots[block.style?.colorSlot ?? fallback];
}

function TextRenderer({ block }: { block: TextBlock }) {
  const update = usePosterStore((state) => state.updateBlockData);
  const bodyFont = usePosterStore((state) => state.doc.fonts?.body);
  const fontFamily = block.style?.fontFamily ?? bodyFont;
  return (
    <div className={`text-block text-${block.style?.size ?? "body"} align-${block.style?.align ?? "left"}`} style={{ fontFamily }}>
      <EditableText value={block.data.text} onCommit={(text) => update<TextBlock>(block.id, { text })} />
    </div>
  );
}

function BoxRenderer({ block }: { block: BoxBlock }) {
  const update = usePosterStore((state) => state.updateBlockData);
  return (
    <div className={`box-block align-${block.style?.align ?? "center"}`} style={{ background: softColor(block), borderColor: slotColor(block), color: slotColor(block) }}>
      <EditableText value={block.data.text} onCommit={(text) => update<BoxBlock>(block.id, { text })} />
    </div>
  );
}

function DividerRenderer({ block }: { block: DividerBlock }) {
  const update = usePosterStore((state) => state.updateBlockData);
  return (
    <div className="divider-block" style={{ color: slotColor(block) }}>
      <span style={{ background: slotColor(block) }} />
      {block.data.label ? <EditableText value={block.data.label} onCommit={(label) => update<DividerBlock>(block.id, { label })} /> : null}
    </div>
  );
}

function StatRenderer({ block }: { block: StatBlock }) {
  const update = usePosterStore((state) => state.updateBlockData);
  return (
    <div className={`stat-block align-${block.style?.align ?? "center"}`} style={{ borderColor: slotColor(block), background: softColor(block) }}>
      <strong style={{ color: slotColor(block) }}>
        <EditableText value={block.data.value} onCommit={(value) => update<StatBlock>(block.id, { value })} />
      </strong>
      <span>
        <EditableText value={block.data.label} onCommit={(label) => update<StatBlock>(block.id, { label })} />
      </span>
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
  const removeRow = (rowIndex: number) => {
    update<TableBlock>(block.id, { rows: block.data.rows.filter((_, index) => index !== rowIndex) });
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
              <th key={index}>
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
            <tr key={rowIndex}>
              {block.data.columns.map((_, colIndex) => (
                <td key={`${rowIndex}-${colIndex}`}>
                  {colIndex === 0 ? (
                    <button className="inline-remove" type="button" aria-label={sq.inspector.removeRow} onClick={() => removeRow(rowIndex)}>
                      ×
                    </button>
                  ) : null}
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
  const theme = themes[usePosterStore((state) => state.doc.theme)];
  return (
    <div className="swot-block">
      <div className="swot-risk">
        <EditableText value={block.data.riskLabel} onCommit={(riskLabel) => update<SwotGridBlock>(block.id, { riskLabel })} />
      </div>
      {block.data.columns.map((column, index) => (
        <div className="swot-column" key={index} style={{ background: theme.softSlots[(index + 1) % theme.softSlots.length] }}>
          <strong>{column.title}</strong>
          <ul>
            {column.items.map((item, itemIndex) => (
              <li key={itemIndex}>
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
          <span key={index}>{rating}</span>
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
        <div className="team-row" key={index}>
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
        <div className="check-row" key={index}>
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
  return (
    <BlockErrorBoundary>
      {block.type === "box" ? <BoxRenderer block={block} /> : null}
      {block.type === "divider" ? <DividerRenderer block={block} /> : null}
      {block.type === "stat" ? <StatRenderer block={block} /> : null}
      {block.type === "section" ? <SectionRenderer block={block} /> : null}
      {block.type === "table" ? <TableRenderer block={block} /> : null}
      {block.type === "swot" ? <SwotRenderer block={block} /> : null}
      {block.type === "risk" ? <RiskRenderer block={block} /> : null}
      {block.type === "team" ? <TeamRenderer block={block} /> : null}
      {block.type === "checklist" ? <ChecklistRenderer block={block} /> : null}
      {block.type === "image" ? <ImageRenderer block={block} /> : null}
      {block.type === "text" ? <TextRenderer block={block} /> : null}
    </BlockErrorBoundary>
  );
}
