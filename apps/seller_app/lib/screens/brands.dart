import 'package:flutter/material.dart';

import '../data/catalog.dart';
import '../data/engine.dart';
import '../data/models.dart';
import '../theme.dart';
import 'wizard.dart';

class BrandsScreen extends StatefulWidget {
  final Catalog catalog;
  final Category category;
  const BrandsScreen({super.key, required this.catalog, required this.category});

  @override
  State<BrandsScreen> createState() => _BrandsScreenState();
}

class _BrandsScreenState extends State<BrandsScreen> {
  final _searchController = TextEditingController();
  String _query = '';

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  List<SearchableModel> get _results {
    final q = _query.trim().toLowerCase();
    if (q.length < 2) return const [];
    final terms = q.split(RegExp(r'\s+'));
    final all = widget.catalog.allSellableModels().where((m) => m.category == widget.category.slug);
    final matches = all.where((m) {
      final haystack = ('${m.brandName} ${m.model.name} ${m.model.aliases.join(' ')}').toLowerCase();
      return terms.every(haystack.contains);
    }).toList()
      ..sort((a, b) => b.model.launchYear.compareTo(a.model.launchYear));
    return matches.take(8).toList();
  }

  @override
  Widget build(BuildContext context) {
    final results = _results;
    return Scaffold(
      appBar: AppBar(title: Text('Sell your ${widget.category.label.toLowerCase()}')),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(20, 8, 20, 32),
        children: [
          TextField(
            controller: _searchController,
            onChanged: (v) => setState(() => _query = v),
            decoration: const InputDecoration(
              hintText: 'Type your model — iPhone 13, S23…',
              prefixIcon: Icon(Icons.search, color: RokkamColors.slate),
            ),
          ),
          const SizedBox(height: 16),
          if (_query.trim().length >= 2) ...[
            if (results.isEmpty)
              Padding(
                padding: const EdgeInsets.all(12),
                child: Text('No match — pick a brand below and browse.', style: body(size: 13, color: RokkamColors.slate)),
              )
            else
              for (final m in results) _SearchHit(catalog: widget.catalog, category: widget.category, hit: m),
            const SizedBox(height: 16),
          ],
          Text('Pick your brand', style: display(size: 22, weight: 700)),
          const SizedBox(height: 12),
          GridView.count(
            crossAxisCount: 2,
            mainAxisSpacing: 12,
            crossAxisSpacing: 12,
            childAspectRatio: 1.5,
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            children: [
              for (final seed in widget.category.seeds)
                _BrandCard(catalog: widget.catalog, category: widget.category, seed: seed),
            ],
          ),
        ],
      ),
    );
  }
}

class _SearchHit extends StatelessWidget {
  final Catalog catalog;
  final Category category;
  final SearchableModel hit;
  const _SearchHit({required this.catalog, required this.category, required this.hit});

  @override
  Widget build(BuildContext context) {
    return Card(
      color: Colors.white,
      elevation: 0,
      margin: const EdgeInsets.only(bottom: 8),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(14),
        side: BorderSide(color: RokkamColors.ink.withValues(alpha: 0.08)),
      ),
      child: ListTile(
        title: Text('${hit.brandName} ${hit.model.name}', style: body(size: 14, weight: 600)),
        trailing: hit.maxPrice == null
            ? null
            : Text('up to ${formatInr(hit.maxPrice!)}', style: mono(size: 12, color: RokkamColors.greenDeep)),
        onTap: () => Navigator.of(context).push(
          MaterialPageRoute(
            builder: (_) => WizardScreen(
              catalog: catalog,
              category: category,
              brandName: hit.brandName,
              model: hit.model,
            ),
          ),
        ),
      ),
    );
  }
}

class _BrandCard extends StatelessWidget {
  final Catalog catalog;
  final Category category;
  final BrandSeed seed;
  const _BrandCard({required this.catalog, required this.category, required this.seed});

  @override
  Widget build(BuildContext context) {
    final count = catalog.sellableModels(category.slug, seed.brand.slug).length;
    return Material(
      color: Colors.white,
      borderRadius: BorderRadius.circular(18),
      elevation: 1,
      shadowColor: RokkamColors.ink.withValues(alpha: 0.15),
      child: InkWell(
        borderRadius: BorderRadius.circular(18),
        onTap: () => Navigator.of(context).push(
          MaterialPageRoute(
            builder: (_) => ModelsScreen(catalog: catalog, category: category, seed: seed),
          ),
        ),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(seed.brand.name, style: display(size: 19, weight: 700)),
              const SizedBox(height: 4),
              Text('$count models', style: body(size: 12, color: RokkamColors.slate)),
            ],
          ),
        ),
      ),
    );
  }
}

class ModelsScreen extends StatelessWidget {
  final Catalog catalog;
  final Category category;
  final BrandSeed seed;
  const ModelsScreen({super.key, required this.catalog, required this.category, required this.seed});

  @override
  Widget build(BuildContext context) {
    final models = catalog.sellableModels(category.slug, seed.brand.slug)
      ..sort((a, b) => b.launchYear.compareTo(a.launchYear));
    return Scaffold(
      appBar: AppBar(title: Text(seed.brand.name)),
      body: ListView.separated(
        padding: const EdgeInsets.fromLTRB(20, 8, 20, 32),
        itemCount: models.length,
        separatorBuilder: (_, _) => const SizedBox(height: 10),
        itemBuilder: (context, i) {
          final model = models[i];
          final maxPrice = catalog.maxPriceFor(category.slug, model.slug);
          return Material(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            elevation: 1,
            shadowColor: RokkamColors.ink.withValues(alpha: 0.12),
            child: InkWell(
              borderRadius: BorderRadius.circular(16),
              onTap: () => Navigator.of(context).push(
                MaterialPageRoute(
                  builder: (_) => WizardScreen(
                    catalog: catalog,
                    category: category,
                    brandName: seed.brand.name,
                    model: model,
                  ),
                ),
              ),
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 16),
                child: Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(model.name, style: body(size: 15, weight: 600)),
                          const SizedBox(height: 2),
                          Text('${model.launchYear}', style: body(size: 12, color: RokkamColors.slate)),
                        ],
                      ),
                    ),
                    if (maxPrice != null)
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          Text('Get up to', style: body(size: 11, color: RokkamColors.slate)),
                          Text(formatInr(maxPrice), style: mono(size: 15, weight: 700, color: RokkamColors.greenDeep)),
                        ],
                      ),
                  ],
                ),
              ),
            ),
          );
        },
      ),
    );
  }
}
