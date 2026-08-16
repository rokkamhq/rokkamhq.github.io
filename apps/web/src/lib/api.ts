// Thin client for the Rokkam API (services/api). When NEXT_PUBLIC_API_URL is
// unset (e.g. the static GitHub Pages deploy before the VPS exists) the site
// falls back to demo quotes + WhatsApp booking.

export const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/$/, "");
export const apiEnabled = API_URL !== "";

async function call<T>(path: string, options: RequestInit = {}, token?: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(res.status, body.detail ?? "Something went wrong");
  }
  return res.json();
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export interface ServerQuote {
  status: "locked" | "declined";
  public_code: string;
  base_price_inr: number;
  final_price_inr: number;
  floored_at: number | null;
  ledger: { question: string; option: string; label: string; amount_inr: number }[];
  locked_until: string;
}

export interface QuotePayload {
  category: "phones" | "laptops";
  model_slug: string;
  variant_label?: string;
  axis_selection?: Record<string, string>;
  answers: Record<string, string | string[]>;
}

export const createQuote = (payload: QuotePayload) =>
  call<ServerQuote>("/quotes", { method: "POST", body: JSON.stringify(payload) });

export const requestOtp = (phone: string) =>
  call<{ sent: boolean; dev_code?: string }>("/auth/otp/request", {
    method: "POST",
    body: JSON.stringify({ phone }),
  });

export const verifyOtp = (phone: string, code: string) =>
  call<{ token: string }>("/auth/otp/verify", { method: "POST", body: JSON.stringify({ phone, code }) });

export interface SlotsResponse {
  serviceable: boolean;
  zone?: string;
  zone_name?: string;
  sla_label?: string;
  slots?: { start: string; end: string }[];
}

export const getSlots = (pincode: string) => call<SlotsResponse>(`/slots?pincode=${pincode}`);

export interface BookingResult {
  order_id: number;
  status: string;
  zone: string;
  sla_label: string;
  slot_start: string;
  slot_end: string;
  amount_inr: number;
}

export const bookOrder = (
  payload: { quote_code: string; line1: string; line2?: string; pincode: string; slot_start: string; slot_end: string },
  token: string,
) => call<BookingResult>("/orders", { method: "POST", body: JSON.stringify(payload) }, token);
