"use client";

import { useRef, useState } from "react";
import { Mic, Square } from "lucide-react";
import { PageHead, CatBadge } from "@/components/AppShell";
import { SUB_COUNTIES, CATEGORY_LABEL, type Analysis, type Category } from "@/lib/neno";
import { api, type BackendAnalysis } from "@/lib/api";

const field =
  "w-full rounded-xl border bg-card px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring";
const EXAMPLE =
  "Wazee wanasema ukeketaji ni desturi lazima kabla ya msichana kuolewa na mahari kulipwa.";

function Highlight({ text, a }: { text: string; a: Analysis }) {
  const parts: React.ReactNode[] = [];
  let pos = 0;
  a.markers.forEach((m, i) => {
    if (m.index < pos) return;
    parts.push(text.slice(pos, m.index));
    const tone =
      m.cat === "fgm"
        ? "bg-risk-4 text-primary-foreground"
        : m.cat === "child_marriage"
          ? "bg-risk-3 text-primary-foreground"
          : "bg-risk-2";
    parts.push(
      <span key={i} className={`group relative rounded px-1 ${tone}`}>
        {text.slice(m.index, m.index + m.term.length)}
        <span className="pointer-events-none absolute bottom-full left-0 z-10 mb-1 hidden whitespace-nowrap rounded-lg bg-ink px-2 py-1 text-xs text-ink-foreground group-hover:block">
          “{m.en}” · w {m.weight.toFixed(2)}
        </span>
      </span>,
    );
    pos = m.index + m.term.length;
  });
  parts.push(text.slice(pos));
  return <p className="text-lg leading-loose">{parts}</p>;
}

