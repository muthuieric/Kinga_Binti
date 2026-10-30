import Link from "next/link";

const ROLES = [
  {
    to: "/capture",
    n: "01",
    title: "Field collector",
    who: "For community workers in the villages",
    desc: "Write down or record a story someone shares, in Swahili or Maa. With their permission, the app reads it and flags any warning signs.",
    cta: "Start collecting",
  },
  {
    to: "/translate",
    n: "02",
    title: "Translator",
    who: "For outreach and awareness teams",
    desc: "Write a message in English and the app drafts it in Maa, so campaigns can reach people in their own language.",
    cta: "Open translator",
  },
  {
    to: "/dashboard",
    n: "03",
    title: "Coordinator",
    who: "For programme leads and researchers",
    desc: "See the bigger picture: which areas need attention, how accurate the app is, and who has given or withdrawn consent.",
    cta: "Open dashboard",
  },
] as const;

const HOW = [
  [
    "Listen",
    "A field worker collects a story from the community. Only after the person agrees.",
  ],
  [
    "Understand",
    "The app looks for words and phrases linked to cutting (ukeketaji) or early marriage (ndoa za mapema), and shows exactly why.",
  ],
  [
    "Act",
    "Coordinators see where warning signs are growing and send help early, before harm happens.",
  ],
];

export const metadata = {
  title: "NenoGuard — Listening to communities to protect girls",
  description:
    "NenoGuard helps field workers in Narok and Kajiado spot early warning signs of FGM and child marriage from community stories — with consent first.",
  openGraph: {
    title: "NenoGuard — Listening to communities to protect girls",
    description:
      "Early warning signs of FGM and child marriage, from community stories in Swahili and Maa.",
  },
};

export default function Home() {
  return (
    <>
      <section className="relative -mt-2 mb-14 overflow-hidden rounded-3xl">
        <img src="/hero-savanna.jpg" alt="Maasai people walking across the savanna at sunset near Narok" width={1920} height={1088} className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-ink/90 via-ink/70 to-ink/30" />
        <div className="relative px-8 py-16 text-ink-foreground md:px-14 md:py-24">
          <p className="text-xs uppercase tracking-[0.25em] text-accent">Narok & Kajiado, Kenya</p>
          <h1 className="mt-4 max-w-3xl text-4xl leading-tight md:text-6xl">Listening to communities, so we can protect girls sooner.</h1>
          <p className="mt-6 max-w-2xl text-lg text-ink-foreground/85">
            People often talk about female genital mutilation and child marriage long before they happen. NenoGuard helps local workers notice those conversations early, in Swahili and Maa, and get support to the right place in time.
          </p>
          <a href="#roles" className="mt-8 inline-block rounded-full bg-accent px-6 py-3 font-semibold text-accent-foreground transition hover:brightness-105">Choose your role ↓</a>
        </div>
        <div className="shuka absolute inset-x-0 bottom-0 h-2" />
      </section>

      <section className="mb-16 grid gap-5 md:grid-cols-3">
        {HOW.map(([t, d], i) => (
          <div key={t} className="flex gap-4">
            <span className="font-display text-5xl text-primary/30">{i + 1}</span>
            <div>
              <p className="font-display text-2xl">{t}</p>
              <p className="mt-1 text-muted-foreground">{d}</p>
            </div>
          </div>
        ))}
      </section>

      <section id="roles" className="mb-16 scroll-mt-24">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
          Get started
        </p>
        <h2 className="mt-1 mb-8 text-4xl">Who are you today?</h2>
        <div className="grid gap-5 md:grid-cols-3">
          {ROLES.map((r) => (
            <Link
              key={r.to}
              href={r.to}
              className="card-soft group flex flex-col p-7 transition hover:-translate-y-1 hover:border-primary"
            >
              <span className="font-display text-sm text-primary">{r.n}</span>
              <p className="mt-3 font-display text-3xl">{r.title}</p>
              <p className="mt-1 text-sm font-medium text-muted-foreground">{r.who}</p>
              <p className="mt-4 flex-1 text-muted-foreground">{r.desc}</p>
              <span
                className="mt-6 inline-flex w-fit rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition group-hover:brightness-110"
              >
                {r.cta} →
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="card-soft grid gap-6 p-8 md:grid-cols-2">
        <div>
          <p className="font-display text-2xl">Built on trust</p>
          <p className="mt-2 text-muted-foreground">
            These stories are sensitive. Nothing is saved without permission, names are never stored next to stories, and anyone can ask for their story to be deleted at any time.
          </p>
        </div>
        <ul className="space-y-2 text-sm">
          {[
            "Permission comes first — always",
            "Works without internet, syncs later",
            "Shows why it flagged something",
            "A helper for people, never a replacement",
          ].map((x) => (
            <li key={x} className="flex gap-3 rounded-xl bg-muted px-4 py-3">
              <span className="text-success">✓</span>{x}
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}