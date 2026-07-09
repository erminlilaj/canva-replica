import { create } from "zustand";
import { clampFrame, firstFreeFrame, pageSizeMm } from "./geometry";
import { ensurePosterIdentity, touchPoster } from "./document";
import type { PosterSummary } from "./persistence";
import type { Block, BlockType, PageOrientation, PageSize, PosterDoc, ThemeId } from "./types";
import { makeDefaultBlock } from "./defaultBlocks";
import { riskAssessmentTemplate } from "../templates/riskAssessment";

type View = "gallery" | "editor" | "print";

interface PosterState {
  doc: PosterDoc;
  posterIndex: PosterSummary[];
  saveError?: string;
  selectedId?: string;
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
  setSaveError: (message?: string) => void;
  setSavedState: (state: "saved" | "saving") => void;
  setDocTitle: (title: string) => void;
  selectBlock: (id?: string) => void;
  setPage: (page: { size?: PageSize; orientation?: PageOrientation }) => void;
  setDocumentFonts: (fonts: { heading?: string; body?: string }) => void;
  addBlock: (type: BlockType) => void;
  updateBlock: (id: string, patch: Partial<Block>, options?: { commit?: boolean; historyBase?: PosterDoc }) => void;
  updateBlockData: <T extends Block>(
    id: string,
    data: Partial<T["data"]>,
    options?: { commit?: boolean; historyBase?: PosterDoc },
  ) => void;
  deleteBlock: (id: string) => void;
  duplicateBlock: (id: string) => void;
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
  view: "gallery",
  zoom: 0.55,
  savedState: "saved",
  past: [],
  future: [],
  openGallery: () => set({ view: "gallery", selectedId: undefined }),
  openEditor: (doc) => set({ doc: touchPoster(doc), view: "editor", selectedId: undefined, savedState: "saving", saveError: undefined, past: [], future: [] }),
  openPrint: () => set({ view: "print", selectedId: undefined }),
  setDoc: (doc, commit = true) =>
    set((state) => (commit ? withHistory(state, doc) : { doc: touchPoster(doc), savedState: "saving" })),
  setPosterIndex: (posterIndex) => set({ posterIndex }),
  setSaveError: (saveError) => set({ saveError }),
  setSavedState: (savedState) => set({ savedState }),
  setDocTitle: (title) => set((state) => withHistory(state, { ...state.doc, title })),
  selectBlock: (selectedId) => set({ selectedId }),
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
  addBlock: (type) =>
    set((state) => {
      const page = pageSizeMm(state.doc.page.size, state.doc.page.orientation);
      const block = makeDefaultBlock(type, firstFreeFrame(state.doc.blocks.length, page));
      return {
        ...withHistory(state, { ...state.doc, blocks: [...state.doc.blocks, block] }),
        selectedId: block.id,
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
  deleteBlock: (id) =>
    set((state) => ({
      ...withHistory(state, { ...state.doc, blocks: state.doc.blocks.filter((block) => block.id !== id) }),
      selectedId: undefined,
    })),
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
        selectedId: copy.id,
      };
    }),
  nudgeSelectedBlock: (dx, dy) =>
    set((state) => {
      if (!state.selectedId) return state;
      const page = pageSizeMm(state.doc.page.size, state.doc.page.orientation);
      const doc = replaceBlock(state.doc, state.selectedId, (block) => ({
        ...block,
        frame: clampFrame({ ...block.frame, x: block.frame.x + dx, y: block.frame.y + dy }, page),
      } as Block));
      return withHistory(state, doc);
    }),
  moveSelectedBlockLayer: (direction) =>
    set((state) => {
      if (!state.selectedId) return state;
      const index = state.doc.blocks.findIndex((block) => block.id === state.selectedId);
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
        selectedId: undefined,
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
        selectedId: undefined,
        savedState: "saving",
      };
    }),
}));
