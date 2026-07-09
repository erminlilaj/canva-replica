import { themes } from "./themes";
import type {
  Block,
  BlockStyleOverrides,
  BlockType,
  Frame,
  PageOrientation,
  PageSize,
  PosterDoc,
  ThemeId,
} from "./types";

const blockTypes: BlockType[] = ["text", "box", "divider", "stat", "section", "table", "swot", "risk", "team", "checklist", "image"];
const pageSizes: PageSize[] = ["A4", "A3", "A2"];
const orientations: PageOrientation[] = ["portrait", "landscape"];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function asString(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function stringArray(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function validateFrame(value: unknown): Frame | null {
  if (!isRecord(value)) return null;
  const { x, y, w, h } = value;
  if (typeof x !== "number" || typeof y !== "number" || typeof w !== "number") return null;
  if (h !== "auto" && typeof h !== "number") return null;
  return { x, y, w, h };
}

function validateStyle(value: unknown): BlockStyleOverrides | undefined {
  if (!isRecord(value)) return undefined;
  return {
    colorSlot: typeof value.colorSlot === "number" ? value.colorSlot : undefined,
    accent: typeof value.accent === "string" ? value.accent : undefined,
    align: value.align === "left" || value.align === "center" || value.align === "right" ? value.align : undefined,
    size: value.size === "title" || value.size === "subtitle" || value.size === "body" ? value.size : undefined,
    fontFamily: typeof value.fontFamily === "string" ? value.fontFamily : undefined,
  };
}

function validateBlock(value: unknown): Block | null {
  if (!isRecord(value) || typeof value.id !== "string" || !blockTypes.includes(value.type as BlockType)) return null;
  const frame = validateFrame(value.frame);
  if (!frame || !isRecord(value.data)) return null;
  const base = { id: value.id, type: value.type as BlockType, frame, style: validateStyle(value.style) };
  const data = value.data;

  if (base.type === "text") return { ...base, type: "text", data: { text: asString(data.text) } };
  if (base.type === "box") return { ...base, type: "box", data: { text: asString(data.text) } };
  if (base.type === "divider") return { ...base, type: "divider", data: { label: asString(data.label) } };
  if (base.type === "stat") return { ...base, type: "stat", data: { value: asString(data.value), label: asString(data.label) } };
  if (base.type === "section") return { ...base, type: "section", data: { title: asString(data.title), badge: asString(data.badge) } };
  if (base.type === "table") {
    const columns = stringArray(data.columns);
    if (!Array.isArray(data.rows) || columns.length === 0) return null;
    const rows = data.rows
      .filter(Array.isArray)
      .map((row) => columns.map((_, index) => (typeof row[index] === "string" ? row[index] : "")));
    return { ...base, type: "table", data: { title: asString(data.title), columns, rows, leadingIcon: asString(data.leadingIcon) } };
  }
  if (base.type === "swot") {
    if (!Array.isArray(data.columns)) return null;
    const columns = data.columns
      .filter(isRecord)
      .map((column) => ({ title: asString(column.title), items: stringArray(column.items) }));
    if (columns.length === 0) return null;
    return { ...base, type: "swot", data: { riskLabel: asString(data.riskLabel), columns } };
  }
  if (base.type === "risk") {
    return {
      ...base,
      type: "risk",
      data: {
        number: typeof data.number === "number" ? data.number : 1,
        label: asString(data.label),
        dataCount: asString(data.dataCount),
        probability: asString(data.probability),
        impact: asString(data.impact),
        score: asString(data.score),
        ratings: stringArray(data.ratings),
      },
    };
  }
  if (base.type === "team") {
    if (!Array.isArray(data.members)) return null;
    return {
      ...base,
      type: "team",
      data: {
        title: asString(data.title),
        members: data.members.filter(isRecord).map((member) => ({ role: asString(member.role), name: asString(member.name) })),
      },
    };
  }
  if (base.type === "checklist") return { ...base, type: "checklist", data: { title: asString(data.title), items: stringArray(data.items) } };
  if (base.type === "image") {
    return {
      ...base,
      type: "image",
      data: {
        src: typeof data.src === "string" ? data.src : undefined,
        caption: typeof data.caption === "string" ? data.caption : undefined,
        fit: data.fit === "contain" ? "contain" : "cover",
      },
    };
  }
  return null;
}

export function validatePosterDoc(value: unknown): PosterDoc | null {
  if (!isRecord(value) || value.version !== 1 || !isRecord(value.page) || !Array.isArray(value.blocks)) return null;
  const size = pageSizes.includes(value.page.size as PageSize) ? (value.page.size as PageSize) : null;
  const orientation = orientations.includes(value.page.orientation as PageOrientation) ? (value.page.orientation as PageOrientation) : null;
  if (!size || !orientation) return null;
  const blocks = value.blocks.map(validateBlock).filter((block): block is Block => {
    if (!block) console.warn("Dropped invalid Postera block during validation.");
    return Boolean(block);
  });
  if (value.blocks.length > 0 && blocks.length === 0) return null;
  const theme = Object.keys(themes).includes(value.theme as string) ? (value.theme as ThemeId) : "school";
  return {
    version: 1,
    id: typeof value.id === "string" ? value.id : undefined,
    title: asString(value.title, "Poster pa emër"),
    updatedAt: typeof value.updatedAt === "number" ? value.updatedAt : undefined,
    page: { size, orientation },
    theme,
    fonts: isRecord(value.fonts)
      ? {
          heading: typeof value.fonts.heading === "string" ? value.fonts.heading : undefined,
          body: typeof value.fonts.body === "string" ? value.fonts.body : undefined,
        }
      : undefined,
    blocks,
  };
}
