import Link from "next/link";
import type { Metadata } from "next";
import { listBrands, listSellableModels } from "@/lib/catalog";
import { t } from "@/lib/copy";

export const metadata: Metadata = { title: "Sell your phone" };

export default function SellPage() {
  const brands = listBrands();
  return (
    <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
      <p className="text-sm font-semibold uppercase tracking-widest text-rokkam">
        {t("sell.pickBrand")}
      </p>
      <h1 className="mt-2 font-display text-4xl font-bold tracking-tight text-ink">
        {t("sell.title")}
      </h1>
      <p className="mt-2 text-slate">{t("sell.sub")}</p>
      <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {brands.map((brand) => (
          <Link
            key={brand.slug}
            href={`/sell/${brand.slug}`}
            className="group rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-ink/5 transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-sand font-display text-3xl font-bold text-ink transition group-hover:bg-rokkam group-hover:text-white">
              {brand.name[0]}
            </span>
            <span className="mt-4 block font-semibold text-ink">{brand.name}</span>
            <span className="mt-1 block text-xs text-slate">
              {listSellableModels(brand.slug).length} models
            </span>
          </Link>
        ))}
        {["Samsung", "OnePlus", "Xiaomi", "Vivo", "Oppo", "Realme", "Google"].map((name) => (
          <div
            key={name}
            className="rounded-2xl border border-dashed border-ink/15 p-8 text-center opacity-60"
          >
            <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-sand/50 font-display text-3xl font-bold text-slate">
              {name[0]}
            </span>
            <span className="mt-4 block font-semibold text-slate">{name}</span>
            <span className="mt-1 block text-xs text-slate/70">Coming soon</span>
          </div>
        ))}
      </div>
    </div>
  );
}
