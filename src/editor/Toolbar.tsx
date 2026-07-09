import { ArrowLeft, Download, FileDown, FolderOpen, Minus, Plus, Printer, Redo2, Undo2 } from "lucide-react";
import { ChangeEvent, useRef } from "react";
import { themes } from "../core/themes";
import { downloadPoster, readPosterFile } from "../core/persistence";
import { usePosterStore } from "../core/store";
import { sq } from "../i18n/sq";
import type { ThemeId } from "../core/types";

export function Toolbar() {
  const fileRef = useRef<HTMLInputElement>(null);
  const doc = usePosterStore((state) => state.doc);
  const zoom = usePosterStore((state) => state.zoom);
  const savedState = usePosterStore((state) => state.savedState);
  const openGallery = usePosterStore((state) => state.openGallery);
  const openEditor = usePosterStore((state) => state.openEditor);
  const openPrint = usePosterStore((state) => state.openPrint);
  const setZoom = usePosterStore((state) => state.setZoom);
  const setTheme = usePosterStore((state) => state.setTheme);
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
      <button className="icon-text" onClick={openGallery}>
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
        <button onClick={() => setZoom(0.55)}>{sq.toolbar.fit}</button>
      </div>
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
      <div className="toolbar-spacer" />
      <span className="save-state">{savedState === "saved" ? sq.toolbar.saved : sq.toolbar.saving}</span>
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
