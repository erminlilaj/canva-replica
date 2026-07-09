import { FilePlus2, FolderOpen, LayoutTemplate } from "lucide-react";
import { sq } from "../i18n/sq";
import { riskAssessmentTemplate } from "../templates/riskAssessment";
import { extraTemplates } from "../templates/moreTemplates";
import { usePosterStore } from "../core/store";
import type { PosterDoc } from "../core/types";
import { copyAsNewPoster } from "../core/document";
import { deletePoster, loadPoster, savePoster } from "../core/persistence";

function datedTitle(title: string) {
  return `${title} — ${new Intl.DateTimeFormat("sq-AL", { day: "numeric", month: "short" }).format(new Date())}`;
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
  const posterIndex = usePosterStore((state) => state.posterIndex);
  const posterIndexLoaded = usePosterStore((state) => state.posterIndexLoaded);
  const setPosterIndex = usePosterStore((state) => state.setPosterIndex);
  const recentPoster = posterIndex[0];

  const openSavedPoster = async (id: string) => {
    const poster = await loadPoster(id);
    if (poster) {
      openEditor(poster);
      return;
    }
    window.alert(sq.file.invalid);
  };

  const removePoster = async (id: string) => {
    if (!window.confirm(sq.gallery.confirmDeletePoster)) return;
    setPosterIndex(await deletePoster(id));
  };

  const duplicatePoster = async (id: string) => {
    const poster = await loadPoster(id);
    if (!poster) {
      window.alert(sq.file.invalid);
      return;
    }
    const { index } = await savePoster(copyAsNewPoster(poster, sq.gallery.duplicateTitle(poster.title)));
    setPosterIndex(index);
  };

  return (
    <main className="gallery">
      <section className="gallery-intro">
        <div>
          <p className="app-kicker">{sq.appName}</p>
          <h1>{sq.gallery.title}</h1>
          <p>{sq.gallery.subtitle}</p>
        </div>
      </section>
      {recentPoster ? (
        <section className="continue-section">
          <button className="template-card continue-card" onClick={() => openSavedPoster(recentPoster.id)}>
            <FolderOpen size={34} />
            <span>
              <strong>{sq.gallery.continue}</strong>
              <small>{recentPoster.title}</small>
            </span>
          </button>
        </section>
      ) : null}
      <section className="template-grid" aria-label={sq.gallery.title}>
        <button className="template-card featured" onClick={() => openEditor(copyAsNewPoster(riskAssessmentTemplate, datedTitle(riskAssessmentTemplate.title)))}>
          <LayoutTemplate size={34} />
          <span>
            <strong>{sq.gallery.startRisk}</strong>
            <small>{sq.gallery.startRiskDesc}</small>
          </span>
          <em>{sq.gallery.openTemplate}</em>
        </button>
        {extraTemplates.map((template) => (
          <button className="template-card" key={template.title} onClick={() => openEditor(copyAsNewPoster(template, datedTitle(template.title)))}>
            <LayoutTemplate size={34} />
            <span>
              <strong>{template.title}</strong>
              <small>{sq.gallery.openTemplate}</small>
            </span>
          </button>
        ))}
        <button className="template-card" onClick={() => openEditor(copyAsNewPoster(blankPoster, datedTitle(blankPoster.title)))}>
          <FilePlus2 size={34} />
          <span>
            <strong>{sq.gallery.blank}</strong>
            <small>{sq.gallery.blankDesc}</small>
          </span>
        </button>
      </section>
      <section className="saved-posters">
        <h2>{sq.gallery.myPosters}</h2>
        {!posterIndexLoaded ? (
          <div className="saved-list" aria-hidden="true">
            <div className="saved-row-skeleton" />
            <div className="saved-row-skeleton" />
          </div>
        ) : posterIndex.length === 0 ? (
          <p>{sq.gallery.noSavedPoster}</p>
        ) : null}
        <div className="saved-list">
          {posterIndexLoaded && posterIndex.map((poster) => (
            <div className="saved-row" key={poster.id}>
              <button onClick={() => openSavedPoster(poster.id)}>
                <strong>{poster.title}</strong>
                <small>{sq.gallery.modified}: {new Intl.DateTimeFormat("sq-AL", { dateStyle: "medium", timeStyle: "short" }).format(new Date(poster.updatedAt))}</small>
              </button>
              <button onClick={() => duplicatePoster(poster.id)}>{sq.gallery.duplicate}</button>
              <button className="saved-delete" onClick={() => removePoster(poster.id)}>
                {sq.inspector.delete}
              </button>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
