import type { PosterDoc } from "./types";

export function newId() {
  return crypto.randomUUID();
}

export function ensurePosterIdentity(doc: PosterDoc): PosterDoc {
  return {
    ...doc,
    id: doc.id ?? newId(),
    updatedAt: typeof doc.updatedAt === "number" ? doc.updatedAt : Date.now(),
  };
}

export function touchPoster(doc: PosterDoc): PosterDoc {
  return {
    ...ensurePosterIdentity(doc),
    updatedAt: Date.now(),
  };
}

export function copyAsNewPoster(doc: PosterDoc, title?: string): PosterDoc {
  return {
    ...structuredClone(doc),
    id: newId(),
    title: title ?? doc.title,
    updatedAt: Date.now(),
    blocks: doc.blocks.map((block) => ({ ...structuredClone(block), id: newId() })),
  };
}
