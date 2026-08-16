import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getBrand,
  getCategory,
  isCategory,
  listBrands,
  listCategories,
  listSellableModels,
  maxPriceFor,
} from "@/lib/catalog";
import { formatInr } from "@/lib/format";
import { t } from "@/lib/copy";

export function generateStaticParams() {
  return listCategories().flatMap((c) =>
    listBrands(c.slug).map((b) => ({ category: c.slug, brand: b.slug })),
  );
}

export async function generateMetadata(props: PageProps<"/sell/[category]/[brand]">) {
  const { category, brand } = await props.params;
  if (!isCategory(category)) return {};
  return { title: `Sell ${getBrand(category, brand)?.brand.name ?? ""} ${getCategory(category).label.toLowerCase()}` };
}

export default async function BrandPage(props: PageProps<"/sell/[category]/[brand]">) {
  const { category, brand: brandSlug } = await props.params;
  if (!isCategory(category)) notFound();
  const brand = getBrand(category, brandSlug);
  if (!brand) notFound();

  const models = listSellableModels(category, brandSlug);
  const bySeries = new Map<string, typeof models>();
  for (const model of models) {
    const list = bySeries.get(model.series) ?? [];
    list.push(model);
    bySeries.set(model.series, list);
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
      <nav className="text-sm text-slate">
        <Link href="/sell" className="hover:text-ink">
          {t("nav.sell")}
        </Link>{" "}
        /{" "}
        <Link href={`/sell/${category}`} className="hover:text-ink">
          {getCategory(category).label}
        </Link>{" "}
        / <span className="text-ink">{brand.brand.name}</span>
      </nav>
      <h1 className="mt-3 font-display text-4xl font-bold tracking-tight text-ink">
        {t("sell.pickModel")}
      </h1>
      {[...bySeries.entries()].map(([series, seriesModels]) => (
        <section key={series} className="mt-10">
          <h2 className="font-mono text-xs font-bold uppercase tracking-widest text-slate">
            {series}
          </h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {seriesModels.map((model) => {
              const upTo = maxPriceFor(category, model.slug);
              return (
                <Link
                  key={model.slug}
                  href={`/sell/${category}/${brandSlug}/${model.slug}`}
                  className="group flex items-center gap-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-ink/5 transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  {category === "phones" ? (
                    <span
                      className="flex h-16 w-9 shrink-0 items-center justify-center rounded-lg border-2 border-ink/20 bg-sand/50 transition group-hover:border-rokkam"
                      aria-hidden
                    >
                      <span className="h-1 w-4 rounded-full bg-ink/20" />
                    </span>
                  ) : (
                    <span
                      className="flex h-12 w-16 shrink-0 flex-col justify-end overflow-hidden rounded-md border-2 border-ink/20 bg-sand/50 transition group-hover:border-rokkam"
                      aria-hidden
                    >
                      <span className="h-2 w-full border-t-2 border-ink/20 bg-ink/10" />
                    </span>
                  )}
                  <span>
                    <span className="block font-semibold text-ink">{model.name}</span>
                    <span className="mt-1 block text-xs text-slate">
                      {model.base_config ? model.base_config.description : model.launch_year}
                    </span>
                    {upTo !== null && (
                      <span className="mt-1 block text-sm font-medium text-rokkam-deep">
                        {t("sell.upto")}{" "}
                        <span className="font-mono font-bold">{formatInr(upTo)}</span>
                      </span>
                    )}
                  </span>
                </Link>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
