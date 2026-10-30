"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { PageHead } from "@/components/AppShell";

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

function translate(text: string) {
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
  const [res, setRes] = useState<ReturnType<typeof translate> | null>(null);
  const [busy, setBusy] = useState(false);
  const go = async () => {
    if (!text.trim()) return;
    setBusy(true);
    try {
      const r = await api.translate(text);
      setRes({ out: r.translated_text || r.translation || "", used: [] });
    } catch (e: any) {
      setRes({ out: `Error: ${e?.message || "translation failed"}`, used: [] });
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <PageHead
        eyebrow="Role 02 · Translator"
        title="English → Maa"
        desc="Write an awareness message in English. The app drafts a Maa version for your outreach team."
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card-soft flex flex-col p-6">
          <p className="mb-2 text-sm font-medium">English</p>
          <textarea
            rows={7}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="e.g. Protect our girls and send them to school."
            className="w-full flex-1 rounded-xl border bg-card px-4 py-3 text-lg outline-none focus:ring-2 focus:ring-ring"
          />
          <div className="mt-3 flex flex-wrap gap-2">
            {EXAMPLES.map((e) => (
              <button
                key={e}
                onClick={() => setText(e)}
                className="rounded-full border px-3 py-1 text-xs text-muted-foreground hover:bg-muted"
              >
                {e}
              </button>
            ))}
          </div>
          <button
            onClick={go}
            disabled={busy || !text.trim()}
            className="mt-5 rounded-full bg-primary py-3 font-semibold text-primary-foreground transition hover:brightness-110 disabled:opacity-50"
          >
            {busy ? "Translating…" : "Translate to Maa"}
          </button>
        </div>
        <div className="card-soft flex flex-col p-6">
          <p className="mb-2 text-sm font-medium">Maa</p>
          <div className="flex-1 rounded-xl bg-muted p-4">
            {res ? (
              <p className="font-display text-2xl leading-relaxed">{res.out}</p>
            ) : (
              <p className="text-muted-foreground">
                Your results will appear here.
              </p>
            )}
          </div>
          {res && res.used.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {res.used.filter(([, m]) => m).map(([en, m]) => (
                <span key={en} className="rounded-full border px-3 py-1 text-xs">
                  <b>{en}</b> → {m}
                </span>
              ))}
            </div>
          )}
          {res && (
            <button
              onClick={() => navigator.clipboard.writeText(res.out)}
              className="mt-4 w-fit rounded-full border px-4 py-2 text-sm"
            >
              Copy draft
            </button>
          )}
          {/* <p className="mt-5 rounded-xl border border-warning/50 bg-warning/10 p-3 text-xs">
            This is a drafting aid trained on a small set of examples. Always have a Maa speaker check the wording before sharing it with the community.
          </p> */}
        </div>
      </div>
    </>
  );
}