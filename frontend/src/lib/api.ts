export const API_BASE =
  process.env["NEXT_PUBLIC_API_URL"]?.replace(/\/$/, "") || "http://localhost:8000";

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
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
          .map((d: unknown) => {
            const obj = d as Record<string, unknown>;
            const loc = obj["loc"] as unknown[] | undefined;
            return `${loc?.[loc.length - 1] ?? "field"}: ${obj["msg"]}`;
          })
          .join("; ");
      else detail = JSON.stringify(body);
    } catch {
      // ignore parse errors
    }
    throw new Error(detail);
  }
  return res.json();
}

export interface BackendAnalysis {
  prediction_label: string;
  prediction_score: number;
  confidence_breakdown: Record<string, number>;
  detected_markers: {
    term: string;
    category: string;
    meaning?: string;
    weight?: number;
    start_pos?: number;
  }[];
  discourse_stance: string;
  cultural_context_notes: string;
}

export interface BackendSubmitResponse {
  message: string;
  narrative_id: string;
  analysis: BackendAnalysis;
}

export interface HealthResponse {
  status: string;
  version: string;
  timestamp: string;
}

export interface NarrativeItem {
  id: string;
  text: string;
  language: string;
  category: string;
  sub_county: string;
  age_band: string;
  gender: string;
  source_org: string;
  timestamp: string;
  consent_given: boolean;
  confidence?: number;
  narrative_id?: string;
  narrative?: string;
  label?: string;
  prediction_label?: string;
  prediction_score?: number;
  date_collected?: string;
  discourse_stance?: string;
  cultural_context_notes?: string;
  detected_markers?: {
    term: string;
    category: string;
    meaning?: string;
    weight?: number;
    start_pos?: number;
  }[];
}

export interface StatsResponse {
  total_narratives: number;
  by_language: Record<string, number>;
  by_category: Record<string, number>;
  by_sub_county: Record<string, number>;
  by_stance: Record<string, number>;
}

export interface EthicsLedgerResponse {
  id: string;
  narrative_id: string;
  consent_given: boolean;
  consent_hash: string;
  timestamp: string;
  withdrawn: boolean;
  pseudonymised_token?: string;
  cryptographic_hash?: string;
  consent_timestamp?: string;
  custodian_cbo?: string;
}

export interface TranslateStatusResponse {
  available: boolean;
  model?: string;
  adapter?: string;
}

export interface TranslateResponse {
  out?: string;
  translated_text?: string;
  translation?: string;
  source_language?: string;
  target_language?: string;
  src_lang_code?: string;
  tgt_lang_code?: string;
  model?: string;
  adapter?: string | null;
  license?: string;
  review_recommended?: boolean;
}

export const api = {
  health: () => apiFetch<HealthResponse>("/api/health"),
  submit: (body: Record<string, unknown>) =>
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
    return apiFetch<NarrativeItem[]>(`/api/narratives${qs}`);
  },
  stats: () => apiFetch<StatsResponse>("/api/stats"),
  exportUrl: (format: "json" | "csv") => `${API_BASE}/api/export?format=${format}`,
  ethicsLedger: () => apiFetch<EthicsLedgerResponse[]>("/api/ethics/audit-ledger"),
  withdrawConsent: (id: string) =>
    apiFetch<{ status: string }>(`/api/ethics/withdraw-consent/${id}`, { method: "POST" }),
  translate: (text: string, target_language: string = "maa") =>
    apiFetch<TranslateResponse>("/api/translate", {
      method: "POST",
      body: JSON.stringify({ text, target_language }),
    }),
  translateStatus: () => apiFetch<TranslateStatusResponse>("/api/translate/status"),
};
