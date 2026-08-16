import Link from "next/link";
import { notFound } from "next/navigation";
import { getCategory, isCategory, listBrands, listCategories, listSellableModels } from "@/lib/catalog";
import { t } from "@/lib/copy";

export function generateStaticParams() {
  return listCategories().map((c) => ({ category: c.slug }));
}

export async function generateMetadata(props: PageProps<"/sell/[category]">) {
  const { category } = await props.params;
  return { title: isCategory(category) ? `Sell your ${getCategory(category).label.toLowerCase()}` : "Sell" };
}

export default async function CategoryPage(props: PageProps<"/sell/[category]">) {
  const { category } = await props.params;
  if (!isCategory(category)) notFound();

  const brands = listBrands(category);
  return (
    <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
      <nav className="text-sm text-slate">
        <Link href="/sell" className="hover:text-ink">
          {t("nav.sell")}
        </Link>{" "}
        / <span className="text-ink">{getCategory(category).label}</span>
      </nav>
      <h1 className="mt-3 font-display text-4xl font-bold tracking-tight text-ink">
        {t("sell.pickBrand")}
      </h1>
      <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {brands.map((brand) => (
          <Link
            key={brand.slug}
            href={`/sell/${category}/${brand.slug}`}
            className="group rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-ink/5 transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-sand font-display text-3xl font-bold text-ink transition group-hover:bg-rokkam group-hover:text-white">
              {brand.name[0]}
            </span>
            <span className="mt-4 block font-semibold text-ink">{brand.name}</span>
            <span className="mt-1 block text-xs text-slate">
              {listSellableModels(category, brand.slug).length} models
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
