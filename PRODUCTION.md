# PRODUCTION.md — Postera production-readiness checklist

Status as of commit `f42b9db` ("Expand poster editor core features"): builds clean, 3/3 tests pass, core editing loop works. This file lists everything between the current state and "safe to hand to a non-technical daily user." Work top to bottom; P0 items are blocking, in order of severity. Check items off in this file as they land, one commit (or small PR) per numbered item.

Definition of done for the whole list is unchanged from AGENTS.md §11: she can open the app, pick a template, edit it, and print an A3 PDF unaided — **and cannot lose work or crash into a white screen while doing it.**

---

## P0 — Blocking: data loss & crash recovery

### 1. Multi-poster storage (replaces the single autosave slot)

**Problem:** `src/core/persistence.ts` has exactly one IndexedDB key (`postera.autosave.v1`). Opening any template overwrites it — editing poster A, then clicking template B "just to look," silently destroys A.

**Required behavior:**
- [x] Give every working document an identity: add `id: string` (uuid) and `updatedAt: number` to `PosterDoc` (bump nothing — keep `version: 1`, these fields are additive; loader must tolerate their absence and generate them).
- [x] Store each poster under its own key: `postera.poster.{id}` via `idb-keyval`. Maintain an index key `postera.index.v1` = array of `{ id, title, updatedAt }` for cheap gallery listing (avoid `keys()` scans).
- [x] Opening a template = `freshCopy` with a **new id** → it autosaves as a new poster, never touching existing ones. Opening from "Posterat e mi" = load by id, autosave back to the **same** id.
- [x] Gallery: replace the single "Vazhdo" card with a real "Posterat e mi" section listing saved posters (title + "modifikuar më {date}" + delete button with confirm). Most recently updated first. Keep a one-click "Vazhdo ku e le" card for the most recent poster at the top.
- [x] Editable poster title: the doc `title` currently only feeds the JSON filename. Surface it as an editable field in the Toolbar so gallery entries have meaningful names. Default new-from-template titles to `{template} — {d MMM}`.
- [x] Migration: on boot, if legacy `postera.autosave.v1` exists, import it as a poster with a fresh id, then delete the legacy key.
- [x] Cap + guardrail: if a save throws (IndexedDB quota, notably possible with large embedded images), catch it, set a visible warning state instead of the false "U ruajt ✓", and prompt the user to download the JSON. **Never fail silently.**

**Files:** `persistence.ts`, `store.ts` (openEditor/openGallery), `App.tsx` (autosave effect keys by doc id), `Gallery.tsx`, `Toolbar.tsx`, `types.ts`, `sq.ts`.

### 2. Autosave flush on exit

**Problem:** the 350 ms debounce in `App.tsx` means closing the tab right after a change drops it.

- [x] On `visibilitychange` → `hidden` and on `pagehide`, synchronously kick a final `savePoster(doc)` if state is `"saving"` (fire the promise; IndexedDB writes usually survive tab close — `pagehide` is more reliable than `beforeunload` for this).
- [x] Additionally, `beforeunload`: if `savedState === "saving"`, set `event.returnValue` to trigger the native "leave site?" prompt as a belt-and-suspenders.

### 3. Strict file/doc validation + error boundary

**Problem:** `readPosterFile` checks only `version === 1 && Array.isArray(blocks)`. A structurally invalid block passes, a renderer throws, the app white-screens — and because the broken doc may autosave, it can white-screen **on every reload**.

