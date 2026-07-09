export type PageSize = "A4" | "A3" | "A2";
export type PageOrientation = "portrait" | "landscape";
export type ThemeId = "school" | "fresh" | "warm" | "formal";
export type BlockType =
  | "text"
  | "section"
  | "table"
  | "swot"
  | "risk"
  | "team"
  | "checklist"
  | "image";

export interface PosterDoc {
  version: 1;
  title: string;
  page: { size: PageSize; orientation: PageOrientation };
  theme: ThemeId;
  blocks: Block[];
}

export interface Frame {
  x: number;
  y: number;
  w: number;
  h: "auto" | number;
}

export interface BlockStyleOverrides {
  colorSlot?: number;
  accent?: string;
  align?: "left" | "center" | "right";
  size?: "title" | "subtitle" | "body";
}

export interface BlockBase {
  id: string;
  type: BlockType;
  frame: Frame;
  style?: BlockStyleOverrides;
}

export interface TextBlock extends BlockBase {
  type: "text";
  data: { text: string };
}

export interface SectionHeaderBlock extends BlockBase {
  type: "section";
  data: { title: string; badge?: string };
}

export interface TableBlock extends BlockBase {
  type: "table";
  data: {
    title?: string;
    columns: string[];
    rows: string[][];
    leadingIcon?: string;
  };
}

export interface SwotGridBlock extends BlockBase {
  type: "swot";
  data: {
    riskLabel: string;
    columns: Array<{ title: string; items: string[] }>;
  };
}

export interface RiskCardBlock extends BlockBase {
  type: "risk";
  data: {
    number: number;
    label: string;
    dataCount: string;
    probability: string;
    impact: string;
    score: string;
    ratings: string[];
  };
}

export interface TeamListBlock extends BlockBase {
  type: "team";
  data: {
    title: string;
    members: Array<{ role: string; name: string }>;
  };
}

export interface ChecklistBlock extends BlockBase {
  type: "checklist";
  data: {
    title: string;
    items: string[];
  };
}

export interface ImageFrameBlock extends BlockBase {
  type: "image";
  data: {
    src?: string;
    caption?: string;
    fit: "cover" | "contain";
  };
}

export type Block =
  | TextBlock
  | SectionHeaderBlock
  | TableBlock
  | SwotGridBlock
  | RiskCardBlock
  | TeamListBlock
  | ChecklistBlock
  | ImageFrameBlock;
