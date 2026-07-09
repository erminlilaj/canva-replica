import { get, set } from "idb-keyval";
import type { PosterDoc } from "./types";

const AUTOSAVE_KEY = "postera.autosave.v1";

export async function saveAutosave(doc: PosterDoc) {
  await set(AUTOSAVE_KEY, doc);
}

export async function loadAutosave() {
  const value = await get<PosterDoc>(AUTOSAVE_KEY);
  return value?.version === 1 ? value : undefined;
}

export function downloadPoster(doc: PosterDoc) {
  const blob = new Blob([JSON.stringify(doc, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${doc.title.toLowerCase().replace(/\s+/g, "-")}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export async function readPosterFile(file: File) {
  const text = await file.text();
  const doc = JSON.parse(text) as PosterDoc;
  if (doc.version !== 1 || !Array.isArray(doc.blocks)) {
    throw new Error("Invalid Postera file");
  }
  return doc;
}
