import { notFound } from "next/navigation";
import { getBrand, getModel, listBrands, listSellableModels, PRICES, MATRIX } from "@/lib/catalog";
import { SellWizard } from "@/components/SellWizard";

export function generateStaticParams() {
  return listBrands().flatMap((b) =>
    listSellableModels(b.slug).map((m) => ({ brand: b.slug, model: m.slug })),
  );
}

export async function generateMetadata(props: PageProps<"/sell/[brand]/[model]">) {
  const { brand, model } = await props.params;
  const m = getModel(brand, model);
  return { title: m ? `Sell ${getBrand(brand)?.brand.name} ${m.name}` : "Sell your phone" };
}

export default async function ModelPage(props: PageProps<"/sell/[brand]/[model]">) {
  const { brand: brandSlug, model: modelSlug } = await props.params;
  const brand = getBrand(brandSlug);
  const model = getModel(brandSlug, modelSlug);
  const prices = PRICES.prices[modelSlug];
  if (!brand || !model || !model.variants || !prices) notFound();

  return (
    <SellWizard
      brandName={brand.brand.name}
      model={model}
      prices={prices}
      matrix={MATRIX}
    />
  );
}
