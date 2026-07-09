import type { ThemeId } from "./types";

export interface PosterTheme {
  id: ThemeId;
  name: string;
  headingFont: string;
  bodyFont: string;
  page: string;
  ink: string;
  muted: string;
  border: string;
  slots: string[];
  softSlots: string[];
}

export const themes: Record<ThemeId, PosterTheme> = {
  school: {
    id: "school",
    name: "Shkollë",
    headingFont: "Arial, sans-serif",
    bodyFont: "Arial, sans-serif",
    page: "#ffffff",
    ink: "#15305b",
    muted: "#637083",
    border: "#c9d3df",
    slots: ["#0f8f3f", "#0f4c9a", "#cf2434", "#f0a51b", "#7b3fb0", "#14958f"],
    softSlots: ["#e7f6e8", "#eaf2ff", "#fde8eb", "#fff2cf", "#f1e9fb", "#e6f6f4"],
  },
  fresh: {
    id: "fresh",
    name: "E freskët",
    headingFont: "Trebuchet MS, sans-serif",
    bodyFont: "Arial, sans-serif",
    page: "#fbfffd",
    ink: "#143934",
    muted: "#60716d",
    border: "#c3d7d0",
    slots: ["#178d72", "#2864ad", "#e2634f", "#efb13d", "#6f58c9", "#2f9eb6"],
    softSlots: ["#e4f5ef", "#e8f0fb", "#fdece8", "#fff4d7", "#efedfb", "#e5f5f8"],
  },
  warm: {
    id: "warm",
    name: "E ngrohtë",
    headingFont: "Georgia, serif",
    bodyFont: "Arial, sans-serif",
    page: "#fffdf8",
    ink: "#382b22",
    muted: "#756c63",
    border: "#dfd0bd",
    slots: ["#2e8b57", "#355c9a", "#b83a3a", "#d98f20", "#8b5fbf", "#0f8e9b"],
    softSlots: ["#e8f4ec", "#e8edf8", "#f8e7e7", "#fff0d8", "#f1eafb", "#e5f5f6"],
  },
  formal: {
    id: "formal",
    name: "Formale",
    headingFont: "Verdana, sans-serif",
    bodyFont: "Arial, sans-serif",
    page: "#ffffff",
    ink: "#172033",
    muted: "#667085",
    border: "#cbd5e1",
    slots: ["#127a49", "#184f88", "#a92738", "#b7791f", "#5b48a8", "#227c88"],
    softSlots: ["#e7f2ec", "#e7eff7", "#f6e7ea", "#fbefd8", "#eeecf8", "#e6f2f3"],
  },
};
