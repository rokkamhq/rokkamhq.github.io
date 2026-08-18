// Mirrors seeds/SEED_SCHEMA.md and apps/web/src/lib/types.ts.

typedef Answers = Map<String, Object>; // questionId -> optionId (String) | List<String>

class Brand {
  final String name, slug;
  final int sort;
  final bool active;
  Brand.fromJson(Map<String, dynamic> j)
      : name = j['name'] as String,
        slug = j['slug'] as String,
        sort = j['sort'] as int,
        active = j['active'] as bool;
}

class SeedVariant {
  final String label;
  SeedVariant.fromJson(Map<String, dynamic> j) : label = j['label'] as String;
}

class VariantAxisOption {
  final String label;
  VariantAxisOption.fromJson(Map<String, dynamic> j) : label = j['label'] as String;
}

class SeedModel {
  final String name, slug, variantMode;
  final int launchYear;
  final List<String> aliases;
  final List<SeedVariant> variants;
  final Map<String, List<VariantAxisOption>> variantAxes;
  final String? baseConfigDescription;

  SeedModel.fromJson(Map<String, dynamic> j)
      : name = j['name'] as String,
        slug = j['slug'] as String,
        variantMode = j['variant_mode'] as String,
        launchYear = j['launch_year'] as int,
        aliases = (j['aliases'] as List? ?? const []).cast<String>(),
        variants = (j['variants'] as List? ?? const [])
            .map((v) => SeedVariant.fromJson(v as Map<String, dynamic>))
            .toList(),
        variantAxes = (j['variant_axes'] as Map<String, dynamic>? ?? const {}).map(
          (axis, options) => MapEntry(
            axis,
            (options as List).map((o) => VariantAxisOption.fromJson(o as Map<String, dynamic>)).toList(),
          ),
        ),
        baseConfigDescription = (j['base_config'] as Map<String, dynamic>?)?['description'] as String?;
}

class BrandSeed {
  final Brand brand;
  final List<SeedModel> models;
  BrandSeed.fromJson(Map<String, dynamic> j)
      : brand = Brand.fromJson(j['brand'] as Map<String, dynamic>),
        models = (j['models'] as List).map((m) => SeedModel.fromJson(m as Map<String, dynamic>)).toList();
}

class Deduction {
  final String type; // flat | pct
  final num value; // > 0 deduction, < 0 bonus
  Deduction.fromJson(Map<String, dynamic> j)
      : type = j['type'] as String,
        value = j['value'] as num;
}

class ConditionOption {
  final String id, labelEn;
  final String? noteEn;
  final Deduction? deduction;
  final bool killsDeal;
  ConditionOption.fromJson(Map<String, dynamic> j)
      : id = j['id'] as String,
        labelEn = j['label_en'] as String,
        noteEn = j['note_en'] as String?,
        deduction = j['deduction'] == null ? null : Deduction.fromJson(j['deduction'] as Map<String, dynamic>),
        killsDeal = j['kills_deal'] as bool? ?? false;
}

class ConditionQuestion {
  final String id, type, textEn; // type: single | multi
  final List<ConditionOption> options;
  ConditionQuestion.fromJson(Map<String, dynamic> j)
      : id = j['id'] as String,
        type = j['type'] as String,
        textEn = j['text_en'] as String,
        options = (j['options'] as List).map((o) => ConditionOption.fromJson(o as Map<String, dynamic>)).toList();
}

class ConditionSection {
  final String id, titleEn;
  final List<ConditionQuestion> questions;
  ConditionSection.fromJson(Map<String, dynamic> j)
      : id = j['id'] as String,
        titleEn = j['title_en'] as String,
        questions = (j['questions'] as List).map((q) => ConditionQuestion.fromJson(q as Map<String, dynamic>)).toList();
}

class DeductionMatrix {
  final List<ConditionSection> sections;
  DeductionMatrix.fromJson(Map<String, dynamic> j)
      : sections = (j['sections'] as List).map((s) => ConditionSection.fromJson(s as Map<String, dynamic>)).toList();
}

/// Composed-mode pricing (laptops): base_config buyback + per-axis modifiers.
class ComposedPriceEntry {
  final int base;
  final Map<String, Map<String, int>> axes;
  ComposedPriceEntry.fromJson(Map<String, dynamic> j)
      : base = j['base'] as int,
        axes = (j['axes'] as Map<String, dynamic>).map(
          (axis, options) => MapEntry(
            axis,
            (options as Map<String, dynamic>).map((label, inr) => MapEntry(label, (inr as num).toInt())),
          ),
        );
}

class Zone {
  final String id, name, slaLabel;
  final List<String> areas, pincodes, pincodePrefixes;
  Zone.fromJson(Map<String, dynamic> j)
      : id = j['id'] as String,
        name = j['name'] as String,
        slaLabel = j['sla_label'] as String,
        areas = (j['areas'] as List? ?? const []).cast<String>(),
        pincodes = (j['pincodes'] as List? ?? const []).cast<String>(),
        pincodePrefixes = (j['pincode_prefixes'] as List? ?? const []).cast<String>();
}

class LedgerLine {
  final String questionId, optionId, label;

  /// Signed INR impact: negative = deduction, positive = bonus.
  final int amountInr;
  const LedgerLine(this.questionId, this.optionId, this.label, this.amountInr);
}

class QuoteResult {
  final String status; // ok | declined
  final int basePriceInr;
  final List<LedgerLine> ledger;
  final int finalPriceInr;

  /// Non-null when the scrap-value floor kicked in.
  final int? flooredAt;
  const QuoteResult({
    required this.status,
    required this.basePriceInr,
    required this.ledger,
    required this.finalPriceInr,
    this.flooredAt,
  });
}
