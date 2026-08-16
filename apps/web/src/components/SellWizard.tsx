"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { composedBase, computeQuote, demoQuoteCode, QUOTE_LOCK_DAYS } from "@/lib/quote";
import { zoneForPincode, type ZoneMatch } from "@/lib/zones";
import { whatsappLink } from "@/lib/site";
import { formatInr } from "@/lib/format";
import { t } from "@/lib/copy";
import { LedgerReceipt } from "./LedgerReceipt";
import type { Answers, ComposedPriceEntry, DeductionMatrix, QuoteResult, SeedModel } from "@/lib/types";

type Phase = "variant" | "config" | "questions" | "result";

const AXIS_LABELS: Record<string, string> = {
  cpu: "Processor",
  ram_gb: "RAM",
  storage: "Storage",
  gpu: "Graphics",
};

function axisOptionLabel(axis: string, label: string): string {
  return axis === "ram_gb" ? `${label} GB` : label;
}

export function SellWizard({
  category,
  brandName,
  model,
  fixedPrices,
  composedEntry,
  matrix,
}: {
  category: "phones" | "laptops";
  brandName: string;
  model: SeedModel;
  fixedPrices?: Record<string, number>;
  composedEntry?: ComposedPriceEntry;
  matrix: DeductionMatrix;
}) {
  // Fixed mode (phones): variant labels that carry a demo price.
  const variantLabels = (model.variants ?? [])
    .map((v) => v.label)
    .filter((label) => fixedPrices?.[label] !== undefined);

  // Composed mode (laptops): axes in seed order, options limited to priced labels.
  const axes = useMemo(() => {
    if (!composedEntry || !model.variant_axes) return [];
    return Object.entries(model.variant_axes)
      .map(([axis, options]) => ({
        axis,
        labels: options.map((o) => o.label).filter((l) => composedEntry.axes[axis]?.[l] !== undefined),
      }))
      .filter((a) => a.labels.length > 0);
  }, [composedEntry, model.variant_axes]);

  const [variantLabel, setVariantLabel] = useState<string | null>(
    variantLabels.length === 1 ? variantLabels[0] : null,
  );
  // Default selection = the base config (modifier 0 per axis).
  const [axisSelection, setAxisSelection] = useState<Record<string, string>>(() => {
    const selection: Record<string, string> = {};
    for (const { axis, labels } of axes) {
      selection[axis] =
        labels.find((l) => composedEntry?.axes[axis]?.[l] === 0) ?? labels[0];
    }
    return selection;
  });
  const [phase, setPhase] = useState<Phase>(() => {
    if (composedEntry) return axes.length > 0 ? "config" : "questions";
    return variantLabels.length === 1 ? "questions" : "variant";
  });
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [ledgerOpen, setLedgerOpen] = useState(false);

  const basePrice = composedEntry
    ? composedBase(composedEntry, axisSelection)
    : variantLabel !== null
      ? (fixedPrices?.[variantLabel] ?? null)
      : null;
  const quote = useMemo(
    () => (basePrice !== null ? computeQuote(matrix, basePrice, answers) : null),
    [matrix, basePrice, answers],
  );

  const configSummary = composedEntry
    ? axes.map(({ axis }) => axisOptionLabel(axis, axisSelection[axis])).join(" · ")
    : variantLabel;
  const deviceLabel = `${brandName} ${model.name}${configSummary ? ` · ${configSummary}` : ""}`;

  const sections = matrix.sections;
  const section = sections[stepIndex];
  const sectionComplete =
    section?.questions.every((q) => q.type === "multi" || answers[q.id] !== undefined) ?? false;

  function answerSingle(questionId: string, optionId: string) {
    setAnswers((prev) => ({ ...prev, [questionId]: optionId }));
  }

  function toggleMulti(questionId: string, optionId: string) {
    setAnswers((prev) => {
      const current = Array.isArray(prev[questionId]) ? (prev[questionId] as string[]) : [];
      const next = current.includes(optionId)
        ? current.filter((id) => id !== optionId)
        : [...current, optionId];
      return { ...prev, [questionId]: next };
    });
  }

  function goNext() {
    if (stepIndex < sections.length - 1) {
      setStepIndex(stepIndex + 1);
      window.scrollTo({ top: 0 });
    } else {
      setPhase("result");
      window.scrollTo({ top: 0 });
    }
  }

  function goBack() {
    if (stepIndex > 0) {
      setStepIndex(stepIndex - 1);
    } else if (composedEntry && axes.length > 0) {
      setPhase("config");
    } else if (variantLabels.length > 1) {
      setPhase("variant");
    }
    window.scrollTo({ top: 0 });
  }

  function restart() {
    setAnswers({});
    setStepIndex(0);
    if (composedEntry) setPhase(axes.length > 0 ? "config" : "questions");
    else setPhase(variantLabels.length === 1 ? "questions" : "variant");
    window.scrollTo({ top: 0 });
  }

  if (quote?.status === "declined") {
    return <DeclinedScreen />;
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <nav className="text-sm text-slate">
        <Link href="/sell" className="hover:text-ink">
          {t("nav.sell")}
        </Link>{" "}
        / <span className="text-ink">{deviceLabel}</span>
      </nav>

      {phase === "variant" && (
        <div className="mt-8 max-w-xl animate-fade-up">
          <h1 className="font-display text-3xl font-bold tracking-tight text-ink">
            {t("sell.pickVariant")}
          </h1>
          <p className="mt-1 text-sm text-slate">{t("sell.variantHint")}</p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {variantLabels.map((label) => (
              <button
                key={label}
                onClick={() => {
                  setVariantLabel(label);
                  setPhase("questions");
                  setStepIndex(0);
                }}
                className="rounded-2xl bg-white p-5 text-left shadow-sm ring-1 ring-ink/10 transition hover:-translate-y-0.5 hover:ring-rokkam"
              >
                <span className="block font-semibold text-ink">{label}</span>
                <span className="mt-1 block text-sm text-rokkam-deep">
                  {t("sell.upto")}{" "}
                  <span className="font-mono font-bold">{formatInr(fixedPrices?.[label] ?? 0)}</span>
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {phase === "config" && composedEntry && (
        <div className="mt-8 max-w-2xl animate-fade-up">
          <h1 className="font-display text-3xl font-bold tracking-tight text-ink">
            {t("sell.pickConfig")}
          </h1>
          <p className="mt-1 text-sm text-slate">{t("sell.configHint")}</p>
          {model.base_config && (
            <p className="mt-3 rounded-lg bg-sand/60 px-4 py-2.5 text-xs font-medium text-slate">
              Base model: {model.base_config.description}
            </p>
          )}
          <div className="mt-6 space-y-6">
            {axes.map(({ axis, labels }) => (
              <fieldset key={axis}>
                <legend className="font-semibold text-ink">{AXIS_LABELS[axis] ?? axis}</legend>
                <div className="mt-2.5 flex flex-wrap gap-2.5">
                  {labels.map((label) => {
                    const isSelected = axisSelection[axis] === label;
                    return (
                      <button
                        key={label}
                        type="button"
                        aria-pressed={isSelected}
                        onClick={() => setAxisSelection((prev) => ({ ...prev, [axis]: label }))}
                        className={`rounded-xl border-2 px-4 py-2.5 text-sm font-medium transition ${
                          isSelected
                            ? "border-rokkam bg-rokkam/5 text-ink"
                            : "border-ink/10 bg-white text-slate hover:border-ink/30"
                        }`}
                      >
                        {axisOptionLabel(axis, label)}
                      </button>
                    );
                  })}
                </div>
              </fieldset>
            ))}
          </div>
          <div className="mt-8 flex items-center gap-5">
            <button
              onClick={() => {
                setPhase("questions");
                setStepIndex(0);
              }}
              className="rounded-full bg-rokkam px-8 py-3 text-sm font-semibold text-white transition hover:bg-rokkam-deep"
            >
              {t("wizard.next")}
            </button>
            {basePrice !== null && (
              <span className="text-sm text-slate">
                {t("sell.upto")}{" "}
                <span className="font-mono font-bold text-rokkam-deep">{formatInr(basePrice)}</span>
              </span>
            )}
          </div>
        </div>
      )}

      {phase === "questions" && quote && section && (
        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
          <div>
            <p className="font-mono text-xs font-bold uppercase tracking-widest text-slate">
              {t("wizard.progress")} {stepIndex + 1} / {sections.length}
            </p>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-ink/10">
              <div
                className="h-full rounded-full bg-rokkam transition-all duration-500"
                style={{ width: `${((stepIndex + 1) / sections.length) * 100}%` }}
              />
            </div>
            <h1 className="mt-6 font-display text-3xl font-bold tracking-tight text-ink">
              {section.title_en}
            </h1>

            <div className="mt-6 space-y-8" key={section.id}>
              {section.questions.map((q) => {
                const selected = answers[q.id];
                return (
                  <fieldset key={q.id} className="animate-fade-up">
                    <legend className="font-semibold text-ink">{q.text_en}</legend>
                    <div className="mt-3 grid gap-2.5">
                      {q.options.map((opt) => {
                        const isSelected =
                          q.type === "multi"
                            ? Array.isArray(selected) && selected.includes(opt.id)
                            : selected === opt.id;
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() =>
                              q.type === "multi"
                                ? toggleMulti(q.id, opt.id)
                                : answerSingle(q.id, opt.id)
                            }
                            aria-pressed={isSelected}
                            className={`flex items-center justify-between gap-3 rounded-xl border-2 px-4 py-3.5 text-left text-sm font-medium transition ${
                              isSelected
                                ? "border-rokkam bg-rokkam/5 text-ink"
                                : "border-ink/10 bg-white text-slate hover:border-ink/30"
                            }`}
                          >
                            <span>
                              {opt.label_en}
                              {opt.note_en && (
                                <span className="mt-0.5 block text-xs font-normal text-slate/80">
                                  {opt.note_en}
                                </span>
                              )}
                            </span>
                            <span
                              aria-hidden
                              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 text-[10px] font-bold text-white ${
                                isSelected ? "border-rokkam bg-rokkam" : "border-ink/20"
                              }`}
                            >
                              {isSelected ? "✓" : ""}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </fieldset>
                );
              })}
            </div>

            <div className="mt-8 flex items-center gap-3 pb-24 lg:pb-0">
              {(stepIndex > 0 || variantLabels.length > 1 || axes.length > 0) && (
                <button
                  onClick={goBack}
                  className="rounded-full border border-ink/15 px-6 py-3 text-sm font-semibold text-ink transition hover:border-ink/40"
                >
                  {t("wizard.back")}
                </button>
              )}
              <button
                onClick={goNext}
                disabled={!sectionComplete}
                className="rounded-full bg-rokkam px-8 py-3 text-sm font-semibold text-white transition enabled:hover:bg-rokkam-deep disabled:cursor-not-allowed disabled:opacity-40"
              >
                {stepIndex === sections.length - 1 ? t("wizard.seePrice") : t("wizard.next")}
              </button>
            </div>
          </div>

          {/* Desktop ledger */}
          <aside className="hidden lg:block">
            <div className="sticky top-24">
              <LedgerReceipt deviceLabel={deviceLabel} quote={quote} />
            </div>
          </aside>

          {/* Mobile ledger bar + sheet */}
          <div className="fixed inset-x-0 bottom-0 z-30 lg:hidden">
            {ledgerOpen && (
              <div className="mx-4 mb-2 max-h-[60vh] overflow-y-auto">
                <LedgerReceipt deviceLabel={deviceLabel} quote={quote} />
              </div>
            )}
            <button
              onClick={() => setLedgerOpen(!ledgerOpen)}
              className="flex w-full items-center justify-between bg-ink px-6 py-4 text-paper"
              aria-expanded={ledgerOpen}
            >
              <span className="text-sm font-medium">You get</span>
              <span className="flex items-center gap-2">
                <span
                  key={quote.finalPriceInr}
                  className="animate-price-pop font-mono text-xl font-bold text-white"
                >
                  {formatInr(quote.finalPriceInr)}
                </span>
                <span aria-hidden className="text-sand/70">
                  {ledgerOpen ? "▾" : "▴"}
                </span>
              </span>
            </button>
          </div>
        </div>
      )}

      {phase === "result" && quote && (
        <ResultScreen deviceLabel={deviceLabel} quote={quote} onRestart={restart} />
      )}
    </div>
  );
}

function ResultScreen({
  deviceLabel,
  quote,
  onRestart,
}: {
  deviceLabel: string;
  quote: QuoteResult;
  onRestart: () => void;
}) {
  const [quoteCode] = useState(demoQuoteCode);
  const [pincode, setPincode] = useState("");
  const [zoneMatch, setZoneMatch] = useState<ZoneMatch | null>(null);
  const lockUntil = new Date(Date.now() + QUOTE_LOCK_DAYS * 86400_000).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
  });
  const waLink = whatsappLink(
    `Hi Rokkam! Quote ${quoteCode}: ${deviceLabel} for ${formatInr(quote.finalPriceInr)}. I'd like to book a pickup.`,
  );

  return (
    <div className="mt-8 grid animate-fade-up gap-8 lg:grid-cols-[1fr_360px]">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight text-ink">
          {t("result.title")}
        </h1>
        <div className="mt-6 rounded-3xl bg-ink p-8 text-paper">
          <p className="text-sm text-sand/80">{deviceLabel}</p>
          <p className="mt-2 animate-price-pop font-mono text-5xl font-bold text-white">
            {formatInr(quote.finalPriceInr)}
          </p>
          <p className="mt-3 text-sm text-sand/80">🔒 {t("result.lockNote")}</p>
          <p className="mt-4 border-t border-paper/10 pt-4 text-sm text-sand/80">
            {t("result.quoteCode")}:{" "}
            <span className="font-mono font-bold text-white">{quoteCode}</span>
            <span className="text-sand/60"> · valid till {lockUntil}</span>
          </p>
        </div>

        <div className="mt-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-ink/5">
          <label htmlFor="pincode" className="block font-semibold text-ink">
            {t("result.pincode.label")}
          </label>
          <div className="mt-3 flex gap-3">
            <input
              id="pincode"
              inputMode="numeric"
              maxLength={6}
              value={pincode}
              onChange={(e) => {
                setPincode(e.target.value.replace(/\D/g, ""));
                setZoneMatch(null);
              }}
              placeholder="500081"
              className="w-36 rounded-xl border-2 border-ink/10 bg-paper px-4 py-3 font-mono text-lg text-ink outline-none focus:border-rokkam"
            />
            <button
              onClick={() => setZoneMatch(zoneForPincode(pincode))}
              disabled={pincode.length !== 6}
              className="rounded-xl bg-slate px-5 py-3 text-sm font-semibold text-white transition enabled:hover:bg-ink disabled:opacity-40"
            >
              {t("result.pincode.cta")}
            </button>
          </div>
          {zoneMatch &&
            (zoneMatch.serviceable ? (
              <p className="mt-3 animate-ledger-in rounded-lg bg-rokkam/10 px-4 py-3 text-sm font-medium text-rokkam-deep">
                ✅ {zoneMatch.zone.name} — {zoneMatch.zone.sla_label}
              </p>
            ) : (
              <p className="mt-3 animate-ledger-in rounded-lg bg-amber/15 px-4 py-3 text-sm font-medium text-slate">
                {t("zones.outside")}
              </p>
            ))}
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          {waLink ? (
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full bg-rokkam px-8 py-4 text-base font-semibold text-white transition hover:bg-rokkam-deep"
            >
              {t("result.book.wa")}
            </a>
          ) : (
            <p className="rounded-xl bg-sand px-5 py-3 text-sm font-medium text-slate">
              {t("result.book.soon")}
            </p>
          )}
          <button
            onClick={onRestart}
            className="text-sm font-semibold text-slate underline-offset-4 hover:underline"
          >
            {t("result.restart")}
          </button>
        </div>
      </div>

      <aside>
        <LedgerReceipt deviceLabel={deviceLabel} quote={quote} />
      </aside>
    </div>
  );
}

function DeclinedScreen() {
  return (
    <div className="mx-auto max-w-xl animate-fade-up px-4 py-24 text-center sm:px-6">
      <div className="text-5xl" aria-hidden>
        🙏
      </div>
      <h1 className="mt-4 font-display text-3xl font-bold tracking-tight text-ink">
        {t("decline.title")}
      </h1>
      <p className="mt-3 leading-relaxed text-slate">{t("decline.body")}</p>
      <Link
        href="/sell"
        className="mt-8 inline-block rounded-full bg-rokkam px-8 py-4 text-base font-semibold text-white transition hover:bg-rokkam-deep"
      >
        {t("decline.back")}
      </Link>
    </div>
  );
}
