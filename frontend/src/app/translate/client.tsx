"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { PageHead } from "@/components/AppShell";
import { Languages, Loader2, Copy, Check, Sparkles, ArrowRight } from "lucide-react";

const GLOSS: [string, string][] = [
  ["female genital mutilation", "emuratare oo ntoyie"],
  ["circumcision", "emuratare"],
  ["child marriage", "enkiyieu e nkera"],
  ["early marriage", "enkiyieu e nkera"],
  ["girls", "intoyie"],
  ["girl", "entito"],
  ["children", "inkera"],
  ["child", "enkerai"],
  ["school", "osukul"],
  ["education", "enkisoma"],
  ["protect", "aring'are"],
  ["community", "olosho"],
  ["mother", "yieyio"],
  ["father", "papa"],
  ["elders", "ilpayiani"],
  ["health", "eseriani"],
  ["stop", "aitoki"],
  ["future", "enkata naaponu"],
  ["thank you", "ashe oleng"],
  ["we", "iyiook"],
  ["our", "lang"],
  ["and", "o"],
  ["is", "ena"],
  ["the", ""],
  ["must", "keyielo"],
  ["go to", "nilo"],
  ["harmful", "torrono"],
  ["love", "anyor"],
  ["peace", "eserian"],
  ["help", "aretoo"],
];

const EXAMPLES = [
  "Protect our girls and send them to school.",
  "Stop child marriage — every girl deserves a future.",
  "Elders and mothers, thank you for protecting our children.",
];

function ruleBasedGlossary(text: string) {
  let out = text.toLowerCase();
  const used: [string, string][] = [];
  for (const [en, maa] of GLOSS) {
    const re = new RegExp(`\\b${en}\\b`, "g");
    if (re.test(out)) {
      used.push([en, maa]);
      out = out.replace(re, maa);
    }
  }
  out = out.replace(/\s+/g, " ").trim();
  return {
    out: out.charAt(0).toUpperCase() + out.slice(1),
    used,
  };
}

