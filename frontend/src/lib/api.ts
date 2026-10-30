export const API_BASE =
  process.env["NEXT_PUBLIC_API_URL"]?.replace(/\/$/, "") || "http://localhost:8000";

export async function apiFetch<T = any>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });
  if (!res.ok) {
    let detail = `HTTP ${res.status}`;
    try {
      const body = await res.json();
      if (typeof body?.detail === "string") detail = body.detail;
      else if (Array.isArray(body?.detail))
        detail = body.detail
          .map((d: any) => `${d.loc?.[d.loc.length - 1] ?? "field"}: ${d.msg}`)
          .join("; ");
      else detail = JSON.stringify(body);
    } catch {}
    throw new Error(detail);
  }
  return res.json();
}

export type BackendAnalysis = {
  prediction_label: string;
  prediction_score: number;
  confidence_breakdown: Record<string, number>;
  detected_markers: { term: string; category: string; meaning?: string; weight?: number; start_pos?: number }[];
  discourse_stance: string;
  cultural_context_notes: string;
};

export type BackendSubmitResponse = {
  message: string;
  narrative_id: string;
  analysis: BackendAnalysis;
};

export const api = {
  health: () => apiFetch<any>("/api/health"),
  submit: (body: any) =>
    apiFetch<BackendSubmitResponse>("/api/narratives/submit", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  narratives: (params?: Record<string, string>) => {
    const qs = params
      ? "?" +
        new URLSearchParams(
          Object.entries(params).filter(([, v]) => v !== undefined && v !== ""),
        ).toString()
      : "";
    return apiFetch<any[]>(`/api/narratives${qs}`);
  },
  stats: () => apiFetch<any>("/api/stats"),
  exportUrl: (format: "json" | "csv") => `${API_BASE}/api/export?format=${format}`,
  ethicsLedger: () => apiFetch<any>("/api/ethics/audit-ledger"),
  withdrawConsent: (id: string) =>
    apiFetch<any>(`/api/ethics/withdraw-consent/${id}`, { method: "POST" }),
  translate: (text: string) =>
    apiFetch<any>("/api/translate", {
      method: "POST",
      body: JSON.stringify({ text }),
    }),
  translateStatus: () => apiFetch<any>("/api/translate/status"),
};
