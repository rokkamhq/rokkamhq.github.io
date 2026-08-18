"use client";

import { useState } from "react";
import { ApiError, bookOrder, getSlots, requestOtp, verifyOtp, type SlotsResponse } from "@/lib/api";
import { formatInr } from "@/lib/format";
import { t } from "@/lib/copy";

type Step = "phone" | "otp" | "address" | "slot" | "done";

const IST_FMT = new Intl.DateTimeFormat("en-IN", {
  weekday: "short",
  day: "numeric",
  month: "short",
  hour: "numeric",
  minute: "2-digit",
  timeZone: "Asia/Kolkata",
});
const TIME_FMT = new Intl.DateTimeFormat("en-IN", {
  hour: "numeric",
  minute: "2-digit",
  timeZone: "Asia/Kolkata",
});

export function BookingFlow({ quoteCode, amountInr }: { quoteCode: string; amountInr: number }) {
  const [step, setStep] = useState<Step>("phone");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [phone, setPhone] = useState("");
  const [devCode, setDevCode] = useState("");
  const [code, setCode] = useState("");
  const [token, setToken] = useState("");
  const [line1, setLine1] = useState("");
  const [line2, setLine2] = useState("");
  const [pincode, setPincode] = useState("");
  const [slotsInfo, setSlotsInfo] = useState<SlotsResponse | null>(null);
  const [confirmation, setConfirmation] = useState<{ orderId: number; slot: string; sla: string } | null>(null);

  async function run(action: () => Promise<void>) {
    setBusy(true);
    setError("");
    try {
      await action();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Network error — is the API running?");
    } finally {
      setBusy(false);
    }
  }

  const inputCls =
    "w-full rounded-xl border-2 border-ink/10 bg-paper px-4 py-3 text-ink outline-none focus:border-rokkam";
  const buttonCls =
    "rounded-full bg-rokkam px-7 py-3 text-sm font-semibold text-white transition enabled:hover:bg-rokkam-deep disabled:opacity-40";

  if (step === "done" && confirmation) {
    return (
      <div className="animate-fade-up rounded-2xl bg-rokkam/10 p-6 ring-1 ring-rokkam/30">
        <h2 className="font-display text-xl font-bold text-rokkam-deep">{t("booking.done.title")}</h2>
        <p className="mt-2 text-sm text-slate">
          {t("booking.done.body")} <span className="font-mono font-bold text-ink">#{confirmation.orderId}</span>
        </p>
        <p className="mt-1 text-sm font-medium text-ink">
          {confirmation.slot} · {confirmation.sla}
        </p>
        <p className="mt-3 text-sm text-slate">
          {t("booking.done.amount")}{" "}
          <span className="font-mono font-bold text-rokkam-deep">{formatInr(amountInr)}</span>
        </p>
        <div className="mt-5 border-t border-rokkam/20 pt-4">
          <p className="font-mono text-xs font-bold uppercase tracking-widest text-slate">
            {t("booking.next.title")}
          </p>
          <ol className="mt-3 space-y-2.5">
            {([1, 2, 3, 4] as const).map((n) => (
              <li key={n} className="flex gap-3 text-sm leading-relaxed text-slate">
                <span
                  aria-hidden
                  className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-rokkam/15 font-mono text-[10px] font-bold text-rokkam-deep"
                >
                  {n}
                </span>
                {t(`booking.next.${n}`)}
              </li>
            ))}
          </ol>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-ink/5">
      <h2 className="font-semibold text-ink">{t("booking.title")}</h2>

      {step === "phone" && (
        <div className="mt-3 space-y-3">
          <label className="block text-sm text-slate" htmlFor="bk-phone">
            {t("booking.phone.label")}
          </label>
          <input
            id="bk-phone"
            inputMode="numeric"
            maxLength={10}
            placeholder="98765 43210"
            className={inputCls}
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
          />
          <button
            className={buttonCls}
            disabled={busy || phone.length !== 10}
            onClick={() =>
              run(async () => {
                const r = await requestOtp(phone);
                setDevCode(r.dev_code ?? "");
                setStep("otp");
              })
            }
          >
            {t("booking.phone.cta")}
          </button>
        </div>
      )}

      {step === "otp" && (
        <div className="mt-3 space-y-3">
          <label className="block text-sm text-slate" htmlFor="bk-otp">
            {t("booking.otp.label")} {phone}
          </label>
          {devCode && (
            <p className="rounded-lg bg-amber/15 px-3 py-2 font-mono text-xs text-slate">
              dev mode — code: {devCode}
            </p>
          )}
          <input
            id="bk-otp"
            inputMode="numeric"
            maxLength={6}
            placeholder="••••••"
            className={`${inputCls} font-mono tracking-[0.5em]`}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
          />
          <button
            className={buttonCls}
            disabled={busy || code.length !== 6}
            onClick={() =>
              run(async () => {
                const r = await verifyOtp(phone, code);
                setToken(r.token);
                setStep("address");
              })
            }
          >
            {t("booking.otp.cta")}
          </button>
        </div>
      )}

      {step === "address" && (
        <div className="mt-3 space-y-3">
          <input placeholder={t("booking.address.line1")} className={inputCls} value={line1} onChange={(e) => setLine1(e.target.value)} />
          <input placeholder={t("booking.address.line2")} className={inputCls} value={line2} onChange={(e) => setLine2(e.target.value)} />
          <input
            placeholder={t("result.pincode.label")}
            inputMode="numeric"
            maxLength={6}
            className={`${inputCls} w-40 font-mono`}
            value={pincode}
            onChange={(e) => setPincode(e.target.value.replace(/\D/g, ""))}
          />
          <button
            className={buttonCls}
            disabled={busy || !line1.trim() || pincode.length !== 6}
            onClick={() =>
              run(async () => {
                const info = await getSlots(pincode);
                if (!info.serviceable) {
                  setError(t("zones.outside"));
                  return;
                }
                setSlotsInfo(info);
                setStep("slot");
              })
            }
          >
            {t("booking.address.cta")}
          </button>
        </div>
      )}

      {step === "slot" && slotsInfo?.slots && (
        <div className="mt-3 space-y-3">
          <p className="text-sm font-medium text-rokkam-deep">
            ✅ {slotsInfo.zone_name} — {slotsInfo.sla_label}
          </p>
          <div className="grid gap-2.5">
            {slotsInfo.slots.map((slot) => (
              <button
                key={slot.start}
                disabled={busy}
                onClick={() =>
                  run(async () => {
                    const booking = await bookOrder(
                      { quote_code: quoteCode, line1, line2, pincode, slot_start: slot.start, slot_end: slot.end },
                      token,
                    );
                    setConfirmation({
                      orderId: booking.order_id,
                      slot: `${IST_FMT.format(new Date(booking.slot_start))} – ${TIME_FMT.format(new Date(booking.slot_end))}`,
                      sla: booking.sla_label,
                    });
                    setStep("done");
                  })
                }
                className="rounded-xl border-2 border-ink/10 bg-white px-4 py-3 text-left text-sm font-medium text-ink transition hover:border-rokkam"
              >
                {IST_FMT.format(new Date(slot.start))} – {TIME_FMT.format(new Date(slot.end))}
              </button>
            ))}
          </div>
        </div>
      )}

      {error && <p className="mt-3 rounded-lg bg-brick/10 px-3 py-2 text-sm font-medium text-brick">{error}</p>}
    </div>
  );
}
