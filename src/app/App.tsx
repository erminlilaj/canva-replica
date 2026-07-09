import { useEffect } from "react";
import { Gallery } from "../editor/Gallery";
import { Editor } from "../editor/Editor";
import { PrintView } from "../editor/PrintView";
import { loadAutosave, saveAutosave } from "../core/persistence";
import { usePosterStore } from "../core/store";

export default function App() {
  const view = usePosterStore((state) => state.view);
  const doc = usePosterStore((state) => state.doc);
  const setAutosavedDoc = usePosterStore((state) => state.setAutosavedDoc);
  const setSavedState = usePosterStore((state) => state.setSavedState);

  useEffect(() => {
    loadAutosave().then((autosaved) => {
      if (autosaved) {
        setAutosavedDoc(autosaved);
      }
    });
  }, [setAutosavedDoc]);

  useEffect(() => {
    if (view !== "editor") return;
    let cancelled = false;
    const timeout = window.setTimeout(() => {
      saveAutosave(doc).then(() => {
        if (!cancelled) {
          setAutosavedDoc(doc);
          setSavedState("saved");
        }
      });
    }, 350);
    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, [doc, setAutosavedDoc, setSavedState, view]);

  if (view === "print") return <PrintView />;
  if (view === "editor") return <Editor />;
  return <Gallery />;
}
