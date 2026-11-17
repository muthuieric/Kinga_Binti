"use client";

import { useEffect, useState } from "react";
import { PageHead, CatBadge } from "@/components/AppShell";
import { SUB_COUNTIES } from "@/lib/kingabinti";
import { api, type NarrativeItem } from "@/lib/api";

const sel = "rounded-full border bg-card px-4 py-2 text-sm";

interface MappedNarrative {
  id: string;
  text: string;
  lang: "sw" | "maa";
  languageRaw: string;
  subCounty: string;
  groundTruth: string;
  category: "fgm" | "child_marriage" | "other" | "none";
  predictionRaw: string;
  confidence: number;
  date: string;
  synced: boolean;
}

function download(name: string, body: string, type: string) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([body], { type }));
  a.download = name;
  a.click();
}

function mapLang(l: string) {
  return l?.toLowerCase().startsWith("m") ? "maa" : "sw";
}
function mapCat(c: string) {
  const lc = (c || "").toLowerCase();
  if (lc.includes("fgm")) return "fgm";
  if (lc.includes("child")) return "child_marriage";
  if (lc.includes("other")) return "other";
  return "none";
}

export default function ExplorerClient() {
  const [q, setQ] = useState("");
  const [lang, setLang] = useState("");
  const [sc, setSc] = useState("");
  const [cat, setCat] = useState("");
  const [rows, setRows] = useState<MappedNarrative[]>([]);
  const [full, setFull] = useState<Record<string, NarrativeItem>>({});
  const [loading, setLoading] = useState(true);
  const [inspect, setInspect] = useState<NarrativeItem | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    api
      .narratives({
        language: lang === "sw" ? "Swahili" : lang === "maa" ? "Maa" : "",
        sub_county: sc,
        category: cat
          ? cat === "fgm"
            ? "FGM"
            : cat === "child_marriage"
              ? "Child marriage"
              : cat === "other"
                ? "Other"
                : "None"
          : "",
        search: q,
      })
      .then((data) => {
        if (!active) return;
        const mapped = (data || []).map((r: NarrativeItem): MappedNarrative => ({
          id: r.narrative_id || r.id || "",
          text: r.narrative || r.text || "",
          lang: mapLang(r.language),
          languageRaw: r.language,
          subCounty: r.sub_county,
          groundTruth: r.label || "",
          category: mapCat(r.prediction_label || ""),
          predictionRaw: r.prediction_label || "",
          confidence: r.prediction_score || r.confidence || 0,
          date: (r.date_collected || r.timestamp || "").slice(0, 10),
          synced: true,
        }));
        setRows(mapped);
        const f: Record<string, NarrativeItem> = {};
        (data || []).forEach((r) => {
          if (r.narrative_id) f[r.narrative_id] = r;
        });
        setFull(f);
      })
      .catch(() => {
        // ignore fetch errors
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [q, lang, sc, cat]);

  const csv = () =>
    "id,lang,sub_county,ground_truth,predicted_category,confidence,date\n" +
    rows
      .map((r) =>
        [r.id, r.lang, r.subCounty, r.groundTruth, r.category, r.confidence, r.date].join(","),
      )
      .join("\n");

  return (
    <>
      <PageHead
        eyebrow="Archive"
        title="Narrative explorer"
        desc="Pseudonymised records only. Conf. = NLP prediction confidence."
        right={
          <div className="flex gap-2">
            <button
              onClick={async () => {
                try {
                  const data = await api.narratives({});
                  const body =
                    "id,lang,sub_county,ground_truth,predicted_category,confidence,date\n" +
                    (data || [])
                      .map((r: NarrativeItem) =>
                        [
                          r.narrative_id,
                          r.language?.toLowerCase().startsWith("m") ? "maa" : "sw",
                          r.sub_county,
                          r.label,
                          r.prediction_label,
                          r.prediction_score,
                          (r.date_collected || "").slice(0, 10),
                        ].join(","),
                      )
                      .join(",")
                      .replace(/,/g, ",");
                  download("narratives.csv", body, "text/csv");
                } catch {
                  download("narratives.csv", csv(), "text/csv");
                }
              }}
              className="rounded-full border px-4 py-2 text-sm"
            >
              Export CSV
            </button>
            <button
              onClick={() => window.open(api.exportUrl("json"), "_blank")}
              className="rounded-full bg-ink px-4 py-2 text-sm text-ink-foreground"
            >
              Export JSON
            </button>
          </div>
        }
      />
      <div className="mb-5 flex flex-wrap gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search text or KB-NAR id…"
          className={`${sel} min-w-64 flex-1`}
        />
        <select value={lang} onChange={(e) => setLang(e.target.value)} className={sel}>
          <option value="">All languages</option>
          <option value="sw">Kiswahili</option>
          <option value="maa">Maa</option>
        </select>
        <select value={sc} onChange={(e) => setSc(e.target.value)} className={sel}>
          <option value="">All sub-counties</option>
          {SUB_COUNTIES.map((s) => (
            <option key={s.id}>{s.name}</option>
          ))}
        </select>
        <select value={cat} onChange={(e) => setCat(e.target.value)} className={sel}>
          <option value="">All categories</option>
          <option value="fgm">FGM</option>
          <option value="child_marriage">Child marriage</option>
          <option value="other">Other</option>
          <option value="none">None</option>
        </select>
      </div>
      <div className="card-soft overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              {[
                "Record",
                "Narrative",
                "Lang",
                "Sub-county",
                "Ground truth",
                "NLP prediction",
                "Conf.",
                "Inspect",
              ].map((h) => (
                <th key={h} className="px-4 py-3 font-semibold">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading && (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-muted-foreground">
                  Loading…
                </td>
              </tr>
            )}
            {!loading &&
              rows.map((n) => (
                <tr key={n.id} className="hover:bg-muted/50">
                  <td className="px-4 py-3 font-mono text-xs">
                    {n.id}
                    <p className="text-muted-foreground">{n.date}</p>
                  </td>
                  <td className="max-w-md px-4 py-3">{n.text}</td>
                  <td className="px-4 py-3 uppercase text-xs font-bold">{n.lang}</td>
                  <td className="px-4 py-3">{n.subCounty}</td>
                  <td className="px-4 py-3">{n.groundTruth}</td>
                  <td className="px-4 py-3">
                    <CatBadge c={n.category} />
                  </td>
                  <td className="px-4 py-3">{Math.round(n.confidence * 100)}%</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => {
                        const item = full[n.id];
                        if (item) setInspect(item);
                      }}
                      className="rounded-full border px-3 py-1 text-xs"
                    >
                      Inspect
                    </button>
                  </td>
                </tr>
              ))}
            {!loading && !rows.length && (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-muted-foreground">
                  No narratives match these filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {inspect && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4"
          onClick={() => setInspect(null)}
        >
          <div
            className="max-h-[85vh] w-full max-w-2xl overflow-auto rounded-2xl bg-card p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <p className="font-display text-xl">Record details</p>
              <button
                onClick={() => setInspect(null)}
                className="rounded-full border px-3 py-1 text-sm"
              >
                Close
              </button>
            </div>
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-muted-foreground">Record</p>
                  <p className="font-mono">{inspect.narrative_id}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Pseudonym</p>
                  <p className="font-mono">
                    KB-NAR-{String(inspect.narrative_id).slice(0, 8).toUpperCase()}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Language</p>
                  <p>{inspect.language}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Sub-county</p>
                  <p>{inspect.sub_county}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Age band</p>
                  <p>{inspect.age_band}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Gender</p>
                  <p>{inspect.gender}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Source org</p>
                  <p>{inspect.source_org}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Date collected</p>
                  <p>{inspect.date_collected}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Ground truth</p>
                  <p>{inspect.label}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">NLP prediction</p>
                  <p>
                    {inspect.prediction_label} ({Math.round((inspect.prediction_score || 0) * 100)}
                    %)
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Discourse stance</p>
                  <p>{inspect.discourse_stance}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Consent</p>
                  <p>{inspect.consent_given ? "Given & audited" : "Not given"}</p>
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Narrative</p>
                <p className="mt-1 rounded-xl bg-muted p-3">{inspect.narrative}</p>
              </div>
              {Array.isArray(inspect.detected_markers) && inspect.detected_markers.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground">Detected markers</p>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {inspect.detected_markers.map((m, i) => (
                      <span key={i} className="rounded-full border px-3 py-1 text-xs">
                        <b>{m.term}</b> · {m.meaning} · w {m.weight}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {inspect.cultural_context_notes && (
                <div>
                  <p className="text-xs text-muted-foreground">Cultural context notes</p>
                  <p className="mt-1 rounded-xl bg-muted p-3 text-sm">
                    {inspect.cultural_context_notes}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
