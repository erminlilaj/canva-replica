import { ChangeEvent, useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowUp, Copy, Trash2, Upload } from "lucide-react";
import { sq } from "../i18n/sq";
import { themes } from "../core/themes";
import { usePosterStore } from "../core/store";
import { iconOptions } from "../blocks/icons";
import type { BlockStyleOverrides, ChecklistBlock, ImageFrameBlock, RiskCardBlock, SwotGridBlock, TableBlock, TeamListBlock } from "../core/types";

const fontOptions = ["Inter, sans-serif", "Source Sans 3, sans-serif", "Merriweather, serif"];

function IconPicker({
  value,
  onChange,
  allowNone,
}: {
  value: string | undefined;
  onChange: (icon: string | undefined) => void;
  allowNone?: boolean;
}) {
  return (
    <div className="icon-picker">
      {allowNone ? (
        <button type="button" className={`icon-picker-none ${!value ? "active" : ""}`} title={sq.inspector.noIcon} onClick={() => onChange(undefined)}>
          {sq.inspector.noIcon}
        </button>
      ) : null}
      {Object.entries(iconOptions).map(([id, Icon]) => (
        <button
          key={id}
          type="button"
          className={value === id ? "active" : ""}
          aria-label={id}
          title={id}
          onClick={() => onChange(id)}
        >
          <Icon size={16} />
        </button>
      ))}
    </div>
  );
}

