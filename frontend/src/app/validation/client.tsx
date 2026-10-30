import { PageHead, CatBadge } from "@/components/AppShell";
import { CONFUSION, CONF_LABELS, CATEGORY_LABEL } from "@/lib/neno";

function metrics() {
  const n = CONFUSION.length;
  const total = CONFUSION.flat().reduce((a, b) => a + b, 0);
  const row = (i: number) => CONFUSION[i]!.reduce((a, b) => a + b, 0);
  const col = (j: number) => CONFUSION.reduce((a, r) => a + r[j]!, 0);
  const diag = CONFUSION.reduce((a, r, i) => a + r[i]!, 0);
  const po = diag / total;
  let pe = 0;
  const f1s: number[] = [];
  for (let i = 0; i < n; i++) {
    pe += (row(i) * col(i)) / (total * total);
    const tp = CONFUSION[i]![i]!;
    const p = tp / col(i);
    const r = tp / row(i);
    f1s.push((2 * p * r) / (p + r));
  }
  return { total, acc: po, kappa: (po - pe) / (1 - pe), f1: f1s.reduce((a, b) => a + b, 0) / n, f1s };
}

export default function ValidationClient() {
  const m = metrics();
  const max = Math.max(...CONFUSION.flat());
  // Per-class precision / recall / F1 / support derived from the confusion matrix.
  const perClass = CONF_LABELS.map((_, i) => {
    const tp = CONFUSION[i]![i]!;
    const support = CONFUSION[i]!.reduce((a, b) => a + b, 0);
    const predTotal = CONFUSION.reduce((a, r) => a + r[i]!, 0);
    const precision = predTotal ? tp / predTotal : 0;
    const recall = support ? tp / support : 0;
    const f1 = precision + recall ? (2 * precision * recall) / (precision + recall) : 0;
    return { label: CONF_LABELS[i]!, precision, recall, f1, support };
  });
  const totalSupport = perClass.reduce((a, c) => a + c.support, 0);
  return (
    <>
      <PageHead
        eyebrow="Step 5 · Review"
        title="Field validation"
        desc={`NLP predictions vs. human ground-truth annotations across ${m.total} narratives.`}
        right={
          <label className="cursor-pointer rounded-full bg-ink px-4 py-2 text-sm text-ink-foreground">
            Upload annotated batch
            <input type="file" accept=".csv,.json" className="hidden" />
          </label>
        }
      />
      <div className="mb-6 grid gap-4 sm:grid-cols-4">
        {[
          ["Evaluated corpus size", m.total, "Annotated narratives"],
          ["Macro F1", m.f1, "Target ≥ 0.75"],
          ["Cohen's κ", m.kappa, "Substantial agreement"],
          ["Accuracy", m.acc, "Exact match"],
        ].map(([l, v, s]) => (
          <div key={l as string} className="card-soft p-5">
            <p className="text-sm text-muted-foreground">{l}</p>
            <p className="mt-1 font-display text-5xl">
              {Number.isInteger(v as number) ? (v as number) : (v as number).toFixed(2)}
            </p>
            <p
              className={`mt-1 text-xs ${
                l === "Macro F1" && (v as number) >= 0.75
                  ? "text-success"
                  : "text-primary"
              }`}
            >
              {s}
            </p>
          </div>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="card-soft overflow-x-auto p-6 lg:col-span-2">
          <p className="mb-4 font-display text-xl">Confusion matrix</p>
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="p-2 text-left text-xs text-muted-foreground">
                  True ↓ / Pred →
                </th>
                {CONF_LABELS.map((c) => (
                  <th key={c} className="p-2 text-xs">
                    {CATEGORY_LABEL[c]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {CONFUSION.map((r, i) => (
                <tr key={i}>
                  <th className="p-2 text-left text-xs">
                    {CATEGORY_LABEL[CONF_LABELS[i]!]}
                  </th>
                  {r.map((v, j) => (
                    <td key={j} className="p-1">
                      <div
                        className={`grid h-14 place-items-center rounded-lg font-semibold ${i === j ? "bg-primary text-primary-foreground" : "bg-muted"}`}
                        style={
                          i === j
                            ? { opacity: 0.45 + 0.55 * (v / max) }
                            : undefined
                        }
                      >
                        {v}
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="card-soft p-6">
          <p className="mb-4 font-display text-xl">Per-class F1</p>
          <div className="space-y-4">
            {m.f1s.map((f, i) => (
              <div key={i}>
                <div className="mb-1 flex justify-between text-sm">
                  <span>{CATEGORY_LABEL[CONF_LABELS[i]!]}</span>
                  <span>{f.toFixed(2)}</span>
                </div>
                <div className="h-2 rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-accent"
                    style={{ width: `${f * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          {/* <p className="mt-6 rounded-xl bg-muted p-3 text-xs text-muted-foreground">
            The model is a research aid, not a diagnostic. Human review remains essential.
          </p> */}
        </div>
      </div>
      <div className="card-soft overflow-x-auto p-6">
        <p className="mb-4 font-display text-xl">Per-class report</p>
        <table className="w-full text-sm">
          <thead className="bg-muted text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              {['Class', 'Precision', 'Recall', 'F1', 'Support'].map((h) => (
                <th key={h} className="px-4 py-3 font-semibold">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {perClass.map((c) => (
              <tr key={c.label}>
                <td className="px-4 py-3">{CATEGORY_LABEL[c.label as keyof typeof CATEGORY_LABEL]}</td>
                <td className="px-4 py-3">{c.precision.toFixed(2)}</td>
                <td className="px-4 py-3">{c.recall.toFixed(2)}</td>
                <td className="px-4 py-3">{c.f1.toFixed(2)}</td>
                <td className="px-4 py-3">{c.support}</td>
              </tr>
            ))}
            <tr className="bg-muted/40 font-semibold">
              <td className="px-4 py-3">Macro avg</td>
              <td className="px-4 py-3">{(perClass.reduce((a,c)=>a+c.precision,0)/perClass.length).toFixed(2)}</td>
              <td className="px-4 py-3">{(perClass.reduce((a,c)=>a+c.recall,0)/perClass.length).toFixed(2)}</td>
              <td className="px-4 py-3">{(perClass.reduce((a,c)=>a+c.f1,0)/perClass.length).toFixed(2)}</td>
              <td className="px-4 py-3">{totalSupport}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </>
  );
}