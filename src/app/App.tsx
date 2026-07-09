import { useEffect } from "react";
import { Gallery } from "../editor/Gallery";
import { Editor } from "../editor/Editor";
import { PrintView } from "../editor/PrintView";
import { loadPosterIndex, migrateLegacyAutosave, savePoster } from "../core/persistence";
import { usePosterStore } from "../core/store";
import { ErrorBoundary } from "./ErrorBoundary";

export default function App() {
  const view = usePosterStore((state) => state.view);
  const doc = usePosterStore((state) => state.doc);
  const openGallery = usePosterStore((state) => state.openGallery);
  const setPosterIndex = usePosterStore((state) => state.setPosterIndex);
  const setSaveError = usePosterStore((state) => state.setSaveError);
  const setSavedState = usePosterStore((state) => state.setSavedState);

  useEffect(() => {
    migrateLegacyAutosave()
      .then((migrated) => {
        if (migrated) {
          setPosterIndex(migrated.index);
          return;
        }
        loadPosterIndex().then(setPosterIndex);
      })
      .catch((error: unknown) => {
        console.error(error);
        setSaveError("Nuk u lexuan posterat e ruajtur.");
      });
  }, [setPosterIndex, setSaveError]);

  useEffect(() => {
    if (view !== "editor") return;
    let cancelled = false;
    const timeout = window.setTimeout(() => {
      savePoster(doc)
        .then(({ index }) => {
          if (cancelled) return;
          setPosterIndex(index);
          setSavedState("saved");
          setSaveError(undefined);
        })
        .catch((error: unknown) => {
          console.error(error);
          if (!cancelled) {
            setSaveError("Nuk u ruajt dot. Shkarko skedarin për siguri.");
          }
        });
    }, 350);
    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, [doc, setPosterIndex, setSaveError, setSavedState, view]);

  useEffect(() => {
    const flush = () => {
      if (view === "editor" && usePosterStore.getState().savedState === "saving") {
        void savePoster(usePosterStore.getState().doc);
      }
    };
    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") flush();
    };
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (usePosterStore.getState().savedState !== "saving") return;
      event.preventDefault();
      event.returnValue = "";
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("pagehide", flush);
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("pagehide", flush);
      window.removeEventListener("beforeunload", onBeforeUnload);
    };
  }, [view]);

  return (
    <ErrorBoundary onReset={openGallery}>
      {view === "print" ? <PrintView /> : view === "editor" ? <Editor /> : <Gallery />}
    </ErrorBoundary>
  );
}
