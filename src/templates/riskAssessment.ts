import type { Block, PosterDoc } from "../core/types";

const schoolPhoto = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="900" height="560" viewBox="0 0 900 560">
  <defs>
    <linearGradient id="sky" x1="0" x2="0" y1="0" y2="1">
      <stop stop-color="#dff0ff"/><stop offset="1" stop-color="#f9fbff"/>
    </linearGradient>
  </defs>
  <rect width="900" height="560" fill="url(#sky)"/>
  <rect y="365" width="900" height="195" fill="#dfead7"/>
  <rect x="95" y="160" width="660" height="230" fill="#f2d88e" stroke="#b9974c" stroke-width="5"/>
  <rect x="145" y="205" width="80" height="70" fill="#ffffff" stroke="#617a9b" stroke-width="5"/>
  <rect x="260" y="205" width="80" height="70" fill="#ffffff" stroke="#617a9b" stroke-width="5"/>
  <rect x="375" y="205" width="80" height="70" fill="#ffffff" stroke="#617a9b" stroke-width="5"/>
  <rect x="490" y="205" width="80" height="70" fill="#ffffff" stroke="#617a9b" stroke-width="5"/>
  <rect x="605" y="205" width="80" height="70" fill="#ffffff" stroke="#617a9b" stroke-width="5"/>
  <rect x="390" y="305" width="90" height="85" fill="#965b35"/>
  <path d="M65 160h720l-40-55H110z" fill="#b55338"/>
  <path d="M0 488c170-75 270 8 440-50s285-96 460-34v156H0z" fill="#0f4c9a"/>
  <path d="M0 516c180-78 280 8 450-48s270-82 450-34v126H0z" fill="#ffffff"/>
</svg>
`)}`;