export function Inspector() {
  const imageInputRef = useRef<HTMLInputElement>(null);
  const doc = usePosterStore((state) => state.doc);
  const selectedIds = usePosterStore((state) => state.selectedIds);
  const updateBlock = usePosterStore((state) => state.updateBlock);
  const updateBlockData = usePosterStore((state) => state.updateBlockData);
  const deleteBlock = usePosterStore((state) => state.deleteBlock);
  const deleteSelectedBlocks = usePosterStore((state) => state.deleteSelectedBlocks);
  const duplicateBlock = usePosterStore((state) => state.duplicateBlock);
  const duplicateSelectedBlocks = usePosterStore((state) => state.duplicateSelectedBlocks);
  const moveSelectedBlockLayer = usePosterStore((state) => state.moveSelectedBlockLayer);
  const selectedId = selectedIds.length === 1 ? selectedIds[0] : undefined;
  const block = doc.blocks.find((item) => item.id === selectedId);
  const theme = themes[doc.theme];
  const imageSrc = block?.type === "image" ? block.data.src : undefined;
  const [lowResPhoto, setLowResPhoto] = useState(false);

  useEffect(() => {
    if (!imageSrc) {
      setLowResPhoto(false);
      return;
    }
    const probe = new window.Image();
    probe.onload = () => setLowResPhoto(Math.max(probe.naturalWidth, probe.naturalHeight) < 1000);
    probe.src = imageSrc;
  }, [imageSrc]);

  if (selectedIds.length > 1) {
    return (
      <aside className="side-panel inspector">
        <h2>{sq.inspector.title}</h2>
        <p>{sq.inspector.multiSelected(selectedIds.length)}</p>
        <div className="inspector-actions">
          <button onClick={() => duplicateSelectedBlocks()}>
            <Copy size={18} />
            {sq.inspector.duplicate}
          </button>
          <button
            className="danger"
            onClick={() => {
              if (window.confirm(sq.inspector.confirmDelete)) deleteSelectedBlocks();
            }}
          >
            <Trash2 size={18} />
            {sq.inspector.delete}
          </button>
        </div>
      </aside>
    );
  }

  if (!block) {
    return (
      <aside className="side-panel inspector">
        <h2>{sq.inspector.title}</h2>
        <p>{sq.inspector.empty}</p>
      </aside>
    );
  }

  const setColor = (colorSlot: number) => updateBlock(block.id, { style: { ...block.style, colorSlot, accent: undefined } });
  const setCustomColor = (accent: string) => updateBlock(block.id, { style: { ...block.style, accent } });
  const addRow = () => {
    if (block.type !== "table") return;
    updateBlockData<TableBlock>(block.id, {
      rows: [...block.data.rows, block.data.columns.map(() => "")],
    });
  };
  const addColumn = () => {
    if (block.type !== "table") return;
    updateBlockData<TableBlock>(block.id, {
      columns: [...block.data.columns, sq.inspector.newColumnName(block.data.columns.length + 1)],
      rows: block.data.rows.map((row) => [...row, ""]),
    });
  };
  const handleImageFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || block.type !== "image") return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        updateBlockData<ImageFrameBlock>(block.id, { src: reader.result });
      }
    };
    reader.readAsDataURL(file);
    event.target.value = "";
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
      <label>
        {sq.inspector.customColor}
        <input type="color" value={block.style?.accent ?? theme.slots[block.style?.colorSlot ?? 0]} onChange={(event) => setCustomColor(event.target.value)} />
      </label>
      {block.type === "text" ? (
        <div className="compact-controls">
          <label>
            {sq.inspector.size}
            <select
              value={block.style?.size ?? "body"}
              onChange={(event) =>
                updateBlock(block.id, { style: { ...block.style, size: event.target.value as BlockStyleOverrides["size"] } })
              }
            >
              <option value="title">{sq.inspector.titleSize}</option>
              <option value="subtitle">{sq.inspector.subtitleSize}</option>
              <option value="body">{sq.inspector.bodySize}</option>
            </select>
          </label>
          <label>
            {sq.inspector.align}
            <select
              value={block.style?.align ?? "left"}
              onChange={(event) =>
                updateBlock(block.id, { style: { ...block.style, align: event.target.value as BlockStyleOverrides["align"] } })
              }
            >
              <option value="left">{sq.inspector.left}</option>
              <option value="center">{sq.inspector.center}</option>
              <option value="right">{sq.inspector.right}</option>
            </select>
          </label>
          <label>
            {sq.toolbar.bodyFont}
            <select
              value={block.style?.fontFamily ?? ""}
              onChange={(event) => updateBlock(block.id, { style: { ...block.style, fontFamily: event.target.value || undefined } })}
            >
              <option value="">--</option>
              {fontOptions.map((font) => (
                <option key={font} value={font}>
                  {font.split(",")[0]}
                </option>
              ))}
            </select>
          </label>
        </div>
      ) : null}
      {block.type === "table" ? (
        <div className="inspector-actions">
          <button onClick={addRow}>{sq.inspector.addRow}</button>
          <button onClick={addColumn}>{sq.inspector.addColumn}</button>
          <div className="control-label">{sq.inspector.icon}</div>
          <IconPicker
            value={block.data.leadingIcon}
            allowNone
            onChange={(icon) => updateBlockData<TableBlock>(block.id, { leadingIcon: icon })}
          />
        </div>
      ) : null}
      {block.type === "checklist" ? (
        <div className="inspector-actions">
          <button onClick={() => updateBlockData<ChecklistBlock>(block.id, { items: [...block.data.items, sq.inspector.newChecklistItem] })}>{sq.inspector.addItem}</button>
        </div>
      ) : null}
      {block.type === "team" ? (
        <div className="inspector-actions">
          <button onClick={() => updateBlockData<TeamListBlock>(block.id, { members: [...block.data.members, { role: sq.inspector.newMemberRole, name: sq.inspector.newMemberName }] })}>
            {sq.inspector.addMember}
          </button>
          <div className="control-label">{sq.inspector.icon}</div>
          <IconPicker value={block.data.icon} onChange={(icon) => updateBlockData<TeamListBlock>(block.id, { icon })} />
        </div>
      ) : null}
      {block.type === "swot" ? (
        <div className="inspector-actions">
          {block.data.columns.map((column, index) => (
            <button
              key={index}
              onClick={() => {
                const columns = block.data.columns.map((entry, columnIndex) =>
                  columnIndex === index ? { ...entry, items: [...entry.items, sq.inspector.newChecklistItem] } : entry,
                );
                updateBlockData<SwotGridBlock>(block.id, { columns });
              }}
            >
              {sq.inspector.addItem}: {column.title}
            </button>
          ))}
        </div>
      ) : null}
      {block.type === "risk" ? (
        <div className="inspector-actions">
          <button onClick={() => updateBlockData<RiskCardBlock>(block.id, { ratings: [...block.data.ratings, "1 x 1 = 1"] })}>{sq.inspector.addRating}</button>
        </div>
      ) : null}
      {block.type === "image" ? (
        <div className="inspector-actions">
          <button onClick={() => imageInputRef.current?.click()}>
            <Upload size={18} />
            {sq.inspector.changePhoto}
          </button>
          <select value={block.data.fit} onChange={(event) => updateBlockData<ImageFrameBlock>(block.id, { fit: event.target.value as ImageFrameBlock["data"]["fit"] })}>
            <option value="cover">{sq.inspector.fitCover}</option>
            <option value="contain">{sq.inspector.fitContain}</option>
          </select>
          <input ref={imageInputRef} className="hidden-input" type="file" accept="image/*" onChange={handleImageFile} />
          {lowResPhoto ? <p className="inspector-warning">{sq.inspector.lowResPhoto}</p> : null}
        </div>
      ) : null}
      <div className="inspector-actions">
        <button onClick={() => moveSelectedBlockLayer("forward")}>
          <ArrowUp size={18} />
          {sq.inspector.forward}
        </button>
        <button onClick={() => moveSelectedBlockLayer("backward")}>
          <ArrowDown size={18} />
          {sq.inspector.backward}
        </button>
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
