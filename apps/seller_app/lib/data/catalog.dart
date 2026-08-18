// Loads the bundled seed JSONs (assets/seeds, copied from /seeds — the
// canonical catalog source) and answers the same questions apps/web's
// catalog.ts does.

import 'dart:convert';

import 'package:flutter/services.dart' show rootBundle;

import 'models.dart';

const _phoneBrands = ['apple', 'samsung', 'oneplus', 'xiaomi', 'google', 'vivo', 'oppo', 'realme'];
const _laptopBrands = ['apple', 'dell', 'lenovo', 'hp', 'asus'];

class Category {
  final String slug; // 'phones' | 'laptops'
  final String label, emoji;
  final List<BrandSeed> seeds;
  final DeductionMatrix matrix;
  const Category(this.slug, this.label, this.emoji, this.seeds, this.matrix);
}

class SearchableModel {
  final String category, brandSlug, brandName;
  final SeedModel model;
  final int? maxPrice;
  const SearchableModel(this.category, this.brandSlug, this.brandName, this.model, this.maxPrice);
}

class Catalog {
  Catalog._();
  static Catalog? _instance;

  late final List<Category> categories;
  late final Map<String, Map<String, int>> phonePrices; // modelSlug -> variantLabel -> INR
  late final Map<String, ComposedPriceEntry> laptopPrices;
  late final List<Zone> zones;

  static Future<Catalog> load() async {
    if (_instance != null) return _instance!;
    final c = Catalog._();

    Future<Map<String, dynamic>> readJson(String path) async =>
        jsonDecode(await rootBundle.loadString(path)) as Map<String, dynamic>;

    Future<List<BrandSeed>> readBrands(String dir, List<String> slugs) async {
      final seeds = <BrandSeed>[];
      for (final slug in slugs) {
        seeds.add(BrandSeed.fromJson(await readJson('assets/seeds/$dir/$slug.seed.json')));
      }
      seeds.sort((a, b) => a.brand.sort.compareTo(b.brand.sort));
      return seeds.where((s) => s.brand.active).toList();
    }

    final phoneSeeds = await readBrands('phones', _phoneBrands);
    final laptopSeeds = await readBrands('laptops', _laptopBrands);
    final phoneMatrix = DeductionMatrix.fromJson(await readJson('assets/seeds/pricing/phone_deductions.json'));
    final laptopMatrix = DeductionMatrix.fromJson(await readJson('assets/seeds/pricing/laptop_deductions.json'));

    final phonePriceSeed = await readJson('assets/seeds/pricing/demo_base_prices.phone.json');
    c.phonePrices = (phonePriceSeed['prices'] as Map<String, dynamic>).map(
      (slug, variants) => MapEntry(
        slug,
        (variants as Map<String, dynamic>).map((label, inr) => MapEntry(label, (inr as num).toInt())),
      ),
    );
    final laptopPriceSeed = await readJson('assets/seeds/pricing/demo_base_prices.laptop.json');
    c.laptopPrices = (laptopPriceSeed['prices'] as Map<String, dynamic>)
        .map((slug, entry) => MapEntry(slug, ComposedPriceEntry.fromJson(entry as Map<String, dynamic>)));

    final zoneSeed = await readJson('assets/seeds/zones.json');
    c.zones = (zoneSeed['zones'] as List).map((z) => Zone.fromJson(z as Map<String, dynamic>)).toList();

    c.categories = [
      Category('phones', 'Mobiles', '📱', phoneSeeds, phoneMatrix),
      Category('laptops', 'Laptops', '💻', laptopSeeds, laptopMatrix),
    ];
    return _instance = c;
  }

  Category category(String slug) => categories.firstWhere((c) => c.slug == slug);

  bool _isPriced(String category, String modelSlug) =>
      category == 'phones' ? phonePrices.containsKey(modelSlug) : laptopPrices.containsKey(modelSlug);

  /// Only models with demo pricing are sellable.
  List<SeedModel> sellableModels(String category, String brandSlug) {
    final brand = this.category(category).seeds.firstWhere((s) => s.brand.slug == brandSlug);
    return brand.models.where((m) => _isPriced(category, m.slug)).toList();
  }

  /// Ceiling shown on model cards: "Get up to ₹X".
  int? maxPriceFor(String category, String modelSlug) {
    if (category == 'phones') {
      return phonePrices[modelSlug]?.values.reduce((a, b) => a > b ? a : b);
    }
    final entry = laptopPrices[modelSlug];
    if (entry == null) return null;
    return entry.axes.values.fold<int>(
      entry.base,
      (total, options) => total + options.values.reduce((a, b) => a > b ? a : b),
    );
  }

  List<SearchableModel> allSellableModels() => [
        for (final cat in categories)
          for (final seed in cat.seeds)
            for (final m in sellableModels(cat.slug, seed.brand.slug))
              SearchableModel(cat.slug, seed.brand.slug, seed.brand.name, m, maxPriceFor(cat.slug, m.slug)),
      ];

  /// Explicit pincodes win over prefix zones (mirrors apps/web zones.ts).
  Zone? zoneForPincode(String pincode) {
    if (!RegExp(r'^\d{6}$').hasMatch(pincode)) return null;
    for (final zone in zones) {
      if (zone.pincodes.contains(pincode)) return zone;
    }
    for (final zone in zones) {
      if (zone.pincodePrefixes.any(pincode.startsWith)) return zone;
    }
    return null;
  }
}
