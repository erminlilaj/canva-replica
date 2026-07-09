import { del, get, set } from "idb-keyval";
import { ensurePosterIdentity } from "./document";
import type { PosterDoc } from "./types";
import { validatePosterDoc } from "./validate";

const AUTOSAVE_KEY = "postera.autosave.v1";
const INDEX_KEY = "postera.index.v1";
const POSTER_KEY_PREFIX = "postera.poster.";
const COACH_MARKS_KEY = "postera.coachmarks.v1";

export interface PosterSummary {
  id: string;
  title: string;
  updatedAt: number;
}

function posterKey(id: string) {
  return `${POSTER_KEY_PREFIX}${id}`;
}

function summaryFromDoc(doc: PosterDoc): PosterSummary {
  const identified = ensurePosterIdentity(doc);
  return {
    id: identified.id as string,
    title: identified.title,
    updatedAt: identified.updatedAt as number,
  };
}

function sortIndex(index: PosterSummary[]) {
  return [...index].sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function loadPosterIndex() {
  const value = await get<PosterSummary[]>(INDEX_KEY);
  if (!Array.isArray(value)) return [];
  return sortIndex(
    value.filter(
      (item): item is PosterSummary =>
        typeof item?.id === "string" && typeof item.title === "string" && typeof item.updatedAt === "number",
    ),
  );
}

export async function savePoster(doc: PosterDoc) {
  const poster = ensurePosterIdentity(doc);
  await set(posterKey(poster.id as string), poster);
  const index = await loadPosterIndex();
  const summary = summaryFromDoc(poster);
  const nextIndex = sortIndex([summary, ...index.filter((item) => item.id !== summary.id)]);
  await set(INDEX_KEY, nextIndex);
  return { poster, index: nextIndex };
}

export async function loadPoster(id: string) {
  const value = await get<PosterDoc>(posterKey(id));
  const doc = validatePosterDoc(value);
  return doc ? ensurePosterIdentity(doc) : undefined;
}

export async function deletePoster(id: string) {
  await del(posterKey(id));
  const index = await loadPosterIndex();
  const nextIndex = index.filter((item) => item.id !== id);
  await set(INDEX_KEY, nextIndex);
  return nextIndex;
}

export async function migrateLegacyAutosave() {
  const legacy = validatePosterDoc(await get<PosterDoc>(AUTOSAVE_KEY));
  if (!legacy) return undefined;
  const migrated = ensurePosterIdentity({ ...legacy, id: undefined, updatedAt: Date.now() });
  const result = await savePoster(migrated);
  await del(AUTOSAVE_KEY);
  return result;
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
  const doc = validatePosterDoc(JSON.parse(text));
  if (!doc) {
    throw new Error("Invalid Postera file");
  }
  return ensurePosterIdentity(doc);
}

export async function hasSeenCoachMarks() {
  return (await get<boolean>(COACH_MARKS_KEY)) === true;
}

export async function markCoachMarksSeen() {
  await set(COACH_MARKS_KEY, true);
}