const blocks: Block[] = [
  {
    id: "cover-title",
    type: "text",
    frame: { x: 9, y: 16, w: 82, h: "auto" },
    style: { size: "subtitle", align: "center" },
    data: { text: "DREJTORIA RAJONALE E ARSIMIT PARAUNIVERSITAR\nSHKOLLA 9 VJEÇARE “EMRI I SHKOLLËS”" },
  },
  {
    id: "cover-main",
    type: "text",
    frame: { x: 10, y: 43, w: 82, h: "auto" },
    style: { size: "title", align: "center", colorSlot: 2 },
    data: { text: "VLERËSIMI I RISKUT\nPËR VITIN SHKOLLOR\n2025-2026" },
  },
  { id: "cover-photo", type: "image", frame: { x: 7, y: 88, w: 86, h: 58 }, data: { src: schoolPhoto, fit: "cover", caption: "" } },
  {
    id: "cover-director",
    type: "text",
    frame: { x: 54, y: 151, w: 38, h: "auto" },
    style: { size: "body", align: "center" },
    data: { text: "DREJTORI I SHKOLLËS\nEMRI MBIEMRI" },
  },
  {
    id: "contents",
    type: "table",
    frame: { x: 102, y: 14, w: 89, h: "auto" },
    style: { colorSlot: 1 },
    data: {
      title: "PËRMBAJTJA E MATERIALIT TË VLERËSIMIT TË RISKUT",
      columns: ["KREU", "PËRMBAJTJA"],
      rows: [
        ["I", "GRUPI I PUNËS PËR VLERËSIMIN E RISKUT"],
        ["I", "PËRCAKTIMI I KONTEKSTIT"],
        ["II", "FAKTORËT E RISKUT"],
        ["III", "ANALIZA SWOT E RISKUT"],
        ["IV-V", "VLERËSIMI I RISKUT"],
        ["VI", "VLERËSIMI I NIVELIT TË RISKUT"],
        ["VII", "TRAJTIMI I RISKUT"],
      ],
    },
  },
  {
    id: "team",
    type: "team",
    frame: { x: 199, y: 8, w: 91, h: "auto" },
    style: { colorSlot: 0 },
    data: {
      title: "Grupi i punës",
      members: [
        { role: "drejtor", name: "Emri Mbiemri" },
        { role: "psikologe", name: "Emri Mbiemri" },
        { role: "administrator", name: "Emri Mbiemri" },
        { role: "drejtues TIK", name: "Emri Mbiemri" },
        { role: "drejtuese njësie", name: "Emri Mbiemri" },
      ],
    },
  },
  {
    id: "context-section",
    type: "section",
    frame: { x: 199, y: 69, w: 91, h: 8 },
    style: { colorSlot: 0 },
    data: { title: "I. PËRCAKTIMI I KONTEKSTIT" },
  },
  {
    id: "context-table",
    type: "table",
    frame: { x: 199, y: 79, w: 91, h: "auto" },
    style: { colorSlot: 0 },
    data: {
      columns: ["Nr.", "Treguesit e riskut", "Treguesit përfshijnë", "Metodat"],
      rows: [
        ["1", "Mirëqenia e nxënësve", "Siguria fizike, emocionale dhe sociale. Të drejtat dhe detyrat e nxënësve.", "Vëzhgime, monitorime, shqyrtim dokumentacioni"],
      ],
    },
  },
  {
    id: "context-table-2",
    type: "table",
    frame: { x: 8, y: 179, w: 89, h: "auto" },
    style: { colorSlot: 0 },
    data: {
      title: "I. PËRCAKTIMI I KONTEKSTIT",
      columns: ["Nr.", "Treguesit e riskut", "Të dhëna të shkollës", "Metodat"],
      rows: [
        ["2", "Vizioni i IAP-së", "Hartimi i vizionit, objektivat dhe analiza e gjendjes.", "Pyetësorë, takime, monitorime"],
        ["3", "Infrastruktura", "Mjediset, laboratorët, biblioteka, tualetet dhe ambientet sportive.", "Vëzhgime dhe dokumentacion"],
      ],
    },
  },
  {
    id: "risk-factors",
    type: "table",
    frame: { x: 103, y: 179, w: 89, h: "auto" },
    style: { colorSlot: 2 },
    data: {
      title: "II. FAKTORËT E RISKUT",
      columns: ["Treguesi", "Faktorët kryesorë"],
      rows: [
        ["Mirëqenia e nxënësve", "Veprimtaria e organizmave të shkollës; raportet dhe kujdesi ndaj nxënësve."],
        ["Vizioni i IAP-së", "Marrja e sugjerimeve dhe përfshirja e të gjithë aktorëve."],
        ["Infrastruktura", "Mjediset, siguria, shkallët emergjente dhe pajisjet."],
        ["Burimet njerëzore", "Trajnimet, bashkëpunimi dhe komunikimi i brendshëm."],
        ["Burimet financiare", "Bashkëpunimi me prindërit dhe sigurimi i të ardhurave."],
      ],
    },
  },
  {
    id: "swot",
    type: "swot",
    frame: { x: 198, y: 179, w: 91, h: "auto" },
    data: {
      riskLabel: "Mirëqenia e nxënësve",
      columns: [
        { title: "Sukseset (S)", items: ["Harta sociale e shkollës", "Rregullore të aplikueshme", "Klima pozitive"] },
        { title: "Dobësitë (W)", items: ["Bashkëpunim i pjesshëm", "Vëmendje e masave disiplinore", "Zbatim i onëve të kujdestarisë"] },
        { title: "Mundësitë (O)", items: ["Përfshirja më e madhe e prindërve", "Plane të organizuara", "Marrja e sugjerimeve"] },
        { title: "Kërcënimet (T)", items: ["Mungesa e angazhimit", "Rreziqe sociale jashtë shkollës"] },
      ],
    },
  },
  ...[
    ["Mirëqenia e nxënësve", "48 të dhëna", "#0f8f3f"],
    ["Vizioni i IAP-së", "15 të dhëna", "#cf2434"],
    ["Infrastruktura", "33 të dhëna", "#0f4c9a"],
    ["Burimet njerëzore", "31 të dhëna", "#7b3fb0"],
    ["Burimet financiare", "19 të dhëna", "#f0a51b"],
    ["Teknologjia e informacionit", "23 të dhëna", "#14958f"],
    ["Vlerësimi i brendshëm", "17 të dhëna", "#d45899"],
    ["Bashkëpunimi dhe gjithëpërfshirja", "12 të dhëna", "#e37a24"],
    ["Rezultatet e nxënësve", "41 të dhëna", "#71b340"],
  ].map((item, index) => {
    const col = index % 3;
    const row = Math.floor(index / 3);
    return {
      id: `risk-${index + 1}`,
      type: "risk",
      frame: { x: 8 + col * 96, y: 300 + row * 40, w: 89, h: "auto" },
      style: { accent: item[2], colorSlot: index % 6 },
      data: {
        number: index + 1,
        label: item[0],
        dataCount: item[1],
        probability: (2.1 + index * 0.16).toFixed(2),
        impact: index % 2 ? "2.5" : "1.8",
        score: (4.2 + index * 0.86).toFixed(2),
        ratings: ["1 x 1 = 1", "2 x 2 = 4", "3 x 3 = 9", "4 x 4 = 16"],
      },
    } satisfies Block;
  }),
  {
    id: "treatment",
    type: "table",
    frame: { x: 8, y: 421, w: 282, h: "auto" },
    style: { colorSlot: 4 },
    data: {
      title: "VII. TRAJTIMI I RISKUT",
      columns: ["Nr.", "Treguesit e riskut", "Faktorët e riskut", "Trajtimi i riskut"],
      rows: [
        ["1", "Mirëqenia e nxënësve", "Marrëdhëniet sociale dhe përfshirja e prindërve.", "Të rritet bashkëpunimi me kolegët dhe prindërit."],
        ["2", "Vizioni i IAP-së", "Përfshirja e palëve në hartimin e vizionit.", "Të merren më shumë mendime dhe ide."],
        ["5", "Burimet financiare", "Sigurimi i të ardhurave.", "Të bashkëpunohet me komunitetin për shfrytëzim të burimeve."],
      ],
    },
  },
];

export const riskAssessmentTemplate: PosterDoc = {
  version: 1,
  title: "Vlerësimi i Riskut",
  page: { size: "A3", orientation: "portrait" },
  theme: "school",
  blocks,
};
