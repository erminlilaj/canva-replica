import { create } from "zustand";
import { clampFrame, firstFreeFrame, pageSizeMm } from "./geometry";
import { ensurePosterIdentity, touchPoster } from "./document";
import type { PosterSummary } from "./persistence";
import type { Block, BlockType, Frame, PageOrientation, PageSize, PosterDoc, ThemeId } from "./types";
import { makeDefaultBlock } from "./defaultBlocks";
import { riskAssessmentTemplate } from "../templates/riskAssessment";

type View = "gallery" | "editor" | "print";

interface PosterState {
  doc: PosterDoc;
  posterIndex: PosterSummary[];
  posterIndexLoaded: boolean;
  saveError?: string;
  selectedIds: string[];
  view: View;
  zoom: number;
  savedState: "saved" | "saving";
  past: PosterDoc[];
  future: PosterDoc[];
  openGallery: () => void;
  openEditor: (doc: PosterDoc) => void;
  openPrint: () => void;
  setDoc: (doc: PosterDoc, commit?: boolean) => void;
  setPosterIndex: (index: PosterSummary[]) => void;
  setPosterIndexLoaded: () => void;
  setSaveError: (message?: string) => void;
  setSavedState: (state: "saved" | "saving") => void;
  setDocTitle: (title: string, historyBase?: PosterDoc) => void;
  selectBlock: (id?: string) => void;
  toggleSelectBlock: (id: string) => void;
  setPage: (page: { size?: PageSize; orientation?: PageOrientation }) => void;
  setDocumentFonts: (fonts: { heading?: string; body?: string }) => void;
  addBlock: (type: BlockType, at?: { x: number; y: number }) => void;
  updateBlock: (id: string, patch: Partial<Block>, options?: { commit?: boolean; historyBase?: PosterDoc }) => void;
  updateBlockData: <T extends Block>(
    id: string,
    data: Partial<T["data"]>,
    options?: { commit?: boolean; historyBase?: PosterDoc },
  ) => void;
  updateBlocks: (patches: Array<{ id: string; frame: Frame }>, options?: { commit?: boolean; historyBase?: PosterDoc }) => void;
  deleteBlock: (id: string) => void;
  deleteSelectedBlocks: () => void;
  duplicateBlock: (id: string) => void;
  duplicateSelectedBlocks: () => void;
  nudgeSelectedBlock: (dx: number, dy: number) => void;
  moveSelectedBlockLayer: (direction: "forward" | "backward") => void;
  setZoom: (zoom: number) => void;
  setTheme: (theme: ThemeId) => void;
  undo: () => void;
  redo: () => void;
}

function withHistory(state: PosterState, doc: PosterDoc, historyBase = state.doc) {
  return {
    doc: touchPoster(doc),
    savedState: "saving" as const,
    past: [...state.past.slice(-99), historyBase],
    future: [],
  };
}

function replaceBlock(doc: PosterDoc, id: string, updater: (block: Block) => Block): PosterDoc {
  return {
    ...doc,
    blocks: doc.blocks.map((block) => (block.id === id ? updater(block) : block)),
  };
}

