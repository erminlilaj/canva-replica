# AGENTS.md — Poster Studio (working name: "Postera")

Frontend-only poster builder for creating institutional/school posters (risk assessment boards, info panels, SWOT grids). Think "Canva-lite", specialized, in Albanian, for exactly one primary user.

---

## 1. The user (design north star)

The primary user is a **non-technical adult (school director/teacher, ~50s)**. Every decision must pass this test:

> "Could she do this on the first try, without anyone explaining it?"

Concrete implications — these are **requirements, not suggestions**:

- **UI language: Albanian.** All labels, buttons, tooltips, empty states, error messages. Keep an `sq.ts` strings file; no hardcoded English in components. (Code, comments, commits stay in English.)
- **No jargon.** "Shto tabelë" (Add table), not "Insert component". "Ruaj" (Save), not "Export JSON".
- **Big targets.** Minimum 40px click targets, 16px+ base font in the UI, generous spacing. Assume imprecise mouse use.
- **Forgiving by default.** Undo everything (Ctrl+Z + a visible "Zhbëj" button). Confirm before delete of a whole block. Never lose work: autosave continuously.
- **No blank-canvas paralysis.** App opens into a template gallery, not an empty page. Editing an existing example is her mode of work, not building from scratch.
- **Direct manipulation.** Click text → edit it in place. Click a block → its options appear. No modes, no hidden menus, no right-click-only actions (right-click may duplicate what's already visible, never be the only path).
- **One obvious way to do each thing.** Resist adding power-user alternatives that clutter the UI.

## 2. Scope

### In scope (v1)
- Single-page poster editor, fixed page sizes: A4, A3, A2, portrait/landscape
- Block-based content (see §5) with drag-and-drop placement and reordering
- Inline text editing, per-block color/font controls, global theme switching
- Tables with add/remove rows and columns
- Zoom in/out/fit, pan
- Undo/redo
- Autosave to IndexedDB + manual save/load as `.json` file
- Export to print-quality PDF, entirely client-side
- Template gallery seeded with the "Vlerësimi i Riskut" school poster (see §9)
- Image upload (local file → embedded dataURL)

### Out of scope (do not build, do not scaffold "for later")
- Backend, accounts, auth, sharing links, realtime collaboration
- Freeform vector drawing, pen tools, image filters
- Multi-page documents (v1 = one poster per file; user makes several files)
- Mobile editing (desktop/laptop only; a friendly "please use a computer" screen on small viewports is fine)

## 3. Tech stack

| Concern | Choice | Notes |
|---|---|---|
| Framework | **Vite + React 18 + TypeScript** | Static build, deploy to Vercel/Netlify/GitHub Pages |
| State | **Zustand** + `zundo` (or hand-rolled snapshot history) | Whole document is one serializable store |
| Rendering | **Absolutely-positioned HTML/CSS blocks** on a scaled page div — **not** canvas/Konva | See §4 rationale |
| Drag & drop | **@dnd-kit/core** for palette→page and block moving; custom pointer handlers for resize | dnd-kit is accessible and headless |
| Inline text | `contentEditable` wrapped in a controlled component, or **TipTap** if rich text (bold/italic/lists) is needed inside blocks | Start with plain contentEditable |
| Persistence | **IndexedDB** via `idb-keyval` (autosave) + File download/upload for `.json` | No localStorage — and note artifacts-style environments may block it anyway |
| PDF export | **Browser print-to-PDF** via a print stylesheet (primary) + `html2canvas`→`jsPDF` raster fallback button | See §8 |
| Icons | **lucide-react**, bundled | Curate an education/institution subset for the icon picker |
| Fonts | 3–4 self-hosted `.woff2` families | Self-hosting is mandatory for consistent PDF output |
| Styling | Tailwind or CSS modules — pick one, stay consistent | Design tokens in one `theme.ts` |

## 4. Architecture

### Core decision: structured blocks, not freeform canvas

Blocks are **forms that render to layout**. A table block owns its rows as data and lays itself out; the user edits content and the block redraws. She never positions individual text runs. This kills the hardest problems (text reflow, alignment, overlap chaos) and matches how she works.

Consequence: rendering is plain HTML/CSS. This gives us free text editing (contentEditable), free accessibility, and **vector text in PDF export** via the print pipeline. Do not introduce a canvas library.

### Document model

Single JSON document, fully serializable, versioned:

```ts
interface PosterDoc {
  version: 1;
  page: { size: 'A4'|'A3'|'A2'; orientation: 'portrait'|'landscape' };
  theme: ThemeId;            // resolves to palette + font pairing
  blocks: Block[];           // z-ordered
}

interface BlockBase {
  id: string;                // nanoid
  type: BlockType;
  frame: { x: number; y: number; w: number; h: 'auto' | number }; // in mm, page coords
  style?: BlockStyleOverrides; // per-block color/font overrides on top of theme
}
```

Each block type extends `BlockBase` with its own `data` shape (e.g. `TableBlock.data.rows: Row[]`). **All geometry in millimeters**, converted to px by the current zoom factor at render time. This makes PDF export trivial and zoom lossless.

### Layout strategy inside the page

- Blocks are absolutely positioned by `frame` (drag to move, handles to resize width; height is content-driven `auto` for most blocks).
- Snapping: to page margins, to other blocks' edges/centers, 4mm grid. Show alignment guides while dragging.
- Overlap is allowed but discouraged: when a drop would overlap >30%, nudge to the nearest free spot.

### State & history

- One Zustand store: `{ doc, selection, ui: { zoom, pan, activePanel } }`.
- History = snapshots of `doc` only (not `ui`), debounced 300ms, capped at 100 entries. Undo/redo just swaps `doc`.
- Autosave: persist `doc` to IndexedDB on every history commit; on load, offer "Vazhdo ku e le" (Continue where you left off).

### Suggested file structure

```
src/
  app/                 # shell, routing (gallery ⇄ editor)
  editor/
    Canvas.tsx         # page surface, zoom/pan, selection, guides
    Palette.tsx        # left sidebar: draggable block thumbnails
    Inspector.tsx      # right sidebar: options for selected block
    Toolbar.tsx        # top: undo, zoom, theme, save, export
  blocks/
    registry.ts        # BlockType → { component, inspector, defaultData, thumbnail }
    SectionHeader/  DataTable/  SwotGrid/  RiskCard/
    TeamList/  Checklist/  ImageFrame/  TextBlock/
  core/
    store.ts  history.ts  persistence.ts  geometry.ts  themes.ts
  export/
    printSheet.tsx     # print-route rendering at true mm size
    rasterExport.ts    # html2canvas fallback
  i18n/sq.ts
  templates/           # seeded PosterDoc JSONs
```

The **block registry** is the extension point: adding a block type = one folder + one registry entry. Never switch on block type inside Canvas/Inspector.

## 5. Block library (v1)

Each block ships with: renderer, inspector panel, sensible `defaultData` (in Albanian), palette thumbnail.

1. **SectionHeader** — full-width colored bar with title + optional number badge (the "KREU I / II" style). Options: color (from theme slots), text, badge on/off.
2. **DataTable** — the workhorse. Columns defined per-table; rows are data. Features: add/remove row (**+ button under the table and per-row ✕ on hover — must be dead obvious**), add/remove column via inspector, per-row leading icon, alternating pastel row fills, header row styling, cell text wraps and grows row height.
3. **SwotGrid** — fixed 4-column S/W/O/T with colored headers and bullet lists per cell. Options: per-column color, add/remove bullet.
4. **RiskCard** — number badge + label + stat lines (Probabiliteti / Pasoja / Risku) + mini 4-cell rating strip. Purely form-driven.
5. **TeamList** — rows of icon + role + name (the "Grupi i punës" panel).
6. **Checklist** — green-check bullet list (the "Trajtimi i riskut" style).
7. **ImageFrame** — image upload with cover/contain fit, optional caption, rounded corners toggle.
8. **TextBlock** — freeform heading/paragraph. Options: size preset (Titull / Nëntitull / Tekst), align, color.

Rule of thumb for inspectors: **max ~6 visible controls per block.** More than that → the block is too configurable; pick defaults instead.

## 6. Feature specs

### Drag & drop
- Drag a thumbnail from the palette onto the page → block appears where dropped with default data. Also support **click-to-add** (drops into first free slot) — dragging precisely is hard for some users; clicking must always work.
- Drag a placed block by its body (when not text-editing) or by an explicit grab handle that appears on hover/selection. Show ghost + alignment guides.
- Resize via corner/edge handles (min sizes per block type). Cursor changes; frame snaps to guides.
- Keyboard nudge: arrows = 1mm, Shift+arrows = 10mm.

### Text editing
- Single click selects block; **double-click (or single click on text) enters text edit** with a visible caret. Esc/click-outside exits. No separate "edit mode" toggle button.
- While editing, a minimal floating bar: bold, size preset, color. Nothing else.

### Colors & fonts
- **Themes first:** 4–6 named themes (each = palette of 6 slots + font pairing). Switching theme restyles the whole poster instantly. This is the primary way she changes colors.
- Per-block overrides: inspector shows **swatches from the theme palette** (6 big circles), plus one "custom…" swatch opening a simple picker. Never show a raw hex input as the primary control.
- Fonts: one global heading font + one body font, chosen from 3–4 bundled families via a dropdown with live preview in the dropdown itself.

### Zoom & pan
- Controls: − / % / + buttons, "Përshtat" (Fit) button, Ctrl+scroll to zoom toward cursor, Space+drag or middle-drag to pan, pinch on trackpads.
- Range 25%–400%. Zoom is a pure CSS `transform: scale()` on the page div; geometry stays in mm so nothing degrades.

### Undo/redo, autosave, files
- Ctrl+Z / Ctrl+Shift+Z + visible toolbar buttons with Albanian tooltips.
- Autosave indicator: quiet "U ruajt ✓" text in toolbar (auto, no action needed).
- "Ruaj skedar" downloads `emri-i-posterit.json`; "Hap skedar" loads one. Validate `version` on load, migrate if needed.

### Nice-to-haves (only after everything above is solid)
- Duplicate block (Ctrl+D + inspector button)
- Lock block position
- Simple onboarding overlay on first launch (3 tooltips max)
- `sendPrompt`-style "help me fill this in" AI text assist — **out of v1**

## 7. Templates & gallery

- App home = gallery grid: "Fillo nga shabllon" (start from template) cards + "Posterat e mi" (from IndexedDB) + blank page option last.
- **Seed template #1: "Vlerësimi i Riskut"** — faithful rebuild of the reference school poster: title card w/ photo, contents table, team list, context tables, SWOT grid, 9 risk cards, treatment checklist tables. This template doubles as the acceptance test for every block type.
- Templates are just `PosterDoc` JSONs in `src/templates/`. Opening one deep-copies it with fresh ids.

## 8. PDF export (client-side only)

**Primary path — print pipeline (vector text, small files):**
1. "Shkarko PDF" opens a dedicated print view: the poster rendered at true physical size (mm units), no editor chrome.
2. Inject `@page { size: A3 portrait; margin: 0; }` matching the doc, then `window.print()`. The user picks "Save as PDF".
3. Requirements: fonts self-hosted and loaded (`document.fonts.ready` before print), `print-color-adjust: exact` everywhere so pastel fills survive, images at sufficient resolution.
4. Include a one-line Albanian hint in the print dialog view: "Zgjidh 'Ruaj si PDF' dhe formatin A3" — because the browser dialog itself is the one UI we can't restyle.

**Fallback path — raster:** "Shkarko si imazh/PDF (rasterizuar)": `html2canvas` at scale 3–4 → jsPDF at page size. Use when a print shop demands a flattened file. Known limits: bigger files, softer text.

Test both paths in Chrome + Firefox early (milestone 2, not at the end). Print CSS is the riskiest part of the whole project.

## 9. Milestones

Each milestone ends in a demoable state. Do not start N+1 with N broken.

1. **M1 — Skeleton & canvas:** Vite app, store, page rendering at chosen size, zoom/pan/fit, selection, TextBlock + SectionHeader, drag/move/resize with snapping, undo/redo.
2. **M2 — Print early:** print-pipeline PDF export working for M1 blocks. (Deliberately early — it de-risks everything.)
3. **M3 — The workhorse blocks:** DataTable (rows/columns add/remove), Checklist, TeamList, inspectors, theme system + per-block color overrides.
4. **M4 — Remaining blocks:** SwotGrid, RiskCard, ImageFrame; icon picker.
5. **M5 — Persistence & gallery:** IndexedDB autosave, JSON save/load with versioning, gallery, seed "Vlerësimi i Riskut" template.
6. **M6 — Polish for mom:** Albanian copy pass on every string, empty states, confirm dialogs, keyboard nudges, raster fallback export, first-launch tips, cross-browser print test, **a live user test with the actual user** — watch her rebuild one section unaided; fix everything she stumbles on.

## 10. Conventions & guardrails for agents

- TypeScript strict; no `any` in the document model.
- All geometry math in `core/geometry.ts` with unit tests (mm↔px, snapping, overlap).
- Every user-facing string goes through `i18n/sq.ts`. PR check: grep for hardcoded Albanian/English strings in JSX.
- No new dependencies without noting why in this file. Especially: no canvas libs, no CSS frameworks beyond the chosen one, no state libs beyond Zustand.
- Do not use `localStorage`/`sessionStorage` anywhere; IndexedDB + files only.
- Performance floor: dragging must stay 60fps with 40 blocks on the page (memoize block renders; only the dragged block re-renders during drag).
- Accessibility floor: all toolbar/inspector controls keyboard-reachable, visible focus, labels on icon-only buttons.
- Before merging any block: it must render correctly in the print view too, not just the editor.

## 11. Definition of done (v1)

A non-technical user can, unaided: open the app → pick the school template → change the title, school name, and photo → edit table contents and add two rows → change the theme color → zoom to check details → and download a print-ready A3 PDF — in under 15 minutes, without losing work if she closes the tab midway.