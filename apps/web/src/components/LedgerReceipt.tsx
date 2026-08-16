"use client";

import { formatInr, formatSigned } from "@/lib/format";
import { t } from "@/lib/copy";
import type { QuoteResult } from "@/lib/types";

export function LedgerReceipt({
  deviceLabel,
  quote,
}: {
  deviceLabel: string;
  quote: QuoteResult;
}) {
  return (
    <div className="receipt-edge rounded-t-2xl bg-white p-6 shadow-lg ring-1 ring-ink/10">
      <p className="font-mono text-xs uppercase tracking-widest text-slate">
        {t("wizard.ledgerTitle")}
      </p>
      <ul className="mt-4 space-y-2.5 border-t border-dashed border-ink/15 pt-4">
        <li className="flex items-baseline justify-between gap-4">
          <span className="text-sm text-slate">
            {deviceLabel} — {t("wizard.base").toLowerCase()}
          </span>
          <span className="whitespace-nowrap font-mono text-sm font-medium text-ink">
            {formatInr(quote.basePriceInr)}
          </span>
        </li>
        {quote.ledger.map((line) => (
          <li
            key={`${line.questionId}:${line.optionId}`}
            className="flex animate-ledger-in items-baseline justify-between gap-4"
          >
            <span className="text-sm text-slate">{line.label}</span>
            <span
              className={`whitespace-nowrap font-mono text-sm font-medium ${
                line.amountInr < 0 ? "text-brick" : "text-rokkam"
              }`}
            >
              {formatSigned(line.amountInr)}
            </span>
          </li>
        ))}
      </ul>
      <div className="mt-4 flex items-baseline justify-between border-t border-ink/15 pt-4">
        <span className="text-sm font-semibold text-ink">You get</span>
        <span
          key={quote.finalPriceInr}
          className="animate-price-pop font-mono text-2xl font-bold text-rokkam"
        >
          {formatInr(quote.finalPriceInr)}
        </span>
      </div>
      {quote.flooredAt !== null && (
        <p className="mt-2 text-xs font-medium text-amber">{t("wizard.floor")}</p>
      )}
    </div>
  );
}
