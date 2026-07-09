import type { Block, BlockType, Frame } from "./types";

export function makeDefaultBlock(type: BlockType, frame: Frame): Block {
  const id = crypto.randomUUID();
  if (type === "section") {
    return { id, type, frame: { ...frame, w: 120 }, style: { colorSlot: 0 }, data: { title: "KREU I", badge: "I" } };
  }
  if (type === "table") {
    return {
      id,
      type,
      frame: { ...frame, w: 120 },
      style: { colorSlot: 0 },
      data: {
        title: "Tabelë e re",
        columns: ["Nr.", "Përshkrimi", "Shënime"],
        rows: [["1", "Kliko tekstin për ta ndryshuar", ""]],
      },
    };
  }
  if (type === "swot") {
    return {
      id,
      type,
      frame: { ...frame, w: 170 },
      data: {
        riskLabel: "Treguesi i riskut",
        columns: [
          { title: "Sukseset (S)", items: ["Pikë e fortë"] },
          { title: "Dobësitë (W)", items: ["Dobësi për t'u trajtuar"] },
          { title: "Mundësitë (O)", items: ["Mundësi për përmirësim"] },
          { title: "Kërcënimet (T)", items: ["Rrezik i mundshëm"] },
        ],
      },
    };
  }
  if (type === "risk") {
    return {
      id,
      type,
      frame: { ...frame, w: 90 },
      style: { colorSlot: 2 },
      data: {
        number: 1,
        label: "Risk i ri",
        dataCount: "0 të dhëna",
        probability: "1.0",
        impact: "1.0",
        score: "1.0",
        ratings: ["1 x 1 = 1", "2 x 1 = 2", "3 x 1 = 3", "4 x 1 = 4"],
      },
    };
  }
  if (type === "team") {
    return {
      id,
      type,
      frame,
      style: { colorSlot: 0 },
      data: {
        title: "Grupi i punës",
        members: [{ role: "drejtor", name: "Emri Mbiemri" }],
      },
    };
  }
  if (type === "checklist") {
    return {
      id,
      type,
      frame,
      style: { colorSlot: 4 },
      data: { title: "Trajtimi i riskut", items: ["Shto masën e parë"] },
    };
  }
  if (type === "image") {
    return { id, type, frame: { ...frame, h: 70 }, data: { fit: "cover", caption: "Foto" } };
  }
  return {
    id,
    type: "text",
    frame,
    style: { size: "body", align: "left" },
    data: { text: "Shkruaj tekstin këtu" },
  };
}
