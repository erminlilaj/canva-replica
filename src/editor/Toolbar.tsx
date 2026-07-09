import { ArrowLeft, Download, FileDown, FolderOpen, Minus, Plus, Printer, Redo2, Undo2 } from "lucide-react";
import { ChangeEvent, useRef } from "react";
import { themes } from "../core/themes";
import { downloadPoster, readPosterFile } from "../core/persistence";
import { usePosterStore } from "../core/store";
import { sq } from "../i18n/sq";
import type { PageOrientation, PageSize, ThemeId } from "../core/types";

const fontOptions = ["Inter, sans-serif", "Source Sans 3, sans-serif", "Merriweather, serif"];

export function Toolbar() {
  const fileRef = useRef<HTMLInputElement>(null);
  const doc = usePosterStore((state) => state.doc);
  const zoom = usePosterStore((state) => state.zoom);
  const savedState = usePosterStore((state) => state.savedState);
  const saveError = usePosterStore((state) => state.saveError);
  const openGallery = usePosterStore((state) => state.openGallery);
  const openEditor = usePosterStore((state) => state.openEditor);
  const openPrint = usePosterStore((state) => state.openPrint);
  const setZoom = usePosterStore((state) => state.setZoom);
  const setTheme = usePosterStore((state) => state.setTheme);
  const setPage = usePosterStore((state) => state.setPage);
  const setDocumentFonts = usePosterStore((state) => state.setDocumentFonts);
  const setDocTitle = usePosterStore((state) => state.setDocTitle);
  const undo = usePosterStore((state) => state.undo);
  const redo = usePosterStore((state) => state.redo);

  const handleFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      openEditor(await readPosterFile(file));
    } catch {
      window.alert(sq.file.invalid);
    } finally {
      event.target.value = "";
    }
  };

  return (
    <header className="toolbar">
      <button
        className="icon-text"
        onClick={() => {
          if (savedState === "saving" && !window.confirm(sq.toolbar.leaveUnsaved)) return;
          openGallery();
        }}
      >
        <ArrowLeft size={20} />
        {sq.toolbar.back}
      </button>
      <div className="toolbar-group">
        <button aria-label={sq.toolbar.undo} title={sq.toolbar.undo} onClick={undo}>
          <Undo2 size={20} />
        </button>
        <button aria-label={sq.toolbar.redo} title={sq.toolbar.redo} onClick={redo}>
          <Redo2 size={20} />
        </button>
      </div>
      <div className="toolbar-group">
        <button aria-label={sq.toolbar.zoomOut} title={sq.toolbar.zoomOut} onClick={() => setZoom(zoom - 0.1)}>
          <Minus size={20} />
        </button>
        <span className="zoom-value">{Math.round(zoom * 100)}%</span>
        <button aria-label={sq.toolbar.zoomIn} title={sq.toolbar.zoomIn} onClick={() => setZoom(zoom + 0.1)}>
          <Plus size={20} />
        </button>
        <button onClick={() => window.dispatchEvent(new CustomEvent("postera:fit-page"))}>{sq.toolbar.fit}</button>
      </div>
      <label className="theme-picker">
        {sq.toolbar.title}
        <input className="title-input" value={doc.title} onChange={(event) => setDocTitle(event.target.value)} />
      </label>
      <label className="theme-picker">
        {sq.toolbar.pageSize}
        <select value={doc.page.size} onChange={(event) => setPage({ size: event.target.value as PageSize })}>
          <option value="A4">A4</option>
          <option value="A3">A3</option>
          <option value="A2">A2</option>
        </select>
      </label>
      <label className="theme-picker">
        {sq.toolbar.orientation}
        <select value={doc.page.orientation} onChange={(event) => setPage({ orientation: event.target.value as PageOrientation })}>
          <option value="portrait">{sq.toolbar.portrait}</option>
          <option value="landscape">{sq.toolbar.landscape}</option>
        </select>
      </label>
      <label className="theme-picker">
        {sq.toolbar.theme}
        <select value={doc.theme} onChange={(event) => setTheme(event.target.value as ThemeId)}>
          {Object.values(themes).map((theme) => (
            <option key={theme.id} value={theme.id}>
              {theme.name}
            </option>
          ))}
        </select>
      </label>
      <label className="theme-picker compact-picker">
        {sq.toolbar.bodyFont}
        <select value={doc.fonts?.body ?? ""} onChange={(event) => setDocumentFonts({ body: event.target.value || undefined })}>
          <option value="">--</option>
          {fontOptions.map((font) => (
            <option key={font} value={font}>
              {font.split(",")[0]}
            </option>
          ))}
        </select>
      </label>
      <div className="toolbar-spacer" />
      <span className={`save-state ${saveError ? "save-error" : ""}`}>{saveError ?? (savedState === "saved" ? sq.toolbar.saved : sq.toolbar.saving)}</span>
      <button className="icon-text" onClick={() => downloadPoster(doc)}>
        <Download size={20} />
        {sq.toolbar.saveFile}
      </button>
      <button className="icon-text" onClick={() => fileRef.current?.click()}>
        <FolderOpen size={20} />
        {sq.toolbar.openFile}
      </button>
      <button className="primary-action" onClick={openPrint}>
        <Printer size={20} />
        {sq.toolbar.exportPdf}
      </button>
      <button className="icon-only ghost" aria-label={sq.toolbar.exportPdf} title={sq.toolbar.exportPdf} onClick={openPrint}>
        <FileDown size={20} />
      </button>
      <input ref={fileRef} className="hidden-input" type="file" accept="application/json" onChange={handleFile} />
    </header>
  );
}
