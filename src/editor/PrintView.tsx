import { useEffect } from "react";
import { BlockRenderer } from "../blocks/registry";
import { pageSizeMm } from "../core/geometry";
import { themes } from "../core/themes";
import { usePosterStore } from "../core/store";
import { sq } from "../i18n/sq";

export function PrintView() {
  const doc = usePosterStore((state) => state.doc);
  const page = pageSizeMm(doc.page.size, doc.page.orientation);
  const theme = themes[doc.theme];
  const fontFamily = doc.fonts?.body ?? theme.bodyFont;

  useEffect(() => {
    document.fonts.ready.then(() => window.setTimeout(() => window.print(), 150));
  }, []);

  return (
    <main className="print-view">
      <style>
        {`
          @page { size: ${page.w}mm ${page.h}mm; margin: 0; }
          @media print {
            .print-page {
              width: ${page.w}mm !important;
              height: ${page.h}mm !important;
              print-color-adjust: exact;
              -webkit-print-color-adjust: exact;
            }
          }
        `}
      </style>
      <p className="print-hint">{sq.print.hint}</p>
      <div
        className="poster-page print-page"
        style={{
          width: `${page.w}mm`,
          height: `${page.h}mm`,
          background: theme.page,
          color: theme.ink,
          fontFamily,
        }}
      >
        {doc.blocks.map((block) => (
          <div
            key={block.id}
            className="poster-block print-block"
            style={{
              left: `${block.frame.x}mm`,
              top: `${block.frame.y}mm`,
              width: `${block.frame.w}mm`,
              minHeight: typeof block.frame.h === "number" ? `${block.frame.h}mm` : undefined,
              height: typeof block.frame.h === "number" ? `${block.frame.h}mm` : undefined,
            }}
          >
            <BlockRenderer block={block} />
          </div>
        ))}
      </div>
    </main>
  );
}
