import Constants from 'expo-constants';
import { Platform } from 'react-native';

const configured = (Constants.expoConfig?.extra as any)?.apiBaseUrl as string | undefined;

export const API_BASE =
  configured || (Platform.OS === 'android' ? 'http://10.0.2.2:8000' : 'http://localhost:8000');

const TIMEOUT_MS = 15000;

async function request<T = any>(path: string, init?: RequestInit, timeoutMs = TIMEOUT_MS): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      ...init,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(init?.headers || {}),
      },
    });
    if (!res.ok) {
      let detail = `HTTP ${res.status}`;
      try {
        const body = await res.json();
        if (typeof body?.detail === 'string') detail = body.detail;
        else if (Array.isArray(body?.detail)) {
          detail = body.detail.map((d: any) => `${d.loc?.[d.loc.length - 1] ?? 'field'}: ${d.msg}`).join('; ');
        } else detail = JSON.stringify(body);
      } catch {}
      throw new Error(detail);
    }
    return res.json();
  } catch (e: any) {
    if (e?.name === 'AbortError') {
      throw new Error(`Request timed out. Check backend at ${API_BASE} and that the device is on the same network.`);
    }
    if (e instanceof TypeError) {
      throw new Error(`Cannot reach backend at ${API_BASE}. Ensure backend runs on 0.0.0.0:8000 and apiBaseUrl is your PC LAN IP.`);
    }
    throw e;
  } finally {
    clearTimeout(timer);
  }
}

export type BackendAnalysis = {
  prediction_label: string;
  prediction_score: number;
  confidence_breakdown: Record<string, number>;
  detected_markers: { term: string; category: string; meaning?: string; weight?: number }[];
  discourse_stance: string;
  cultural_context_notes: string;
};

export type NarrativeRecord = {
  narrative_id: string;
  narrative: string;
  language: string;
  sub_county: string;
  prediction_label: string;
  prediction_score: number;
  discourse_stance?: string;
  [k: string]: any;
};

export const api = {
  health: () => request<any>('/api/health', undefined, 8000),
  stats: () => request<any>('/api/stats'),
  narratives: () => request<NarrativeRecord[]>('/api/narratives'),
  submit: (body: any) => request<{ narrative_id: string; analysis: BackendAnalysis }>('/api/narratives/submit', {
    method: 'POST',
    body: JSON.stringify(body),
  }),
  // Translation can be slow on CPU (model load / inference)
  translate: (text: string) => request<any>('/api/translate', {
    method: 'POST',
    body: JSON.stringify({ text }),
  }, 180000),
  translateStatus: () => request<any>('/api/translate/status', undefined, 8000),
};
