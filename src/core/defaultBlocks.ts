import type { Block, BlockType, Frame } from "./types";
import { sq } from "../i18n/sq";

export function makeDefaultBlock(type: BlockType, frame: Frame): Block {
  const id = crypto.randomUUID();
  const d = sq.defaults;
  if (type === "section") {
    return { id, type, frame: { ...frame, w: 120 }, style: { colorSlot: 0 }, data: { title: d.sectionTitle, badge: d.sectionBadge } };
  }
  if (type === "box") {
    return {
      id,
      type,
      frame: { ...frame, w: 90, h: 38 },
      style: { colorSlot: 1, align: "center" },
      data: { text: d.boxText },
    };
  }
  if (type === "divider") {
    return { id, type, frame: { ...frame, w: 120, h: 8 }, style: { colorSlot: 0 }, data: { label: "" } };
  }
  if (type === "stat") {
    return {
      id,
      type,
      frame: { ...frame, w: 70, h: "auto" },
      style: { colorSlot: 2, align: "center" },
      data: { value: d.statValue, label: d.statLabel },
    };
  }
  if (type === "table") {
    return {
      id,
      type,
      frame: { ...frame, w: 120 },
      style: { colorSlot: 0 },
      data: {
        title: d.tableTitle,
        columns: [...d.tableColumns],
        rows: [["1", d.tableCell, ""]],
      },
    };
  }
  if (type === "swot") {
    return {
      id,
      type,
      frame: { ...frame, w: 170 },
      data: {
        riskLabel: d.swotRiskLabel,
        columns: d.swotColumns.map((column) => ({ title: column.title, items: [column.item] })),
      },
    };
  }
  if (type === "risk") {
    return {
      id,
      type,
      frame: { ...frame, w: 90 },
      style: { colorSlot: 2 },
      data: {
        number: 1,
        label: d.riskLabel,
        dataCount: d.riskDataCount,
        probability: "1.0",
        impact: "1.0",
        score: "1.0",
        ratings: [...d.riskRatings],
      },
    };
  }
  if (type === "team") {
    return {
      id,
      type,
      frame,
      style: { colorSlot: 0 },
      data: {
        title: d.teamTitle,
        members: [{ role: d.teamRole, name: d.teamName }],
      },
    };
  }
  if (type === "checklist") {
    return {
      id,
      type,
      frame,
      style: { colorSlot: 4 },
      data: { title: d.checklistTitle, items: [d.checklistItem] },
    };
  }
  if (type === "image") {
    return { id, type, frame: { ...frame, h: 70 }, data: { fit: "cover", caption: d.imageCaption } };
  }
  return {
    id,
    type: "text",
    frame,
    style: { size: "body", align: "left" },
    data: { text: d.textPlaceholder },
  };
}
