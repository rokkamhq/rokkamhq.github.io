import Link from "next/link";
import type { Metadata } from "next";
import { listCategories, listSellableModels } from "@/lib/catalog";
import { t } from "@/lib/copy";

export const metadata: Metadata = { title: "Sell your device" };

export default function SellPage() {
  const categories = listCategories();
  return (
    <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
      <p className="text-sm font-semibold uppercase tracking-widest text-rokkam">
        {t("sell.pickCategory")}
      </p>
      <h1 className="mt-2 font-display text-4xl font-bold tracking-tight text-ink">
        {t("sell.title")}
      </h1>
      <p className="mt-2 text-slate">{t("sell.sub")}</p>
      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((category) => {
          const modelCount = category.seeds.reduce(
            (n, b) => n + listSellableModels(category.slug, b.brand.slug).length,
            0,
          );
          return (
            <Link
              key={category.slug}
              href={`/sell/${category.slug}`}
              className="group rounded-3xl bg-white p-8 shadow-sm ring-1 ring-ink/5 transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <span className="text-4xl" aria-hidden>
                {category.emoji}
              </span>
              <span className="mt-4 block font-display text-2xl font-bold text-ink">
                {category.label}
              </span>
              <span className="mt-1 block text-sm text-slate">
                {category.seeds.length} brands · {modelCount} models
              </span>
              <span className="mt-4 inline-block rounded-full bg-rokkam/10 px-4 py-1.5 text-sm font-semibold text-rokkam-deep transition group-hover:bg-rokkam group-hover:text-white">
                {t("nav.cta")} →
              </span>
            </Link>
          );
        })}
        <div className="rounded-3xl border border-dashed border-ink/15 p-8 opacity-60">
          <span className="text-4xl" aria-hidden>
            📷
          </span>
          <span className="mt-4 block font-display text-2xl font-bold text-slate">
            {t("sell.cameras.soon")}
          </span>
        </div>
      </div>
    </div>
  );
}