export default function TranslateClient() {
  const [text, setText] = useState("");
  const [targetLang, setTargetLang] = useState<"maa" | "swahili">("maa");
  const [res, setRes] = useState<{ out: string; used: [string, string][]; source?: string } | null>(
    null,
  );
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  const go = async () => {
    if (!text.trim() || busy) return;
    setBusy(true);
    setCopied(false);
    try {
      const r = await api.translate(text, targetLang);
      const glossaryMatches = targetLang === "maa" ? ruleBasedGlossary(text).used : [];
      setRes({
        out: r.translated_text || r.translation || "",
        used: glossaryMatches,
        source: targetLang === "maa" ? "NLLB-200 + LoRA" : "NLLB-200",
      });
    } catch (e) {
      // Fallback to offline rule-based dialect gloss if neural backend is unavailable (Maa only)
      if (targetLang === "maa") {
        const fallback = ruleBasedGlossary(text);
        if (fallback.used.length > 0) {
          setRes({
            out: fallback.out,
            used: fallback.used,
            source: "Dialect Glossary Fallback",
          });
          return;
        }
      }
      const message = e instanceof Error ? e.message : "connection error";
      setRes({
        out: `Translation service unavailable: ${message}. Please ensure the backend is running.`,
        used: [],
      });
    } finally {
      setBusy(false);
    }
  };

  const copyToClipboard = async () => {
    if (!res?.out) return;
    try {
      await navigator.clipboard.writeText(res.out);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // ignore clipboard errors
    }
  };

  return (
    <>
      <PageHead
        eyebrow="Role 02 · Outreach Translator"
        title={`English → ${targetLang === "maa" ? "Maa" : "Swahili"}`}
        desc={`Write an awareness message in English. The app drafts a ${
          targetLang === "maa" ? "Maa (Maasai)" : "Swahili"
        } version for your outreach team.`}
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card-soft flex flex-col p-6 shadow-sm">
          <label
            htmlFor="english-input"
            className="mb-2 text-sm font-medium flex items-center justify-between"
          >
            <span>English source message</span>
            <span className="text-xs text-muted-foreground">{text.length} chars</span>
          </label>
          <textarea
            id="english-input"
            rows={7}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="e.g. Protect our girls and send them to school."
            className="w-full flex-1 rounded-xl border bg-card px-4 py-3 text-base outline-none focus:ring-2 focus:ring-ring transition"
          />
          <div className="mt-3 flex flex-wrap gap-2 items-center">
            <span className="text-xs font-medium text-muted-foreground mr-1">Quick examples:</span>
            {EXAMPLES.map((e) => (
              <button
                key={e}
                type="button"
                onClick={() => setText(e)}
                className="cursor-pointer rounded-full border bg-background px-3 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition active:scale-95"
              >
                {e}
              </button>
            ))}
          </div>

          <div className="mt-4 pt-3 border-t">
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              Target Language
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setTargetLang("maa");
                  setRes(null);
                }}
                className={`flex flex-col items-start rounded-xl border p-3 text-left transition cursor-pointer ${
                  targetLang === "maa"
                    ? "border-primary bg-primary/5 text-foreground ring-1 ring-primary shadow-xs"
                    : "border-border bg-card text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                }`}
              >
                <div className="flex w-full items-center justify-between">
                  <span className="font-semibold text-sm">Maa (Maasai)</span>
                  <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-700 dark:text-amber-400">
                    LoRA Adapter
                  </span>
                </div>
                <span className="mt-1 text-xs text-muted-foreground">
                  NLLB-200 + KnoxDevelopers LoRA
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setTargetLang("swahili");
                  setRes(null);
                }}
                className={`flex flex-col items-start rounded-xl border p-3 text-left transition cursor-pointer ${
                  targetLang === "swahili"
                    ? "border-primary bg-primary/5 text-foreground ring-1 ring-primary shadow-xs"
                    : "border-border bg-card text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                }`}
              >
                <div className="flex w-full items-center justify-between">
                  <span className="font-semibold text-sm">Swahili (Kiswahili)</span>
                  <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-700 dark:text-emerald-400">
                    Native
                  </span>
                </div>
                <span className="mt-1 text-xs text-muted-foreground">
                  NLLB-200 Native
                </span>
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={go}
            disabled={busy || !text.trim()}
            className="mt-5 flex items-center justify-center gap-2.5 rounded-full bg-primary py-3.5 px-6 font-semibold text-primary-foreground shadow-md transition-all hover:brightness-105 hover:shadow-lg active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {busy ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>
                  Translating to {targetLang === "maa" ? "Maa" : "Swahili"} with AI model…
                </span>
              </>
            ) : (
              <>
                <Languages className="h-5 w-5" />
                <span>Translate to {targetLang === "maa" ? "Maa" : "Swahili"}</span>
                <ArrowRight className="h-4 w-4 opacity-75" />
              </>
            )}
          </button>
          {busy && (
            <p className="mt-2 text-center text-xs text-muted-foreground animate-pulse">
              Running NLLB-200 seq2seq translation on CPU. Please wait a few seconds…
            </p>
          )}
        </div>

        <div className="card-soft flex flex-col p-6 shadow-sm">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-medium">
              {targetLang === "maa" ? "Maa (Maasai)" : "Swahili"} translation
            </p>
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium border ${
                targetLang === "maa"
                  ? "bg-amber-500/10 text-amber-700 border-amber-500/20 dark:text-amber-300"
                  : "bg-emerald-500/10 text-emerald-700 border-emerald-500/20 dark:text-emerald-300"
              }`}
            >
              <Sparkles className="h-3 w-3" />
              {targetLang === "maa" ? "NLLB-200 + LoRA" : "NLLB-200"}
            </span>
          </div>
          <div className="flex-1 rounded-xl bg-muted/70 border p-4.5 min-h-[160px] flex items-center">
            {res ? (
              <p className="font-display text-2xl leading-relaxed text-foreground select-text">
                {res.out}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                Click translate to generate an outreach draft in{" "}
                {targetLang === "maa" ? "Maa" : "Swahili"}.
              </p>
            )}
          </div>

          {targetLang === "maa" && res && res.used.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="w-full text-xs font-medium text-muted-foreground">
                Cultural lexicon matches:
              </span>
              {res.used
                .filter(([, m]) => m)
                .map(([en, m]) => (
                  <span
                    key={en}
                    className="rounded-full border bg-background px-3 py-1 text-xs shadow-xs"
                  >
                    <b className="text-primary">{en}</b> → <span className="font-medium">{m}</span>
                  </span>
                ))}
            </div>
          )}

          {res && (
            <div className="mt-5 flex items-center justify-between border-t pt-4">
              <button
                type="button"
                onClick={copyToClipboard}
                className="cursor-pointer inline-flex items-center gap-2 rounded-full border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-muted active:scale-95 transition shadow-xs"
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4 text-emerald-600" />
                    <span className="text-emerald-600">Copied to clipboard!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 text-muted-foreground" />
                    <span>Copy draft</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
