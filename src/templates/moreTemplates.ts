import type { PosterDoc } from "../core/types";

export const eventTemplate: PosterDoc = {
  version: 1,
  title: "Njoftim aktiviteti",
  page: { size: "A3", orientation: "portrait" },
  theme: "fresh",
  blocks: [
    { id: "event-box", type: "box", frame: { x: 18, y: 24, w: 261, h: 96 }, style: { colorSlot: 1, align: "center" }, data: { text: "AKTIVITET SHKOLLOR" } },
    { id: "event-title", type: "text", frame: { x: 28, y: 48, w: 241, h: "auto" }, style: { size: "title", align: "center" }, data: { text: "Dita e Hapur e Shkollës" } },
    { id: "event-stat", type: "stat", frame: { x: 34, y: 142, w: 72, h: "auto" }, style: { colorSlot: 0 }, data: { value: "10:00", label: "Ora e fillimit" } },
    { id: "event-date", type: "stat", frame: { x: 112, y: 142, w: 72, h: "auto" }, style: { colorSlot: 3 }, data: { value: "15 Maj", label: "Data" } },
    { id: "event-place", type: "stat", frame: { x: 190, y: 142, w: 72, h: "auto" }, style: { colorSlot: 5 }, data: { value: "Salla", label: "Vendi" } },
    { id: "event-list", type: "checklist", frame: { x: 42, y: 218, w: 213, h: "auto" }, style: { colorSlot: 0 }, data: { title: "Programi", items: ["Prezantimi i klasave", "Ekspozitë me punime", "Takim me prindërit"] } },
  ],
};

export const scheduleTemplate: PosterDoc = {
  version: 1,
  title: "Orari i klasës",
  page: { size: "A3", orientation: "landscape" },
  theme: "formal",
  blocks: [
    { id: "schedule-title", type: "section", frame: { x: 14, y: 14, w: 392, h: 12 }, style: { colorSlot: 1 }, data: { title: "ORARI I KLASËS", badge: "8A" } },
    { id: "schedule-table", type: "table", frame: { x: 14, y: 38, w: 392, h: "auto" }, style: { colorSlot: 1 }, data: { columns: ["Ora", "E hënë", "E martë", "E mërkurë", "E enjte", "E premte"], rows: [["08:00", "Gjuhë", "Matematikë", "Histori", "Biologji", "Art"], ["09:00", "Matematikë", "Fizikë", "Gjuhë", "Gjeografi", "Sport"], ["10:00", "Anglisht", "Tik", "Kimi", "Matematikë", "Muzikë"]] } },
    { id: "schedule-note", type: "box", frame: { x: 80, y: 190, w: 260, h: 36 }, style: { colorSlot: 3 }, data: { text: "Orari mund të ndryshojë gjatë vitit shkollor." } },
  ],
};

export const announcementTemplate: PosterDoc = {
  version: 1,
  title: "Njoftim",
  page: { size: "A4", orientation: "portrait" },
  theme: "warm",
  blocks: [
    { id: "announce-title", type: "text", frame: { x: 18, y: 26, w: 174, h: "auto" }, style: { size: "title", align: "center", colorSlot: 2 }, data: { text: "NJOFTIM" } },
    { id: "announce-divider", type: "divider", frame: { x: 24, y: 58, w: 162, h: 8 }, style: { colorSlot: 2 }, data: { label: "" } },
    { id: "announce-body", type: "text", frame: { x: 28, y: 84, w: 154, h: "auto" }, style: { size: "subtitle", align: "center" }, data: { text: "Të nderuar prindër,\nju njoftojmë se takimi i radhës zhvillohet ditën e premte në orën 12:00." } },
    { id: "announce-box", type: "box", frame: { x: 36, y: 170, w: 138, h: 42 }, style: { colorSlot: 0 }, data: { text: "Ju faleminderit për bashkëpunimin." } },
  ],
};

export const certificateTemplate: PosterDoc = {
  version: 1,
  title: "Certifikatë",
  page: { size: "A4", orientation: "landscape" },
  theme: "formal",
  blocks: [
    { id: "cert-border", type: "box", frame: { x: 16, y: 16, w: 265, h: 178 }, style: { colorSlot: 3, align: "center" }, data: { text: "" } },
    { id: "cert-title", type: "text", frame: { x: 34, y: 42, w: 229, h: "auto" }, style: { size: "title", align: "center", colorSlot: 1 }, data: { text: "CERTIFIKATË MIRËNJOHJE" } },
    { id: "cert-name", type: "text", frame: { x: 50, y: 94, w: 197, h: "auto" }, style: { size: "title", align: "center" }, data: { text: "Emri Mbiemri" } },
    { id: "cert-reason", type: "text", frame: { x: 58, y: 130, w: 181, h: "auto" }, style: { size: "body", align: "center" }, data: { text: "Për pjesëmarrje dhe kontribut të veçantë në aktivitetet e shkollës." } },
  ],
};

export const extraTemplates = [eventTemplate, scheduleTemplate, announcementTemplate, certificateTemplate];
