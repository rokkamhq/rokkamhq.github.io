// Mirrors seeds/SEED_SCHEMA.md (catalog) and seeds/pricing/*.json (rules).

export interface SeedVariant {
  label: string;
  attrs: Record<string, number | string>;
  launch_price_inr: number | null;
  base_price_inr: number | null;
}

export interface SeedModel {
  name: string;
  slug: string;
  launch_year: number;
  series: string;
  discontinued: boolean;
  aliases: string[];
  image_ref: string;
  variant_mode: "fixed" | "composed";
  variants?: SeedVariant[];
  notes?: string;
}

export interface BrandSeed {
  schema_version: string;
  category: "phone" | "laptop" | "camera";
  verified: boolean;
  brand: { name: string; slug: string; sort: number; active: boolean };
  models: SeedModel[];
}

export type DeductionType = "flat" | "pct";

export interface Deduction {
  type: DeductionType;
  /** > 0 lowers the price; < 0 is a bonus (spec: bonuses are negative deductions). */
  value: number;
}

export interface ConditionOption {
  id: string;
  label_en: string;
  deduction: Deduction | null;
  kills_deal?: boolean;
  note_en?: string;
}

export interface ConditionQuestion {
  id: string;
  type: "single" | "multi";
  text_en: string;
  options: ConditionOption[];
}

export interface ConditionSection {
  id: string;
  title_en: string;
  questions: ConditionQuestion[];
}

export interface DeductionMatrix {
  schema_version: string;
  category: string;
  status: string;
  sections: ConditionSection[];
}

export interface BasePriceSeed {
  schema_version: string;
  category: string;
  status: string;
  currency: string;
  effective_from: string;
  prices: Record<string, Record<string, number>>;
}

export interface Zone {
  id: string;
  name: string;
  sla_label: string;
  sla_minutes: number;
  areas: string[];
  pincodes?: string[];
  pincode_prefixes?: string[];
}

export interface ZoneSeed {
  schema_version: string;
  status: string;
  zones: Zone[];
}

/** answers[questionId] = optionId (single) | optionId[] (multi) */
export type Answers = Record<string, string | string[]>;

export interface LedgerLine {
  questionId: string;
  optionId: string;
  label: string;
  /** Signed INR impact: negative = deduction, positive = bonus. */
  amountInr: number;
}

export interface QuoteResult {
  status: "ok" | "declined";
  basePriceInr: number;
  ledger: LedgerLine[];
  finalPriceInr: number;
  /** True when the scrap-value floor kicked in. */
  flooredAt: number | null;
}
