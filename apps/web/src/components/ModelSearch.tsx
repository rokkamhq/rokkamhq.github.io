"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { formatInr } from "@/lib/format";
import { t } from "@/lib/copy";
import type { SearchableModel } from "@/lib/catalog";

const CATEGORY_EMOJI: Record<string, string> = { phones: "📱", laptops: "💻" };
const MAX_RESULTS = 8;

export function ModelSearch({ models }: { models: SearchableModel[] }) {
  const [query, setQuery] = useState("");

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];
    const terms = q.split(/\s+/);
    return models
      .filter((m) => {
        const haystack = [`${m.brandName} ${m.name}`, ...m.aliases].join(" ").toLowerCase();
        return terms.every((term) => haystack.includes(term));
      })
      .sort((a, b) => b.launchYear - a.launchYear)
      .slice(0, MAX_RESULTS);
  }, [models, query]);

  return (
    <div className="relative max-w-xl">
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={t("sell.search.placeholder")}
        aria-label={t("sell.search.placeholder")}
        className="w-full rounded-2xl border-2 border-ink/10 bg-white px-5 py-4 text-ink shadow-sm outline-none transition focus:border-rokkam"
      />
      {query.trim().length >= 2 && (
        <div className="absolute inset-x-0 top-full z-20 mt-2 overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-ink/10">
          {results.length === 0 ? (
            <p className="px-5 py-4 text-sm text-slate">{t("sell.search.noResults")}</p>
          ) : (
            <ul>
              {results.map((m) => (
                <li key={`${m.category}/${m.slug}`}>
                  <Link
                    href={`/sell/${m.category}/${m.brandSlug}/${m.slug}`}
                    className="flex items-center justify-between gap-4 px-5 py-3.5 transition hover:bg-sand/50"
                  >
                    <span className="flex items-center gap-3">
                      <span aria-hidden>{CATEGORY_EMOJI[m.category]}</span>
                      <span className="text-sm font-medium text-ink">
                        {m.brandName} {m.name}
                      </span>
                    </span>
                    {m.maxPrice !== null && (
                      <span className="whitespace-nowrap text-xs text-rokkam-deep">
                        {t("sell.upto")}{" "}
                        <span className="font-mono font-bold">{formatInr(m.maxPrice)}</span>
                      </span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
