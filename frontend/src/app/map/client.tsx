"use client";

import { useEffect, useState } from "react";
import { PageHead } from "@/components/AppShell";
import { SUB_COUNTIES, type SubCounty } from "@/lib/kingabinti";
import { api, type NarrativeItem } from "@/lib/api";

const TONE = [
  "",
  "bg-risk-1",
  "bg-risk-2",
  "bg-risk-3 text-primary-foreground",
  "bg-risk-4 text-primary-foreground",
];
const LEVEL = ["", "Low", "Moderate", "High", "Critical"];

const MAP_METRICS: ["risk" | "fgm" | "cm" | "adv", string][] = [
  ["risk", "Risk index"],
  ["fgm", "FGM"],
  ["cm", "Child marriage"],
  ["adv", "Advocacy"],
];

const COUNTIES: string[] = ["Narok", "Kajiado"];

interface CountyData extends SubCounty {
  advocacy: number;
  total: number;
}

export default function MapClient() {
  const [metric, setMetric] = useState<"risk" | "fgm" | "cm" | "adv">("risk");
  const [data, setData] = useState<CountyData[]>(
    SUB_COUNTIES.map((s) => ({ ...s, advocacy: 0, total: 0 })),
  );
  const [sel, setSel] = useState<string>(SUB_COUNTIES[3]?.id || SUB_COUNTIES[0]?.id || "");
  useEffect(() => {
    api
      .narratives()
      .then((recs: NarrativeItem[]) => {
        const counts: Record<string, { fgm: number; cm: number; advocacy: number; total: number }> =
          {};
        (recs || []).forEach((r) => {
          const sc = r.sub_county;
          if (!counts[sc]) counts[sc] = { fgm: 0, cm: 0, advocacy: 0, total: 0 };
          counts[sc].total++;
          const pl = (r.prediction_label || "").toLowerCase();
          if (pl.includes("fgm")) counts[sc].fgm++;
          if (pl.includes("child")) counts[sc].cm++;
          const st = (r.discourse_stance || "").toLowerCase();
          if (st.includes("challeng") || st.includes("resist")) counts[sc].advocacy++;
        });
        setData((prev) =>
          prev.map((x) => {
            const c = counts[x.name];
            if (!c) return x;
            const fgm = c.fgm || x.fgm;
            const cm = c.cm || x.cm;
            const advocacy = c.advocacy || 0;
            const total = c.total || x.fgm + x.cm;
            const risk = Math.min(4, Math.max(1, Math.ceil((fgm + cm) / 16)));
            return { ...x, fgm, cm, advocacy, total, risk };
          }),
        );
      })
      .catch(() => {
        // ignore fetch errors
      });
  }, []);
  const s = data.find((x) => x.id === sel) ??
    data[0] ?? { id: "", name: "", county: "", risk: 1, fgm: 0, cm: 0, advocacy: 0, total: 0 };
  const lvl = (x: CountyData) =>
    metric === "risk"
      ? x.risk
      : metric === "adv"
        ? Math.min(4, Math.ceil((x.advocacy || 0) / 4) || 1)
        : Math.min(4, Math.ceil((metric === "fgm" ? x.fgm : x.cm * 1.6) / 16));

  return (
    <>
      <PageHead
        eyebrow="GIS analytics"
        title="Spatial risk map"
        right={
          <div className="flex rounded-full border p-1 text-sm">
            {MAP_METRICS.map(([k, l]) => (
              <button
                key={k}
                onClick={() => setMetric(k)}
                className={`rounded-full px-4 py-1.5 ${metric === k ? "bg-ink text-ink-foreground" : "text-muted-foreground"}`}
              >
                {l}
              </button>
            ))}
          </div>
        }
      />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="card-soft space-y-8 p-6 lg:col-span-2">
          {COUNTIES.map((county) => (
            <div key={county}>
              <p className="mb-3 font-display text-xl">{county} County</p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {data
                  .filter((x) => x.county === county)
                  .map((x) => (
                    <button
                      key={x.id}
                      onClick={() => setSel(x.id)}
                      className={`h-28 rounded-2xl p-4 text-left transition hover:-translate-y-0.5 ${TONE[lvl(x)]} ${sel === x.id ? "ring-4 ring-ink" : ""}`}
                    >
                      <p className="font-semibold">{x.name}</p>
                      <p className="text-xs opacity-80">{LEVEL[lvl(x)]}</p>
                    </button>
                  ))}
              </div>
            </div>
          ))}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            Low{" "}
            {[1, 2, 3, 4].map((i) => (
              <span key={i} className={`h-3 w-8 rounded ${TONE[i]}`} />
            ))}{" "}
            Critical
          </div>
        </div>
        <div className="card-soft h-fit p-6">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">
            {s.county} County
          </p>
          <p className="mt-1 font-display text-3xl">{s.name}</p>
          <span
            className={`mt-3 inline-block rounded-full px-3 py-1 text-xs font-semibold ${TONE[s.risk]}`}
          >
            {LEVEL[s.risk]} risk
          </span>
          <dl className="mt-6 grid grid-cols-2 gap-4">
            <div className="rounded-xl bg-muted p-4">
              <dt className="text-xs text-muted-foreground">FGM signals</dt>
              <dd className="font-display text-3xl">{s.fgm}</dd>
            </div>
            <div className="rounded-xl bg-muted p-4">
              <dt className="text-xs text-muted-foreground">Child marriage</dt>
              <dd className="font-display text-3xl">{s.cm}</dd>
            </div>
            <div className="rounded-xl bg-muted p-4">
              <dt className="text-xs text-muted-foreground">Advocacy / resistance</dt>
              <dd className="font-display text-3xl">{s.advocacy || 0}</dd>
            </div>
            <div className="rounded-xl bg-muted p-4">
              <dt className="text-xs text-muted-foreground">Total narratives</dt>
              <dd className="font-display text-3xl">{s.total || 0}</dd>
            </div>
          </dl>
          <p className="mt-3 text-sm font-semibold">
            Risk score: {s.risk * 25}/100 · {LEVEL[s.risk]}
          </p>
          <p className="mt-5 text-sm text-muted-foreground">
            Counts are classifier signals from consented narratives. Treat as prompts for field
            follow-up, not confirmed cases.
          </p>
        </div>
      </div>
    </>
  );
}