- [x] Write `validatePosterDoc(value: unknown): PosterDoc | null` in `core/validate.ts` (no new deps; hand-rolled checks are fine): known `page.size`/`orientation`/`theme` (unknown theme → fall back to `"school"`, don't reject), every block has known `type`, string `id`, numeric `frame.x/y/w` and `h` number-or-`"auto"`, and per-type `data` shape (arrays are arrays, strings are strings). Drop invalid blocks with a console.warn rather than rejecting the whole file when ≥1 block is valid; reject entirely only if the envelope is wrong.
- [x] Use it in `readPosterFile` AND on every IndexedDB load (a bad doc must not boot-loop the app).
- [x] Add a top-level React error boundary in `App.tsx`: friendly Albanian message + "Kthehu te galeria" button that resets `view` to gallery **without** wiping stored posters. Log the error to console.
- [x] Per-block safety net: wrap `BlockRenderer` output in a tiny inner boundary that renders a small "Blloku nuk u shfaq dot" placeholder instead of taking down the page.
- [x] Unit tests: valid doc passes; wrong version, malformed frame, unknown block type, non-array rows each handled as specified.

---

## P1 — Functional gaps a daily user hits in week one

### 4. Remove *specific* rows/items, not just the last one

**Problem:** all removal actions (`Inspector.tsx`) are `slice(0, -1)` — deleting row 3 of 10 is impossible without destroying 4–10.

- [x] Table: on hover over a row in the canvas, show a small ✕ at the row's right edge (position: absolute, outside the table border) that deletes **that** row. Same pattern for a ✕ under each column header. Keep the inspector "add" buttons; the last-item remove buttons can go.
- [x] Checklist items, team members, SWOT bullets, risk ratings: same per-item ✕-on-hover treatment in their renderers.
- [x] Guards: tables keep ≥1 column; deleting the last row is allowed (empty tbody must render without crashing — test it).
- [x] All ✕ buttons: ≥ 24 px hit area, `aria-label` from `sq.ts`, hidden in PrintView (they're inside renderers — gate on a `readOnly` prop or CSS `.print-view .row-remove { display:none }`).
- [x] These are data edits → they go through `updateBlockData` normally (single history entry each). Verify undo restores the deleted row.

### 5. Height resize + second handle

**Problem:** resize adjusts width only (`Canvas.tsx` `moveDrag`, `mode === "resize"`), so images/boxes can't be sized vertically.

- [x] Corner (SE) handle resizes **both** w and h. For blocks whose `frame.h === "auto"` (text, tables, lists) keep height auto and let the corner handle change width only — do not force numeric heights onto content-driven blocks.
- [x] For `image`, `box`, `divider` (numeric h): min height 10 mm, clamp inside page (`clampFrame` currently assumes h≈20 when `"auto"` — extend it to clamp numeric h properly; add a geometry test).
- [x] Optional but cheap: separate E (width-only) and S (height-only) edge handles on numeric-h blocks.

### 6. Print correctness pass

- [x] **Delete the static `@page { size: A3 portrait }` rule at `global.css:764–767`.** It conflicts with the dynamic `@page` injected by `PrintView.tsx`; cascade order currently decides the page size for A4/landscape docs. The injected rule must be the only `@page` in the app.
- [x] Point all four themes' `headingFont`/`bodyFont` in `themes.ts` at the **bundled** families (Inter / Source Sans 3 / Merriweather with generic fallbacks) instead of Arial/Georgia/Trebuchet/Verdana. Self-hosted fonts exist precisely so output is identical on every machine; system-font defaults defeat that.
- [x] Verify `.print-hint`, block selection outlines, and grab/resize/✕ handles are all `display:none` under `@media print`.
- [x] Images: warn (small toast/inspector note) when an uploaded image is < ~1000 px on its long edge — it will print blurry at A3.
- [ ] **Manual test matrix (do this, record results in this file):** Chrome + Firefox × A4-portrait, A3-portrait, A4-landscape (certificate template) → page size correct, no scaling/cropping, pastel fills present, fonts identical. Windows + one other OS if available. *(Requires a human at the print dialog — pending.)*
  - [ ] Chrome results: __
  - [ ] Firefox results: __

### 7. Full-canvas usability details

- [x] Zoom toward cursor: `handleWheel` currently zooms around center; adjust `scrollLeft/Top` so the point under the cursor stays fixed.
- [x] Alignment guides: while dragging, snap to other blocks' left/center/right and top/middle/bottom edges within a 2 mm threshold, drawing a 1 px guide line. Grid snap (4 mm) stays as fallback. Pure render-time computation — no state model changes.
- [x] `softColor()` in `registry.tsx` ignores `style.accent`: a custom-colored block keeps its old themed pastel background. Derive a soft tint from the accent (e.g. accent at ~12% opacity over white) so custom colors look coherent.
- [x] Delete key currently `window.confirm`s every time; keep confirm for Delete-key and inspector both, but make Undo the real safety net and say so in the confirm text ("Mund ta kthesh me Zhbëj").

---

## P2 — Production hygiene

### 8. i18n stragglers
- [x] Move to `sq.ts`: `"Pikë e re"` (Inspector ×2), `{ role: "rol", name: "Emri Mbiemri" }`, `` `Kolona ${n}` ``, and any defaults inside `defaultBlocks.ts` that aren't already there.
- [x] Add a guard: `npm run check:i18n` script that greps `src/editor src/blocks` for `"[A-ZÇË][a-zçë]` string literals in JSX and fails CI on new offenders (crude is fine).

### 9. CI + deploy
- [x] `.github/workflows/ci.yml`: on push/PR → `npm ci`, `npm run build`, `npm test`. Node 20.
- [x] Decide hosting: **Vercel** (zero config for Vite; `dist` output, no `base` change needed).
- [x] README: add "Si ta publikosh" section + English one-paragraph summary at top for repo visitors.

### 10. App shell polish
- [x] Favicon + `<meta name="description">` (Albanian) + `theme-color` in `index.html`.
- [x] Small-viewport gate: below 980px width the editor already shows a friendly full-screen message instead of a broken editor (existing `.small-screen` rule); the gallery reflows to a single column and stays usable, so it isn't gated.
- [x] Loading state: gallery reads IndexedDB async — show a skeleton, not a flash of "no posters."

### 11. Test floor (keep it small but real)
- [x] `validate.ts` tests (item 3).
- [x] `clampFrame` with numeric h + `firstFreeFrame` never places outside page (item 5).
- [x] Store logic tests (plain function calls on the zustand store, no DOM): drag commit produces exactly one history entry; undo after row-delete restores the row; `duplicateBlock` deep-copies (mutating the copy's data must not touch the original).
- [x] One smoke test with `@testing-library/react`: app renders gallery, clicking the risk template opens the editor. (Only new dev-dep allowed for this checklist: `@testing-library/react` + `jsdom`.)

---

## P3 — Post-launch niceties (do not block release)

- [x] Floating mini text bar (size / align / color) on text edit, so text styling doesn't require the inspector. *(Bold dropped: the doc model stores plain `innerText`, not HTML — a real bold toggle needs rich-text storage, which AGENTS.md §3 explicitly defers to a future TipTap migration. Color swatches added instead, matching the inspector's existing controls.)*
- [x] Icon picker: wire `TableBlock.leadingIcon` and TeamList row icons to a curated ~30-icon Lucide subset. *(Team icon applies to the whole member list rather than per-row — the reference template already uses one icon for every row, and per-member pickers would exceed the ~6-control inspector guideline in AGENTS.md.)*
- [x] Drag-from-palette in addition to click-to-add (drop at pointer position). Only reintroduce dnd-kit if built; otherwise reuse the existing pointer-drag machinery. *(Custom pointer tracking, no dnd-kit; verify live in the final end-to-end pass.)*
- [x] Multi-select (shift-click) + group move. *(Store field renamed `selectedId` → `selectedIds: string[]`; Inspector shows shared duplicate/delete actions when >1 selected, falls back to the normal single-block panel otherwise. Resize handles and layer reorder still act on one block at a time.)*
- [x] Lock block toggle.
- [x] "Dyfisho posterin" (duplicate whole poster) in gallery.
- [ ] First-launch coach marks (max 3 tooltips: palette → canvas → export).

---

## Release gate

Ship when every P0/P1/P2 box is checked **and** this manual scenario passes on a machine that isn't the developer's, performed by someone who didn't build it:

1. Open app → pick risk template → change title, school name, upload a photo.
2. Edit table cells; add 2 rows; delete a **middle** row; undo; redo.
3. Switch theme; set one block to a custom color.
4. Close the tab mid-edit without downloading anything. Reopen → poster is in "Posterat e mi" with all changes.
5. Open a second template, edit briefly, go back → **both** posters listed, both intact.
6. Export A3 PDF from Chrome and Firefox → correct size, colors, fonts.
7. Load a deliberately corrupted `.json` → clear Albanian error, app stays usable, stored posters untouched.

If any step needs explanation, the step is the bug.
