import { useEffect } from "react";
import { BlockRenderer } from "../blocks/registry";
import { mmToPx, pageSizeMm } from "../core/geometry";
import { themes } from "../core/themes";
import { usePosterStore } from "../core/store";
import { sq } from "../i18n/sq";

export function PrintView() {
  const doc = usePosterStore((state) => state.doc);
  const page = pageSizeMm(doc.page.size, doc.page.orientation);
  const theme = themes[doc.theme];

  useEffect(() => {
    document.fonts.ready.then(() => window.setTimeout(() => window.print(), 150));
  }, []);

  return (
    <main className="print-view">
      <p className="print-hint">{sq.print.hint}</p>
      <div
        className="poster-page print-page"
        style={{
          width: `${mmToPx(page.w)}px`,
          height: `${mmToPx(page.h)}px`,
          background: theme.page,
          color: theme.ink,
          fontFamily: theme.bodyFont,
        }}
      >
        {doc.blocks.map((block) => (
          <div
            key={block.id}
            className="poster-block print-block"
            style={{
              left: `${mmToPx(block.frame.x)}px`,
              top: `${mmToPx(block.frame.y)}px`,
              width: `${mmToPx(block.frame.w)}px`,
              minHeight: typeof block.frame.h === "number" ? `${mmToPx(block.frame.h)}px` : undefined,
              height: typeof block.frame.h === "number" ? `${mmToPx(block.frame.h)}px` : undefined,
            }}
          >
            <BlockRenderer block={block} />
          </div>
        ))}
      </div>
    </main>
  );
}
