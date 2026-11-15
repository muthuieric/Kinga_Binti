export type Category = "fgm" | "child_marriage" | "other" | "none";
export type Lang = "sw" | "maa";

export const CATEGORY_LABEL: Record<Category, string> = {
  fgm: "FGM",
  child_marriage: "Child marriage",
  other: "Other harmful norm",
  none: "No signal",
};

export const SUB_COUNTIES = [
  { id: "narok-north", name: "Narok North", county: "Narok", risk: 3, fgm: 41, cm: 22 },
  { id: "narok-south", name: "Narok South", county: "Narok", risk: 4, fgm: 58, cm: 31 },
  { id: "narok-east", name: "Narok East", county: "Narok", risk: 2, fgm: 19, cm: 14 },
  { id: "narok-west", name: "Narok West", county: "Narok", risk: 4, fgm: 63, cm: 37 },
  { id: "emurua-dikirr", name: "Emurua Dikirr", county: "Narok", risk: 2, fgm: 17, cm: 11 },
  { id: "kilgoris", name: "Kilgoris", county: "Narok", risk: 3, fgm: 34, cm: 26 },
  { id: "kajiado-north", name: "Kajiado North", county: "Kajiado", risk: 1, fgm: 6, cm: 5 },
  { id: "kajiado-central", name: "Kajiado Central", county: "Kajiado", risk: 3, fgm: 38, cm: 24 },
  { id: "kajiado-east", name: "Kajiado East", county: "Kajiado", risk: 2, fgm: 15, cm: 12 },
  { id: "kajiado-west", name: "Kajiado West", county: "Kajiado", risk: 4, fgm: 52, cm: 33 },
  { id: "kajiado-south", name: "Kajiado South", county: "Kajiado", risk: 3, fgm: 29, cm: 21 },
] as const;

export const PARTNERS: [string, string, string] = ["Tareto Africa Trust", "Narok CBO Network", "Kajiado Girls Forum"];

type Lex = { term: string; cat: Category; weight: number; en: string; lang: Lang };
export const LEXICON: Lex[] = [
  { term: "ukeketaji", cat: "fgm", weight: 0.92, en: "circumcision / cutting", lang: "sw" },
  { term: "kukeketwa", cat: "fgm", weight: 0.88, en: "to be cut", lang: "sw" },
  { term: "tohara", cat: "fgm", weight: 0.7, en: "rite / circumcision", lang: "sw" },
  { term: "ndoa za mapema", cat: "child_marriage", weight: 0.9, en: "early marriage", lang: "sw" },
  { term: "kuolewa", cat: "child_marriage", weight: 0.6, en: "to be married", lang: "sw" },
  { term: "mahari", cat: "child_marriage", weight: 0.55, en: "bride price", lang: "sw" },
  { term: "msichana", cat: "other", weight: 0.2, en: "girl", lang: "sw" },
  { term: "emuratare", cat: "fgm", weight: 0.95, en: "circumcision ceremony", lang: "maa" },
  { term: "enkamuratani", cat: "fgm", weight: 0.85, en: "circumciser", lang: "maa" },
  { term: "esiankiki", cat: "child_marriage", weight: 0.8, en: "young bride", lang: "maa" },
  { term: "enkiyieu", cat: "child_marriage", weight: 0.65, en: "marriage arrangement", lang: "maa" },
  { term: "entito", cat: "other", weight: 0.2, en: "girl", lang: "maa" },
];

const ADVOCACY = ["lazima", "ni desturi", "must", "inkishu", "tunapaswa"];
const OPPOSE = ["kukataa", "pinga", "acha", "kulinda", "shule"];

export type Analysis = {
  category: Category;
  confidence: number;
  scores: Record<Category, number>;
  markers: (Lex & { index: number })[];
  stance: "advocacy" | "descriptive" | "opposition";
};

