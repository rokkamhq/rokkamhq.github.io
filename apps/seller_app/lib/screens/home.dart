import 'package:flutter/material.dart';

import '../data/catalog.dart';
import '../data/models.dart';
import '../theme.dart';
import '../widgets/ledger.dart';
import 'brands.dart';
import 'settings.dart';

class HomeScreen extends StatelessWidget {
  final Catalog catalog;
  const HomeScreen({super.key, required this.catalog});

  // The hero's sample quote: iPhone 13 128GB with a cracked screen — the same
  // story the website's hero tells.
  static const _heroQuote = QuoteResult(
    status: 'ok',
    basePriceInr: 24500,
    ledger: [
      LedgerLine('display_condition', 'cracked', 'Glass cracked, display works', -7350),
      LedgerLine('battery', 'okay', 'Battery health 80–85%', -1470),
      LedgerLine('accessories', 'charger', 'Original charger', 250),
    ],
    finalPriceInr: 15930,
  );

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.fromLTRB(20, 12, 20, 32),
          children: [
            Row(
              children: [
                Text('Rokkam', style: display(size: 26, weight: 800, color: RokkamColors.greenDeep)),
                const SizedBox(width: 8),
                Text('రొక్కం', style: display(size: 16, weight: 600, color: RokkamColors.slate)),
                const Spacer(),
                IconButton(
                  onPressed: () => Navigator.of(context).push(
                    MaterialPageRoute(builder: (_) => const SettingsScreen()),
                  ),
                  icon: const Icon(Icons.tune, color: RokkamColors.slate),
                  tooltip: 'Dev settings',
                ),
              ],
            ),
            const SizedBox(height: 20),
            Text(
              "HYDERABAD & SECUNDERABAD ONLY — THAT'S THE POINT.",
              style: mono(size: 10, weight: 600, color: RokkamColors.green, letterSpacing: 1.5),
            ),
            const SizedBox(height: 12),
            Text('Sell your phone.\nCash before the agent leaves.', style: display(size: 34, weight: 800)),
            const SizedBox(height: 12),
            Text(
              '60-minute pickup in Hitec City, Gachibowli & central Hyderabad. '
              'Certified data wipe. The price we quote is the price we pay.',
              style: body(size: 15, color: RokkamColors.slate),
            ),
            const SizedBox(height: 24),
            for (final cat in catalog.categories) ...[
              _CategoryCard(catalog: catalog, category: cat),
              const SizedBox(height: 12),
            ],
            const SizedBox(height: 24),
            const LedgerReceipt(deviceLabel: 'iPhone 13 · 128GB', quote: _heroQuote, animateLines: false),
            const SizedBox(height: 10),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
              decoration: BoxDecoration(
                color: RokkamColors.sand.withValues(alpha: 0.6),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Text(
                "🔒 Locked for 7 days. The agent's app cannot change it.",
                style: body(size: 12, weight: 500, color: RokkamColors.slate),
              ),
            ),
            const SizedBox(height: 32),
            Text('Why sellers switch to Rokkam', style: display(size: 24, weight: 700)),
            const SizedBox(height: 16),
            const _Pillar('🔒', 'Locked Quote Guarantee',
                'Every rupee of deduction is shown before you commit. If your phone matches what you told us, the agent cannot change the price — the app won\'t let them.'),
            const _Pillar('⚡', 'Fastest pickup in the city',
                'We only serve Hyderabad, so we\'re built for it: 60–90 minutes in Zone A, same-day almost everywhere else in GHMC.'),
            const _Pillar('🛡️', 'Certified data destruction',
                'Every phone gets a NIST 800-88 wipe and a signed, QR-verifiable Data Destruction Certificate. Your photos and passwords die with the handover.'),
            const _Pillar('📋', 'Fully legitimate',
                'IMEI checked against the national CEIR blacklist, seller KYC, GST-compliant paperwork. Clean for you, clean for us.'),
            const SizedBox(height: 24),
            Text('Where we pick up', style: display(size: 24, weight: 700)),
            const SizedBox(height: 12),
            for (final zone in catalog.zones) _ZoneRow(zone),
            const SizedBox(height: 24),
            Center(
              child: Text(
                'CEIR-screened · KYC on every transaction · GST margin-scheme invoicing',
                textAlign: TextAlign.center,
                style: body(size: 11, color: RokkamColors.slate.withValues(alpha: 0.8)),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _CategoryCard extends StatelessWidget {
  final Catalog catalog;
  final Category category;
  const _CategoryCard({required this.catalog, required this.category});

  @override
  Widget build(BuildContext context) {
    final modelCount = category.seeds.fold<int>(
      0,
      (n, seed) => n + catalog.sellableModels(category.slug, seed.brand.slug).length,
    );
    return Material(
      color: Colors.white,
      borderRadius: BorderRadius.circular(20),
      elevation: 1,
      shadowColor: RokkamColors.ink.withValues(alpha: 0.2),
      child: InkWell(
        borderRadius: BorderRadius.circular(20),
        onTap: () => Navigator.of(context).push(
          MaterialPageRoute(builder: (_) => BrandsScreen(catalog: catalog, category: category)),
        ),
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Row(
            children: [
              Text(category.emoji, style: const TextStyle(fontSize: 34)),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Sell your ${category.label.toLowerCase()}', style: display(size: 20, weight: 700)),
                    const SizedBox(height: 2),
                    Text(
                      '${category.seeds.length} brands · $modelCount models',
                      style: body(size: 13, color: RokkamColors.slate),
                    ),
                  ],
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                decoration: const ShapeDecoration(color: RokkamColors.green, shape: StadiumBorder()),
                child: Text('Get price', style: body(size: 13, weight: 600, color: Colors.white)),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _Pillar extends StatelessWidget {
  final String icon, title, text;
  const _Pillar(this.icon, this.title, this.text);

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(color: RokkamColors.ink, borderRadius: BorderRadius.circular(18)),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(icon, style: const TextStyle(fontSize: 22)),
          const SizedBox(height: 8),
          Text(title, style: body(size: 16, weight: 600, color: Colors.white)),
          const SizedBox(height: 6),
          Text(text, style: body(size: 13, color: RokkamColors.sand.withValues(alpha: 0.75))),
        ],
      ),
    );
  }
}

class _ZoneRow extends StatelessWidget {
  final Zone zone;
  const _ZoneRow(this.zone);

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: RokkamColors.ink.withValues(alpha: 0.06)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Text(zone.name.toUpperCase(), style: mono(size: 11, weight: 700, color: RokkamColors.slate, letterSpacing: 1.5)),
              const Spacer(),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: RokkamColors.green.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(999),
                ),
                child: Text(zone.slaLabel, style: body(size: 11, weight: 600, color: RokkamColors.greenDeep)),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(zone.areas.join(' · '), style: body(size: 13, color: RokkamColors.slate)),
        ],
      ),
    );
  }
}
