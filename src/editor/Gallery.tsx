import { FilePlus2, FolderOpen, LayoutTemplate } from "lucide-react";
import { sq } from "../i18n/sq";
import { riskAssessmentTemplate } from "../templates/riskAssessment";
import { usePosterStore } from "../core/store";
import type { PosterDoc } from "../core/types";

function freshCopy(doc: PosterDoc): PosterDoc {
  return {
    ...structuredClone(doc),
    blocks: doc.blocks.map((block) => ({ ...structuredClone(block), id: crypto.randomUUID() })),
  };
}

const blankPoster: PosterDoc = {
  version: 1,
  title: sq.gallery.blank,
  page: { size: "A3", orientation: "portrait" },
  theme: "school",
  blocks: [],
};

export function Gallery() {
  const openEditor = usePosterStore((state) => state.openEditor);
  const autosavedDoc = usePosterStore((state) => state.autosavedDoc);
  return (
    <main className="gallery">
      <section className="gallery-intro">
        <div>
          <p className="app-kicker">{sq.appName}</p>
          <h1>{sq.gallery.title}</h1>
          <p>{sq.gallery.subtitle}</p>
        </div>
      </section>
      <section className="template-grid" aria-label={sq.gallery.title}>
        <button className="template-card featured" onClick={() => openEditor(freshCopy(riskAssessmentTemplate))}>
          <LayoutTemplate size={34} />
          <span>
            <strong>{sq.gallery.startRisk}</strong>
            <small>{sq.gallery.startRiskDesc}</small>
          </span>
          <em>{sq.gallery.openTemplate}</em>
        </button>
        <button className="template-card" onClick={() => openEditor(freshCopy(blankPoster))}>
          <FilePlus2 size={34} />
          <span>
            <strong>{sq.gallery.blank}</strong>
            <small>{sq.gallery.blankDesc}</small>
          </span>
        </button>
        <button
          className="template-card muted"
          disabled={!autosavedDoc}
          onClick={() => {
            if (autosavedDoc) openEditor(autosavedDoc);
          }}
        >
          <FolderOpen size={34} />
          <span>
            <strong>{sq.gallery.myPosters}</strong>
            <small>{autosavedDoc ? sq.gallery.continue : sq.gallery.noSavedPoster}</small>
          </span>
        </button>
      </section>
    </main>
  );
}
