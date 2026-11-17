import Link from "next/link";
import { PageHead, CatBadge } from "@/components/AppShell";
import { SAMPLE, SUB_COUNTIES } from "@/lib/kingabinti";

const STATS = [
  { label: "Narratives analysed", value: "812", sub: "+46 this week" },
  { label: "FGM signals", value: "372", sub: "45.8% of corpus" },
  { label: "Child-marriage signals", value: "236", sub: "29.1% of corpus" },
  { label: "Macro F1", value: "0.81", sub: "target ≥ 0.75" },
];

const STEPS = [
  "Capture",
  "Consent gate",
  "Bilingual NLP",
  "Explain",
  "Validate",
  "Explore & export",
  "Offline sync",
];

const DASH_ROUTES: [string, string, string][] = [
  ["/explorer", "Explorer", "Search & export stories"],
  ["/map", "Risk map", "Where signs are growing"],
  ["/validation", "Validation", "How accurate the app is"],
  ["/ethics", "Ethics ledger", "Consent records"],
];

export default function DashboardClient() {
  const hot = [...SUB_COUNTIES].sort((a, b) => b.fgm + b.cm - (a.fgm + a.cm)).slice(0, 5);
  const max = (hot[0]?.fgm ?? 1) + (hot[0]?.cm ?? 0);
  return (
    <>
      <section className="relative mb-10 overflow-hidden rounded-3xl bg-ink p-8 text-ink-foreground md:p-12">
        <div className="shuka absolute inset-x-0 bottom-0 h-2" />
        <p className="text-xs uppercase tracking-[0.25em] text-accent">Role 03 · Coordinator</p>
        <h1 className="mt-3 max-w-3xl text-4xl leading-tight md:text-5xl">
          Hear the community early. Act before harm happens.
        </h1>
        <p className="mt-4 max-w-2xl text-ink-foreground/75">
          Kinga Binti classifies Swahili and Maa narratives for early signals of <em>ukeketaji</em>{" "}
          and <em>ndoa za mapema</em> — consent-first, explainable and offline-ready.
        </p>
        <div className="mt-7 flex flex-wrap gap-3">
          <Link
            href="/capture"
            className="rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground transition hover:brightness-105"
          >
            Capture a narrative
          </Link>
          <Link
            href="/map"
            className="rounded-full border border-ink-foreground/25 px-5 py-2.5 text-sm transition hover:bg-ink-foreground/10"
          >
            View risk map
          </Link>
        </div>
      </section>

      <div className="mb-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {DASH_ROUTES.map(([to, t, d]) => (
          <Link
            key={to}
            href={to}
            className="card-soft p-4 transition hover:-translate-y-0.5 hover:border-primary"
          >
            <p className="font-display text-lg">{t} →</p>
            <p className="text-xs text-muted-foreground">{d}</p>
          </Link>
        ))}
      </div>

      <div className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STATS.map((s) => (
          <div key={s.label} className="card-soft p-5">
            <p className="text-sm text-muted-foreground">{s.label}</p>
            <p className="mt-2 font-display text-4xl">{s.value}</p>
            <p className="mt-1 text-xs text-primary">{s.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="card-soft p-6 lg:col-span-3">
          <PageHead
            eyebrow="Latest"
            title="Recent narratives"
            right={
              <Link href="/explorer" className="text-sm text-primary">
                See all →
              </Link>
            }
          />
          <ul className="-mt-4 divide-y">
            {SAMPLE.slice(0, 5).map((n) => (
              <li key={n.id} className="flex items-start gap-4 py-3.5">
                <span className="mt-0.5 rounded-md bg-muted px-2 py-0.5 text-[11px] font-bold uppercase">
                  {n.lang}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate">{n.text}</p>
                  <p className="text-xs text-muted-foreground">
                    {n.subCounty} · {n.id} · {n.date}
                  </p>
                </div>
                <CatBadge c={n.category} />
              </li>
            ))}
          </ul>
        </div>
        <div className="card-soft p-6 lg:col-span-2">
          <PageHead eyebrow="Hotspots" title="Highest signal" />
          <div className="-mt-4 space-y-4">
            {hot.map((s) => (
              <div key={s.id}>
                <div className="mb-1 flex justify-between text-sm">
                  <span>{s.name}</span>
                  <span className="text-muted-foreground">{s.fgm + s.cm}</span>
                </div>
                <div className="flex h-2.5 overflow-hidden rounded-full bg-muted">
                  <div className="bg-risk-4" style={{ width: `${(s.fgm / max) * 100}%` }} />
                  <div className="bg-risk-2" style={{ width: `${(s.cm / max) * 100}%` }} />
                </div>
              </div>
            ))}
            <p className="flex gap-4 pt-1 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <i className="h-2 w-2 rounded-full bg-risk-4" /> FGM
              </span>
              <span className="flex items-center gap-1.5">
                <i className="h-2 w-2 rounded-full bg-risk-2" /> Child marriage
              </span>
            </p>
          </div>
        </div>
      </div>

      <div className="card-soft mt-6 p-6">
        <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
          Workflow
        </p>
        <ol className="grid gap-3 sm:grid-cols-4 lg:grid-cols-7">
          {STEPS.map((s, i) => (
            <li key={s} className="rounded-xl bg-muted p-3">
              <span className="font-display text-2xl text-primary">{i + 1}</span>
              <p className="text-sm font-medium">{s}</p>
            </li>
          ))}
        </ol>
      </div>
    </>
  );
}
