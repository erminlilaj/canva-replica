import { Canvas } from "./Canvas";
import { Inspector } from "./Inspector";
import { Palette } from "./Palette";
import { Toolbar } from "./Toolbar";
import { CoachMarks } from "../app/CoachMarks";
import { sq } from "../i18n/sq";

export function Editor() {
  return (
    <div className="editor-shell">
      <div className="small-screen">{sq.canvas.smallScreen}</div>
      <Toolbar />
      <div className="editor-body">
        <Palette />
        <Canvas />
        <Inspector />
      </div>
      <CoachMarks />
    </div>
  );
}
