import appleSeed from "@/data/seeds/phones/apple.seed.json";
import samsungSeed from "@/data/seeds/phones/samsung.seed.json";
import oneplusSeed from "@/data/seeds/phones/oneplus.seed.json";
import xiaomiSeed from "@/data/seeds/phones/xiaomi.seed.json";
import googleSeed from "@/data/seeds/phones/google.seed.json";
import vivoSeed from "@/data/seeds/phones/vivo.seed.json";
import oppoSeed from "@/data/seeds/phones/oppo.seed.json";
import realmeSeed from "@/data/seeds/phones/realme.seed.json";
import lenovoSeed from "@/data/seeds/laptops/lenovo.seed.json";
import appleLaptopSeed from "@/data/seeds/laptops/apple.seed.json";
import dellSeed from "@/data/seeds/laptops/dell.seed.json";
import hpSeed from "@/data/seeds/laptops/hp.seed.json";
import asusSeed from "@/data/seeds/laptops/asus.seed.json";
import phonePrices from "@/data/seeds/pricing/demo_base_prices.phone.json";
import laptopPrices from "@/data/seeds/pricing/demo_base_prices.laptop.json";
import phoneMatrix from "@/data/seeds/pricing/phone_deductions.json";
import laptopMatrix from "@/data/seeds/pricing/laptop_deductions.json";
import zoneSeed from "@/data/seeds/zones.json";
import type {
  BasePriceSeed,
  BrandSeed,
  ComposedPriceEntry,
  ComposedPriceSeed,
  DeductionMatrix,
  SeedModel,
  ZoneSeed,
} from "./types";

export type CategorySlug = "phones" | "laptops";

interface Category {
  slug: CategorySlug;
  label: string;
  emoji: string;
  seeds: BrandSeed[];
  matrix: DeductionMatrix;
}

const seed = (s: unknown) => s as BrandSeed;

const CATEGORIES: Record<CategorySlug, Category> = {
  phones: {
    slug: "phones",
    label: "Mobiles",
    emoji: "📱",
    seeds: [appleSeed, samsungSeed, oneplusSeed, xiaomiSeed, googleSeed, vivoSeed, oppoSeed, realmeSeed]
      .map(seed)
      .filter((b) => b.brand.active),
    matrix: phoneMatrix as unknown as DeductionMatrix,
  },
  laptops: {
    slug: "laptops",
    label: "Laptops",
    emoji: "💻",
    seeds: [appleLaptopSeed, dellSeed, lenovoSeed, hpSeed, asusSeed]
      .map(seed)
      .filter((b) => b.brand.active),
    matrix: laptopMatrix as unknown as DeductionMatrix,
  },
};

export const PHONE_PRICES = phonePrices as unknown as BasePriceSeed;
export const LAPTOP_PRICES = laptopPrices as unknown as ComposedPriceSeed;
export const ZONES = (zoneSeed as unknown as ZoneSeed).zones;

export function isCategory(slug: string): slug is CategorySlug {
  return slug in CATEGORIES;
}

export function listCategories(): Category[] {
  return Object.values(CATEGORIES);
}

export function getCategory(slug: CategorySlug): Category {
  return CATEGORIES[slug];
}

export function matrixFor(category: CategorySlug): DeductionMatrix {
  return CATEGORIES[category].matrix;
}

export function listBrands(category: CategorySlug): BrandSeed["brand"][] {
  return CATEGORIES[category].seeds.map((b) => b.brand).sort((a, b) => a.sort - b.sort);
}

export function getBrand(category: CategorySlug, slug: string): BrandSeed | undefined {
  return CATEGORIES[category].seeds.find((b) => b.brand.slug === slug);
}

function isPriced(category: CategorySlug, model: SeedModel): boolean {
  return category === "phones"
    ? PHONE_PRICES.prices[model.slug] !== undefined
    : LAPTOP_PRICES.prices[model.slug] !== undefined;
}

/** Only models with demo pricing are sellable. */
export function listSellableModels(category: CategorySlug, brandSlug: string): SeedModel[] {
  const brand = getBrand(category, brandSlug);
  if (!brand) return [];
  return brand.models.filter((m) => isPriced(category, m));
}

export function getModel(
  category: CategorySlug,
  brandSlug: string,
  modelSlug: string,
): SeedModel | undefined {
  return getBrand(category, brandSlug)?.models.find((m) => m.slug === modelSlug);
}

export function phonePricesFor(modelSlug: string): Record<string, number> | undefined {
  return PHONE_PRICES.prices[modelSlug];
}

export function laptopPriceFor(modelSlug: string): ComposedPriceEntry | undefined {
  return LAPTOP_PRICES.prices[modelSlug];
}

/** Ceiling shown on model cards: "Get up to ₹X". */
export function maxPriceFor(category: CategorySlug, modelSlug: string): number | null {
  if (category === "phones") {
    const variants = PHONE_PRICES.prices[modelSlug];
    return variants ? Math.max(...Object.values(variants)) : null;
  }
  const entry = LAPTOP_PRICES.prices[modelSlug];
  if (!entry) return null;
  return Object.values(entry.axes).reduce(
    (total, options) => total + Math.max(...Object.values(options)),
    entry.base,
  );
}
