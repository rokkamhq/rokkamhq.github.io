"use client";

export const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000").replace(/\/$/, "");

export function getToken(): string {
  return typeof window === "undefined" ? "" : (localStorage.getItem("rokkam_admin_token") ?? "");
}

export function setSession(token: string, role: string, name: string) {
  localStorage.setItem("rokkam_admin_token", token);
  localStorage.setItem("rokkam_admin_role", role);
  localStorage.setItem("rokkam_admin_name", name);
}

export function clearSession() {
  localStorage.removeItem("rokkam_admin_token");
  localStorage.removeItem("rokkam_admin_role");
  localStorage.removeItem("rokkam_admin_name");
}

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
      ...options.headers,
    },
  });
  if (res.status === 401) {
    clearSession();
    if (typeof window !== "undefined") window.location.href = "/";
    throw new Error("Session expired");
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail ?? `Request failed (${res.status})`);
  }
  return res.json();
}

export interface PriceRow {
  variant_id: number;
  category: string;
  brand: string;
  model: string;
  model_slug: string;
  label: string;
  price_inr: number | null;
  effective_from: string | null;
  set_by: string | null;
  stale: boolean;
}

export interface OrderRow {
  order_id: number;
  status: string;
  zone: string;
  quote_code: string;
  device: string;
  amount_inr: number;
  slot_start: string;
  slot_end: string;
  created_at: string;
}

export interface RuleQuestion {
  question_id: number;
  qkey: string;
  section: string;
  text: string;
  type: string;
  options: {
    option_id: number;
    okey: string;
    label: string;
    deduction_type: string | null;
    deduction_value: number | null;
    kills_deal: boolean;
  }[];
}

export interface AuditRow {
  id: number;
  actor: string;
  action: string;
  entity: string;
  before: unknown;
  after: unknown;
  ts: string;
}

export const ORDER_NEXT: Record<string, string[]> = {
  booked: ["assigned", "cancelled"],
  assigned: ["enroute", "cancelled"],
  enroute: ["verifying", "failed"],
  verifying: ["deviation_pending", "completed", "failed"],
  deviation_pending: ["completed", "failed"],
  completed: [],
  cancelled: [],
  failed: [],
};
