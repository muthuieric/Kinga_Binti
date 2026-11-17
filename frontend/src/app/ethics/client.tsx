"use client";

import { useEffect, useState } from "react";
import { PageHead } from "@/components/AppShell";
import { api, type EthicsLedgerResponse } from "@/lib/api";

const PRINCIPLES = [
  ["Consent is mandatory", "No narrative is stored or analysed without explicit consent."],
  ["Pseudonymisation", "Text is separated from demographics; records carry KB-NAR tokens."],
  ["Right to be forgotten", "Withdrawing consent purges the linked record."],
  ["Network isolation", "Databases are bound to the local host, never exposed publicly."],
];

export default function EthicsClient() {
  const [rows, setRows] = useState<EthicsLedgerResponse[]>([]);
  const [purged, setPurged] = useState<string[]>([]);
  useEffect(() => {
    api
      .ethicsLedger()
      .then((d) => setRows(d))
      .catch(() => {
        // ignore fetch errors
      });
  }, []);
  return (
    <>
      <PageHead
        eyebrow="Ubuntu governance"
        title="Ethics & consent ledger"
        desc="Umuntu ngumuntu ngabantu — every record belongs to the community that shared it. Kenya DPA 2019 aligned."
      />
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {PRINCIPLES.map(([t, d]) => (
          <div key={t} className="card-soft border-t-4 border-t-primary p-5">
            <p className="font-semibold">{t}</p>
            <p className="mt-1 text-sm text-muted-foreground">{d}</p>
          </div>
        ))}
      </div>
      <div className="card-soft divide-y">
        {rows.map((n) => (
          <div key={n.narrative_id} className="flex flex-wrap items-center gap-4 p-4">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-success/15 text-success">
              ✓
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-mono text-sm break-all">{n.pseudonymised_token}</p>
              <p className="font-mono text-xs text-muted-foreground break-all">
                sha256 {String(n.cryptographic_hash).slice(0, 16)}… · consent {n.consent_timestamp}{" "}
                · {n.custodian_cbo}
              </p>
            </div>
            <button
              onClick={() => {
                api.withdrawConsent(n.narrative_id).catch(() => {});
                setRows((r) => r.filter((x) => x.narrative_id !== n.narrative_id));
                setPurged((p) => [n.pseudonymised_token || n.narrative_id, ...p]);
              }}
              className="rounded-full border border-destructive/40 px-4 py-1.5 text-sm text-destructive transition hover:bg-destructive hover:text-destructive-foreground"
            >
              Withdraw consent
            </button>
          </div>
        ))}
        {purged.map((id) => (
          <div
            key={id}
            className="flex items-center gap-4 bg-muted/50 p-4 text-sm text-muted-foreground"
          >
            <span className="grid h-9 w-9 place-items-center rounded-full bg-muted">∅</span>
            <span className="font-mono">{id}</span> — consent withdrawn, record purged
          </div>
        ))}
      </div>
    </>
  );
}
