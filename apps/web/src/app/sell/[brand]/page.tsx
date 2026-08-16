import Link from "next/link";
import { notFound } from "next/navigation";
import { getBrand, listBrands, listSellableModels, maxPriceFor } from "@/lib/catalog";
import { formatInr } from "@/lib/format";
import { t } from "@/lib/copy";

export function generateStaticParams() {
  return listBrands().map((b) => ({ brand: b.slug }));
}

export async function generateMetadata(props: PageProps<"/sell/[brand]">) {
  const { brand } = await props.params;
  return { title: `Sell ${getBrand(brand)?.brand.name ?? ""} phone` };
}

export default async function BrandPage(props: PageProps<"/sell/[brand]">) {
  const { brand: brandSlug } = await props.params;
  const brand = getBrand(brandSlug);
  if (!brand) notFound();

  const models = listSellableModels(brandSlug);
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
              const upTo = maxPriceFor(model.slug);
              return (
                <Link
                  key={model.slug}
                  href={`/sell/${brandSlug}/${model.slug}`}
                  className="group flex items-center gap-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-ink/5 transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <span
                    className="flex h-16 w-9 shrink-0 items-center justify-center rounded-lg border-2 border-ink/20 bg-sand/50 transition group-hover:border-rokkam"
                    aria-hidden
                  >
                    <span className="h-1 w-4 rounded-full bg-ink/20" />
                  </span>
                  <span>
                    <span className="block font-semibold text-ink">{model.name}</span>
                    <span className="mt-1 block text-xs text-slate">{model.launch_year}</span>
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
