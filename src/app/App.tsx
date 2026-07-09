import { useEffect } from "react";
import { Gallery } from "../editor/Gallery";
import { Editor } from "../editor/Editor";
import { PrintView } from "../editor/PrintView";
import { loadAutosave, saveAutosave } from "../core/persistence";
import { usePosterStore } from "../core/store";

export default function App() {
  const view = usePosterStore((state) => state.view);
  const doc = usePosterStore((state) => state.doc);
  const openEditor = usePosterStore((state) => state.openEditor);
  const setSavedState = usePosterStore((state) => state.setSavedState);

  useEffect(() => {
    loadAutosave().then((autosaved) => {
      if (autosaved) {
        openEditor(autosaved);
      }
    });
  }, [openEditor]);

  useEffect(() => {
    let cancelled = false;
    const timeout = window.setTimeout(() => {
      saveAutosave(doc).then(() => {
        if (!cancelled) setSavedState("saved");
      });
    }, 350);
    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, [doc, setSavedState]);

  if (view === "print") return <PrintView />;
  if (view === "editor") return <Editor />;
  return <Gallery />;
}