export function analyse(text: string): Analysis {
  const lower = text.toLowerCase();
  const markers: Analysis["markers"] = [];
  for (const l of LEXICON) {
    let i = lower.indexOf(l.term);
    while (i !== -1) {
      markers.push({ ...l, index: i });
      i = lower.indexOf(l.term, i + l.term.length);
    }
  }
  const raw: Record<Category, number> = { fgm: 0.05, child_marriage: 0.05, other: 0.08, none: 0.35 };
  markers.forEach((m) => (raw[m.cat] += m.weight));
  if (markers.length) raw.none = 0.1;
  const sum = Object.values(raw).reduce((a, b) => a + b, 0);
  const scores = Object.fromEntries(
    Object.entries(raw).map(([k, v]) => [k, v / sum]),
  ) as Record<Category, number>;
  const category = (Object.keys(scores) as Category[]).reduce((a, b) => (scores[a] > scores[b] ? a : b));
  const stance = ADVOCACY.some((w) => lower.includes(w))
    ? "advocacy"
    : OPPOSE.some((w) => lower.includes(w))
      ? "opposition"
      : "descriptive";
  return { category, confidence: scores[category], scores, markers: markers.sort((a, b) => a.index - b.index), stance };
}

export async function sha256(s: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export const pseudoId = () => "KB-NAR-" + Math.random().toString(16).slice(2, 10).toUpperCase();

export type Narrative = {
  id: string;
  text: string;
  lang: Lang;
  subCounty: string;
  ageBand: string;
  gender: string;
  partner: string;
  category: Category;
  confidence: number;
  date: string;
  hash: string;
  synced: boolean;
};

export const SAMPLE: Narrative[] = [
  { id: "KB-NAR-4F2A91C0", text: "Wazee wanasema ukeketaji ni desturi lazima kabla ya msichana kuolewa.", lang: "sw", subCounty: "Narok South", ageBand: "36–50", gender: "Male", partner: PARTNERS[0], category: "fgm", confidence: 0.84, date: "2026-10-24", hash: "a3f9…7c21", synced: true },
  { id: "KB-NAR-91BE03DD", text: "Emuratare e nkera natii enkolong ninye, entito naa esiankiki.", lang: "maa", subCounty: "Kajiado West", ageBand: "18–25", gender: "Female", partner: PARTNERS[2], category: "fgm", confidence: 0.79, date: "2026-10-23", hash: "0bd1…e844", synced: true },
  { id: "KB-NAR-77C1A5E2", text: "Baba alipokea mahari, ndoa za mapema kwa binti wa miaka kumi na nne.", lang: "sw", subCounty: "Narok West", ageBand: "26–35", gender: "Female", partner: PARTNERS[1], category: "child_marriage", confidence: 0.88, date: "2026-10-22", hash: "c88e…19fa", synced: true },
  { id: "KB-NAR-0D44B7F1", text: "Akina mama wanapinga ukeketaji na wanataka wasichana waende shule.", lang: "sw", subCounty: "Kilgoris", ageBand: "36–50", gender: "Female", partner: PARTNERS[0], category: "fgm", confidence: 0.66, date: "2026-10-21", hash: "5e12…aa03", synced: true },
  { id: "KB-NAR-E3A0C8B9", text: "Mvua imenyesha na mifugo ina malisho mazuri msimu huu.", lang: "sw", subCounty: "Kajiado North", ageBand: "50+", gender: "Male", partner: PARTNERS[2], category: "none", confidence: 0.71, date: "2026-10-20", hash: "f701…3b6d", synced: true },
  { id: "KB-NAR-5B9F2E10", text: "Enkiyieu oo nkishu, esiankiki naa entito sapuk.", lang: "maa", subCounty: "Kajiado Central", ageBand: "26–35", gender: "Male", partner: PARTNERS[1], category: "child_marriage", confidence: 0.74, date: "2026-10-19", hash: "9a4c…d2e7", synced: false },
];

export const CONFUSION = [
  [182, 9, 6, 3],
  [11, 164, 8, 5],
  [7, 10, 121, 14],
  [4, 3, 12, 241],
];
export const CONF_LABELS: Category[] = ["fgm", "child_marriage", "other", "none"];