export const usePosterStore = create<PosterState>((set, get) => ({
  doc: ensurePosterIdentity(riskAssessmentTemplate),
  posterIndex: [],
  posterIndexLoaded: false,
  selectedIds: [],
  view: "gallery",
  zoom: 0.55,
  savedState: "saved",
  past: [],
  future: [],
  openGallery: () => set({ view: "gallery", selectedIds: [] }),
  openEditor: (doc) => set({ doc: touchPoster(doc), view: "editor", selectedIds: [], savedState: "saving", saveError: undefined, past: [], future: [] }),
  openPrint: () => set({ view: "print", selectedIds: [] }),
  setDoc: (doc, commit = true) =>
    set((state) => (commit ? withHistory(state, doc) : { doc: touchPoster(doc), savedState: "saving" })),
  setPosterIndex: (posterIndex) => set({ posterIndex }),
  setPosterIndexLoaded: () => set({ posterIndexLoaded: true }),
  setSaveError: (saveError) => set({ saveError }),
  setSavedState: (savedState) => set({ savedState }),
  setDocTitle: (title, historyBase) => set((state) => withHistory(state, { ...state.doc, title }, historyBase)),
  selectBlock: (id) => set({ selectedIds: id ? [id] : [] }),
  toggleSelectBlock: (id) =>
    set((state) => ({
      selectedIds: state.selectedIds.includes(id)
        ? state.selectedIds.filter((selected) => selected !== id)
        : [...state.selectedIds, id],
    })),
  setPage: (page) =>
    set((state) =>
      withHistory(state, {
        ...state.doc,
        page: { ...state.doc.page, ...page },
      }),
    ),
  setDocumentFonts: (fonts) =>
    set((state) =>
      withHistory(state, {
        ...state.doc,
        fonts: { ...state.doc.fonts, ...fonts },
      }),
    ),
  addBlock: (type, at) =>
    set((state) => {
      const page = pageSizeMm(state.doc.page.size, state.doc.page.orientation);
      const baseFrame = at
        ? clampFrame({ x: at.x, y: at.y, w: Math.min(92, page.w - 20), h: "auto" }, page)
        : firstFreeFrame(state.doc.blocks.length, page);
      const block = makeDefaultBlock(type, baseFrame);
      return {
        ...withHistory(state, { ...state.doc, blocks: [...state.doc.blocks, block] }),
        selectedIds: [block.id],
      };
    }),
  updateBlock: (id, patch, options) =>
    set((state) => {
      const doc = replaceBlock(state.doc, id, (block) => ({ ...block, ...patch } as Block));
      if (options?.commit === false) {
        return { doc: touchPoster(doc), savedState: "saving" };
      }
      return withHistory(state, doc, options?.historyBase);
    }),
  updateBlockData: (id, data, options) =>
    set((state) => {
      const doc = replaceBlock(state.doc, id, (block) => ({
        ...block,
        data: { ...block.data, ...data },
      } as Block));
      if (options?.commit === false) {
        return { doc: touchPoster(doc), savedState: "saving" };
      }
      return withHistory(state, doc, options?.historyBase);
    }),
  updateBlocks: (patches, options) =>
    set((state) => {
      const frames = new Map(patches.map((patch) => [patch.id, patch.frame]));
      const doc = {
        ...state.doc,
        blocks: state.doc.blocks.map((block) => (frames.has(block.id) ? ({ ...block, frame: frames.get(block.id)! } as Block) : block)),
      };
      if (options?.commit === false) {
        return { doc: touchPoster(doc), savedState: "saving" };
      }
      return withHistory(state, doc, options?.historyBase);
    }),
  deleteBlock: (id) =>
    set((state) => ({
      ...withHistory(state, { ...state.doc, blocks: state.doc.blocks.filter((block) => block.id !== id) }),
      selectedIds: [],
    })),
  deleteSelectedBlocks: () =>
    set((state) => {
      if (state.selectedIds.length === 0) return state;
      const ids = new Set(state.selectedIds);
      return {
        ...withHistory(state, { ...state.doc, blocks: state.doc.blocks.filter((block) => !ids.has(block.id)) }),
        selectedIds: [],
      };
    }),
  duplicateBlock: (id) =>
    set((state) => {
      const block = state.doc.blocks.find((item) => item.id === id);
      if (!block) return state;
      const copy = {
        ...structuredClone(block),
        id: crypto.randomUUID(),
        frame: { ...block.frame, x: block.frame.x + 8, y: block.frame.y + 8 },
      } as Block;
      return {
        ...withHistory(state, { ...state.doc, blocks: [...state.doc.blocks, copy] }),
        selectedIds: [copy.id],
      };
    }),
  duplicateSelectedBlocks: () =>
    set((state) => {
      if (state.selectedIds.length === 0) return state;
      const ids = new Set(state.selectedIds);
      const copies: Block[] = [];
      for (const block of state.doc.blocks) {
        if (!ids.has(block.id)) continue;
        copies.push({
          ...structuredClone(block),
          id: crypto.randomUUID(),
          frame: { ...block.frame, x: block.frame.x + 8, y: block.frame.y + 8 },
        } as Block);
      }
      if (copies.length === 0) return state;
      return {
        ...withHistory(state, { ...state.doc, blocks: [...state.doc.blocks, ...copies] }),
        selectedIds: copies.map((copy) => copy.id),
      };
    }),
  nudgeSelectedBlock: (dx, dy) =>
    set((state) => {
      if (state.selectedIds.length === 0) return state;
      const page = pageSizeMm(state.doc.page.size, state.doc.page.orientation);
      const ids = new Set(state.selectedIds);
      const movable = state.doc.blocks.some((block) => ids.has(block.id) && !block.locked);
      if (!movable) return state;
      const doc = {
        ...state.doc,
        blocks: state.doc.blocks.map((block) =>
          ids.has(block.id) && !block.locked
            ? ({ ...block, frame: clampFrame({ ...block.frame, x: block.frame.x + dx, y: block.frame.y + dy }, page) } as Block)
            : block,
        ),
      };
      return withHistory(state, doc);
    }),
  moveSelectedBlockLayer: (direction) =>
    set((state) => {
      const selectedId = state.selectedIds[0];
      if (!selectedId) return state;
      const index = state.doc.blocks.findIndex((block) => block.id === selectedId);
      if (index < 0) return state;
      const nextIndex = direction === "forward" ? Math.min(state.doc.blocks.length - 1, index + 1) : Math.max(0, index - 1);
      if (index === nextIndex) return state;
      const blocks = [...state.doc.blocks];
      const [block] = blocks.splice(index, 1);
      blocks.splice(nextIndex, 0, block);
      return withHistory(state, { ...state.doc, blocks });
    }),
  setZoom: (zoom) => set({ zoom: Math.max(0.25, Math.min(4, zoom)) }),
  setTheme: (theme) => set((state) => withHistory(state, { ...state.doc, theme })),
  undo: () =>
    set((state) => {
      const previous = state.past[state.past.length - 1];
      if (!previous) return state;
      return {
        doc: previous,
        past: state.past.slice(0, -1),
        future: [state.doc, ...state.future],
        selectedIds: [],
        savedState: "saving",
      };
    }),
  redo: () =>
    set((state) => {
      const next = state.future[0];
      if (!next) return state;
      return {
        doc: next,
        past: [...state.past, state.doc],
        future: state.future.slice(1),
        selectedIds: [],
        savedState: "saving",
      };
    }),
}));
