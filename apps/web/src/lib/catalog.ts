import appleSeed from "@/data/seeds/phones/apple.seed.json";
import basePrices from "@/data/seeds/pricing/demo_base_prices.phone.json";
import deductionMatrix from "@/data/seeds/pricing/phone_deductions.json";
import zoneSeed from "@/data/seeds/zones.json";
import type { BasePriceSeed, BrandSeed, DeductionMatrix, SeedModel, ZoneSeed } from "./types";

// Phase 1: smartphones only are seller-visible (CLAUDE.md §3).
const phoneBrands = [appleSeed as unknown as BrandSeed].filter((b) => b.brand.active);

export const PRICES = basePrices as unknown as BasePriceSeed;
export const MATRIX = deductionMatrix as unknown as DeductionMatrix;
export const ZONES = (zoneSeed as unknown as ZoneSeed).zones;

export function listBrands(): BrandSeed["brand"][] {
  return phoneBrands.map((b) => b.brand).sort((a, b) => a.sort - b.sort);
}

export function getBrand(slug: string): BrandSeed | undefined {
  return phoneBrands.find((b) => b.brand.slug === slug);
}

/** Only models with at least one priced variant are sellable. */
export function listSellableModels(brandSlug: string): SeedModel[] {
  const brand = getBrand(brandSlug);
  if (!brand) return [];
  return brand.models.filter((m) => PRICES.prices[m.slug]);
}

export function getModel(brandSlug: string, modelSlug: string): SeedModel | undefined {
  return getBrand(brandSlug)?.models.find((m) => m.slug === modelSlug);
}

export function basePriceFor(modelSlug: string, variantLabel: string): number | null {
  return PRICES.prices[modelSlug]?.[variantLabel] ?? null;
}

/** Ceiling shown on model cards: "Get up to ₹X". */
export function maxPriceFor(modelSlug: string): number | null {
  const variants = PRICES.prices[modelSlug];
  if (!variants) return null;
  return Math.max(...Object.values(variants));
}
