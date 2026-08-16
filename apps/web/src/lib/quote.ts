import type { Answers, ComposedPriceEntry, DeductionMatrix, LedgerLine, QuoteResult } from "./types";

export const QUOTE_LOCK_DAYS = 7;

/** Scrap-value floor: max(base × 5%, ₹300) — CLAUDE.md §6. */
export function scrapFloor(baseInr: number): number {
  return Math.max(Math.round(baseInr * 0.05), 300);
}

function amountFor(baseInr: number, type: "flat" | "pct", value: number): number {
  // Sign convention: value > 0 is a deduction, value < 0 a bonus.
  const magnitude = type === "pct" ? Math.round((baseInr * Math.abs(value)) / 100) : Math.abs(value);
  return value > 0 ? -magnitude : magnitude;
}

/**
 * Pure quote computation: base − Σ deductions + Σ bonuses, floored at scrap value.
 * TS mirror of the future packages/pricing engine; keep behaviour in sync.
 */
export function computeQuote(matrix: DeductionMatrix, baseInr: number, answers: Answers): QuoteResult {
  const ledger: LedgerLine[] = [];

  for (const section of matrix.sections) {
    for (const q of section.questions) {
      const answer = answers[q.id];
      if (answer === undefined) continue;
      const chosen = Array.isArray(answer) ? answer : [answer];
      for (const optionId of chosen) {
        const opt = q.options.find((o) => o.id === optionId);
        if (!opt) continue;
        if (opt.kills_deal) {
          return { status: "declined", basePriceInr: baseInr, ledger: [], finalPriceInr: 0, flooredAt: null };
        }
        if (opt.deduction) {
          ledger.push({
            questionId: q.id,
            optionId: opt.id,
            label: opt.label_en,
            amountInr: amountFor(baseInr, opt.deduction.type, opt.deduction.value),
          });
        }
      }
    }
  }

  const raw = baseInr + ledger.reduce((sum, line) => sum + line.amountInr, 0);
  const floor = scrapFloor(baseInr);
  const floored = raw < floor;
  return {
    status: "ok",
    basePriceInr: baseInr,
    ledger,
    finalPriceInr: floored ? floor : raw,
    flooredAt: floored ? floor : null,
  };
}

/**
 * Effective base for a composed-mode device (laptops): base_config buyback
 * plus the INR modifier of each selected axis label.
 */
export function composedBase(entry: ComposedPriceEntry, selection: Record<string, string>): number {
  let total = entry.base;
  for (const [axis, options] of Object.entries(entry.axes)) {
    const chosen = selection[axis];
    if (chosen !== undefined && options[chosen] !== undefined) total += options[chosen];
  }
  return total;
}

/** Demo quote code, e.g. RKM-7F3KQ2 (server issues real codes in Phase 2). */
export function demoQuoteCode(): string {
  const alphabet = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
  let code = "";
  for (let i = 0; i < 6; i++) code += alphabet[Math.floor(Math.random() * alphabet.length)];
  return `RKM-${code}`;
}
