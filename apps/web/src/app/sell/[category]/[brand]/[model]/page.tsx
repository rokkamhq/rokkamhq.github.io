import { notFound } from "next/navigation";
import {
  getBrand,
  getModel,
  isCategory,
  laptopPriceFor,
  listBrands,
  listCategories,
  listSellableModels,
  matrixFor,
  phonePricesFor,
} from "@/lib/catalog";
import { SellWizard } from "@/components/SellWizard";

export function generateStaticParams() {
  return listCategories().flatMap((c) =>
    listBrands(c.slug).flatMap((b) =>
      listSellableModels(c.slug, b.slug).map((m) => ({
        category: c.slug,
        brand: b.slug,
        model: m.slug,
      })),
    ),
  );
}

export async function generateMetadata(props: PageProps<"/sell/[category]/[brand]/[model]">) {
  const { category, brand, model } = await props.params;
  if (!isCategory(category)) return {};
  const m = getModel(category, brand, model);
  return { title: m ? `Sell ${getBrand(category, brand)?.brand.name} ${m.name}` : "Sell your device" };
}

export default async function ModelPage(props: PageProps<"/sell/[category]/[brand]/[model]">) {
  const { category, brand: brandSlug, model: modelSlug } = await props.params;
  if (!isCategory(category)) notFound();
  const brand = getBrand(category, brandSlug);
  const model = getModel(category, brandSlug, modelSlug);
  if (!brand || !model) notFound();

  const fixedPrices = category === "phones" ? phonePricesFor(modelSlug) : undefined;
  const composedEntry = category === "laptops" ? laptopPriceFor(modelSlug) : undefined;
  if (!fixedPrices && !composedEntry) notFound();

  return (
    <SellWizard
      category={category}
      brandName={brand.brand.name}
      model={model}
      fixedPrices={fixedPrices}
      composedEntry={composedEntry}
      matrix={matrixFor(category)}
    />
  );
}
