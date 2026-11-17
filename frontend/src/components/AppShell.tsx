"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useT, type UiLang, type Key } from "@/lib/i18n";

const NAV: { href: string; k: Key }[] = [
  { href: "/", k: "home" },
  { href: "/dashboard", k: "dashboard" },
  { href: "/capture", k: "capture" },
  { href: "/translate", k: "translate" },
  { href: "/explorer", k: "explorer" },
  { href: "/map", k: "map" },
  { href: "/validation", k: "validation" },
  { href: "/ethics", k: "ethics" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const { lang, setLang, t } = useT();
  const pathname = usePathname();
  const router = useRouter();
  const [online, setOnline] = useState(true);
  useEffect(() => {
    setOnline(navigator.onLine);
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen">
      <header className="fixed top-0 left-0 right-0 z-40 border-b bg-background/90 backdrop-blur">
        <div className="shuka h-1.5" />
        <div className="mx-auto flex max-w-7xl items-center gap-6 px-5 py-3">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-primary font-display text-lg text-primary-foreground">
              N
            </span>
            <span className="leading-tight">
              <span className="block font-display text-lg">Kinga Binti</span>
              <span className="hidden xl:block text-[11px] uppercase tracking-widest text-muted-foreground">
                Community Narrative Monitor
              </span>
            </span>
          </Link>
          <nav className="ml-2 hidden flex-1 gap-0.5 xl:flex">
            {NAV.map((n) => {
              const active = isActive(n.href);
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  className={
                    "whitespace-nowrap rounded-full px-3 py-1.5 text-sm text-muted-foreground transition hover:bg-muted hover:text-foreground" +
                    (active ? " !bg-ink !text-ink-foreground" : "")
                  }
                  onClick={() => router.refresh()}
                >
                  {t(n.k)}
                </Link>
              );
            })}
          </nav>
          <div className="ml-auto flex items-center gap-3">
            <span
              className={`flex items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1 text-xs ${online ? "text-success" : "text-warning"}`}
            >
              <span className={`h-2 w-2 rounded-full ${online ? "bg-success" : "bg-warning"}`} />
              {online ? t("online") : t("offline")}
            </span>
            <div className="flex rounded-full border p-0.5 text-xs">
              {(["en", "sw", "maa"] as UiLang[]).map((l) => (
                <button
                  key={l}
                  onClick={() => setLang(l)}
                  className={`rounded-full px-2.5 py-1 uppercase ${lang === l ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-4 pb-2 xl:hidden">
          {NAV.map((n) => {
            const active = isActive(n.href);
            return (
              <Link
                key={n.href}
                href={n.href}
                className={
                  "whitespace-nowrap rounded-full px-3 py-1 text-sm text-muted-foreground" +
                  (active ? " !bg-ink !text-ink-foreground" : "")
                }
                onClick={() => router.refresh()}
              >
                {t(n.k)}
              </Link>
            );
          })}
        </nav>
      </header>
      <main className="mx-auto max-w-7xl px-5 py-8 pt-24 md:pt-16">{children}</main>
      <footer className="border-t py-6 text-center text-xs text-muted-foreground">
        Narok & Kajiado Counties · Consent-first · Kenya DPA 2019 aligned · Research aid — human
        review required
      </footer>
    </div>
  );
}

export function PageHead({
  eyebrow,
  title,
  desc,
  right,
}: {
  eyebrow: string;
  title: string;
  desc?: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">{eyebrow}</p>
        <h1 className="mt-1 text-4xl">{title}</h1>
        {desc && <p className="mt-2 max-w-2xl text-muted-foreground">{desc}</p>}
      </div>
      {right}
    </div>
  );
}

export function CatBadge({ c }: { c: string }) {
  const map: Record<string, string> = {
    fgm: "bg-risk-4 text-primary-foreground",
    child_marriage: "bg-risk-3 text-primary-foreground",
    other: "bg-risk-2 text-foreground",
    none: "bg-muted text-muted-foreground",
  };
  const label: Record<string, string> = {
    fgm: "FGM",
    child_marriage: "Child marriage",
    other: "Other norm",
    none: "No signal",
  };
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${map[c]}`}>
      {label[c]}
    </span>
  );
}