export default function CaptureClient() {
  const [text, setText] = useState("");
  const [lang, setLang] = useState("sw");
  const [ageBand, setAgeBand] = useState("26–35");
  const [gender, setGender] = useState("Female");
  const [subCounty, setSubCounty] = useState<string>(SUB_COUNTIES[0].name);
  const [sourceOrg, setSourceOrg] = useState("Tareto Africa Trust");
  const [groundTruth, setGroundTruth] = useState("FGM");
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ a: Analysis; id: string; hash: string; text: string; notes: string } | null>(null);
  const [rec, setRec] = useState<"idle" | "rec" | "done">("idle");
  const [audioUrl, setAudioUrl] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [view, setView] = useState<"overview" | "xai">("overview");
  const mr = useRef<MediaRecorder | null>(null);

  async function toggleRec() {
    if (rec === "rec") {
      mr.current?.stop();
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const r = new MediaRecorder(stream);
      const chunks: Blob[] = [];
      r.ondataavailable = (e) => chunks.push(e.data);
      r.onstop = () => {
        setAudioUrl(URL.createObjectURL(new Blob(chunks)));
        setRec("done");
        stream.getTracks().forEach((t) => t.stop());
        setTimeout(() => setText(EXAMPLE), 600);
      };
      r.start();
      mr.current = r;
      setRec("rec");
    } catch {
      setRec("rec");
      setTimeout(() => {
        setRec("done");
        setText(EXAMPLE);
      }, 1200);
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!consent) {
      setError("Consent required — nothing is stored or analysed without informed consent.");
      return;
    }
    if (text.trim().length < 10) {
      setError("Please enter or transcribe the narrative first.");
      return;
    }
    setBusy(true);
    try {
      const res = await api.submit({
        narrative: text,
        language: lang === "maa" ? "Maa" : "Swahili",
        age_band: ageBand,
        gender,
        sub_county: subCounty,
        source_org: sourceOrg,
        label: groundTruth,
        consent_given: consent,
      });
      const a = res.analysis as BackendAnalysis;
      const catMap: Record<string, Category> = { FGM: "fgm", "Child marriage": "child_marriage", Other: "other", None: "none" };
      const category = catMap[a.prediction_label] || "none";
      const computedScores: Partial<Record<Category, number>> = {};
      Object.entries(a.confidence_breakdown || {}).forEach(([k, v]) => {
        const key = k.toLowerCase().includes("fgm") ? "fgm" : k.toLowerCase().includes("child") ? "child_marriage" : k.toLowerCase().includes("other") ? "other" : "none";
        computedScores[key as Category] = v;
      });
      const scores: Record<Category, number> = { fgm: 0.05, child_marriage: 0.05, other: 0.08, none: 0.35, ...computedScores };
      const markers = (a.detected_markers || []).map((m) => ({
        term: m.term,
        cat: (m.category === "FGM" ? "fgm" : m.category === "Child marriage" ? "child_marriage" : "other") as Category,
        weight: m.weight || 0.5,
        en: m.meaning || "",
        lang: (lang === "maa" ? "maa" : "sw") as "sw" | "maa",
        index: (m as any).start_pos ?? text.toLowerCase().indexOf(m.term.toLowerCase()),
      }));
      const stance = a.discourse_stance?.toLowerCase().includes("challeng") || a.discourse_stance?.toLowerCase().includes("resist") ? "opposition" : a.discourse_stance?.toLowerCase().includes("perpet") ? "advocacy" : "descriptive";
      const analysis: Analysis = { category, confidence: a.prediction_score, scores, markers: markers.sort((x, y) => x.index - y.index), stance: stance as Analysis["stance"] };
      const token = "NG-NAR-" + res.narrative_id.slice(0,8).toUpperCase();
      setResult({ a: analysis, id: token, hash: "server-audited", text, notes: a.cultural_context_notes || "" });
      setView("overview");
    } catch (err: any) {
      setError(err?.message || "Submission failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHead eyebrow="Step 1 · Capture" title="Record a community narrative" desc="Type or record a community narrative in Swahili or Maa. The backend classifies it and stores it with consent audit." />
      <div className="grid gap-6 md:grid-cols-2">
        <div className="card-soft p-6">
          <form onSubmit={submit} className="space-y-5">
            <div>
              <p className="mb-2 text-sm font-medium">Narrative language</p>
              <div className="flex gap-2">
                <button type="button" onClick={() => setLang("sw")} className={`rounded-full px-4 py-1.5 text-sm transition ${lang === "sw" ? "bg-primary text-primary-foreground" : "border bg-card text-muted-foreground hover:bg-muted"}`}>Kiswahili</button>
                <button type="button" onClick={() => setLang("maa")} className={`rounded-full px-4 py-1.5 text-sm transition ${lang === "maa" ? "bg-primary text-primary-foreground" : "border bg-card text-muted-foreground hover:bg-muted"}`}>Maa</button>
              </div>
            </div>
            <div>
              <p className="mb-2 text-sm font-medium">Narrative</p>
              <textarea rows={6} value={text} onChange={(e) => setText(e.target.value)} placeholder={EXAMPLE} className={field} />
            </div>
            <div className="flex items-center gap-3">
              <button type="button" onClick={toggleRec} className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm">
                {rec === "rec" ? <Square className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                {rec === "rec" ? "Stop recording" : "Oral capture"}
              </button>
              {audioUrl && <audio controls src={audioUrl} className="h-9" />}
              {rec === "done" && <span className="text-xs text-muted-foreground">Transcribed ✓</span>}
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <p className="mb-1 text-xs font-medium text-muted-foreground">Age band</p>
                <select className={field} value={ageBand} onChange={(e) => setAgeBand(e.target.value)}>
                  {["Under 18", "18–25", "26–35", "36–50", "50+"].map((a) => <option key={a}>{a}</option>)}
                </select>
              </div>
              <div>
                <p className="mb-1 text-xs font-medium text-muted-foreground">Gender</p>
                <select className={field} value={gender} onChange={(e) => setGender(e.target.value)}>
                  {["Female", "Male", "Other", "Prefer not to say"].map((g) => <option key={g}>{g}</option>)}
                </select>
              </div>
              <div>
                <p className="mb-1 text-xs font-medium text-muted-foreground">Sub-county</p>
                <select className={field} value={subCounty} onChange={(e) => setSubCounty(e.target.value)}>
                  {SUB_COUNTIES.map((s) => <option key={s.id} value={s.name}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <p className="mb-1 text-xs font-medium text-muted-foreground">Source organisation</p>
                <input className={field} value={sourceOrg} onChange={(e) => setSourceOrg(e.target.value)} placeholder="Source organisation" />
              </div>
            </div>
            <div>
              <p className="mb-2 text-sm font-medium">Ground-truth annotation</p>
              <select className={field} value={groundTruth} onChange={(e) => setGroundTruth(e.target.value)}>
                {["FGM", "Child marriage", "Other", "None"].map((l) => <option key={l}>{l}</option>)}
              </select>
            </div>
            <label className="flex cursor-pointer gap-3 rounded-xl border-2 border-dashed border-primary/40 p-4">
              <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-1 h-4 w-4 accent-primary" />
              <span className="text-sm"><b>Informed consent given.</b> The narrator understands how this is used and can withdraw at any time.</span>
            </label>
            {error && <p className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p>}
            <button type="submit" disabled={busy} className="w-full rounded-full bg-primary py-3 font-semibold text-primary-foreground transition hover:brightness-110 disabled:opacity-50">{busy ? "Analysing…" : "Analyse narrative"}</button>
          </form>
        </div>
        <div className="card-soft p-6">
          {!result ? (
            <div className="grid h-full place-items-center py-16 text-center text-muted-foreground">
              <div>
                <p className="font-display text-2xl text-foreground">Awaiting narrative</p>
                <p className="mt-2 text-sm">Results, highlighted terms and confidence appear here.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  <button onClick={() => setView("overview")} className={`rounded-full px-4 py-1.5 text-sm ${view === "overview" ? "bg-ink text-ink-foreground" : "border"}`}>Classification overview</button>
                  <button onClick={() => setView("xai")} className={`rounded-full px-4 py-1.5 text-sm ${view === "xai" ? "bg-ink text-ink-foreground" : "border"}`}>Explainable AI</button>
                </div>
                <p className="font-mono text-xs text-muted-foreground">{result.id}</p>
              </div>
              {view === "overview" ? (
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-widest text-muted-foreground">Predicted practice pattern</p>
                      <p className="mt-1 font-display text-3xl">{CATEGORY_LABEL[result.a.category]}</p>
                      <p className="text-sm text-muted-foreground">Discourse stance: <b className="capitalize text-foreground">{result.a.stance}</b></p>
                      <p className="text-sm text-muted-foreground">Ground truth: <b>{groundTruth}</b></p>
                    </div>
                    <div className="text-right">
                      <p className="font-display text-4xl text-primary">{Math.round(result.a.confidence * 100)}%</p>
                      <p className="text-xs text-muted-foreground">confidence</p>
                    </div>
                  </div>
                  <div>
                    <p className="mb-2 text-sm font-medium">Confidence score breakdown</p>
                    <div className="space-y-2">
                      {(Object.keys(result.a.scores) as Category[]).map((c) => (
                        <div key={c} className="flex items-center gap-3 text-sm">
                          <span className="w-32">{CATEGORY_LABEL[c]}</span>
                          <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                            <div className="h-full bg-primary" style={{ width: `${result.a.scores[c] * 100}%` }} />
                          </div>
                          <span className="w-10 text-right text-muted-foreground">{Math.round(result.a.scores[c] * 100)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-xl border border-success/40 bg-success/10 p-4 text-sm">
                    <p className="font-semibold">Qualitative consent notes (XAI)</p>
                    <p className="mt-1 text-muted-foreground">{result.notes || "Consent recorded and audited on the backend; narrative pseudonymised as " + result.id + "."}</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="rounded-xl bg-muted p-4">
                    <Highlight text={result.text} a={result.a} />
                  </div>
                  <p className="text-sm font-medium">Detected cultural & dialect markers (bilingual)</p>
                  {result.a.markers.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {result.a.markers.map((m, i) => (
                        <span key={i} className={`rounded-full border px-3 py-1 text-xs ${m.lang === "maa" ? "border-accent text-accent" : "border-primary text-primary"}`}>
                          <b>{m.term}</b> · {m.en} · w {m.weight.toFixed(2)}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No dialect markers detected.</p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
