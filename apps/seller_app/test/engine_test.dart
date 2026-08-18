// Dart mirror of apps/web/scripts/quote.test.mjs — the three engine
// implementations (Python, TS, Dart) must agree on every rupee.

import 'dart:convert';
import 'dart:io';

import 'package:flutter_test/flutter_test.dart';
import 'package:rokkam_seller/data/engine.dart';
import 'package:rokkam_seller/data/models.dart';

Map<String, dynamic> readJson(String path) =>
    jsonDecode(File(path).readAsStringSync()) as Map<String, dynamic>;

void main() {
  final matrix = DeductionMatrix.fromJson(readJson('assets/seeds/pricing/phone_deductions.json'));
  final laptopMatrix = DeductionMatrix.fromJson(readJson('assets/seeds/pricing/laptop_deductions.json'));
  final laptopPrices = readJson('assets/seeds/pricing/demo_base_prices.laptop.json')['prices'] as Map<String, dynamic>;

  test('perfect phone: no deductions, price = base', () {
    final q = computeQuote(matrix, 24500, {
      'authenticity': 'original_india',
      'powers_on': 'normal',
      'display_condition': 'flawless',
      'touch': 'full',
      'body_condition': 'like_new',
      'camera': 'fine',
      'battery': 'great',
      'biometrics': 'working',
      'sound': 'fine',
      'network': 'fine',
      'water': 'never',
      'accessories': <String>[],
      'bill': 'none',
    });
    expect(q.status, 'ok');
    expect(q.finalPriceInr, 24500);
    expect(q.ledger, isEmpty);
  });

  test('hero scenario: cracked (−30%), battery okay (−6%), charger (+250)', () {
    final q = computeQuote(matrix, 24500, {
      'display_condition': 'cracked',
      'battery': 'okay',
      'accessories': ['charger'],
    });
    expect(q.finalPriceInr, 24500 - 7350 - 1470 + 250);
    expect(q.ledger.length, 3);
  });

  test('pct bonus: bill + warranty on 40000 base = +1200', () {
    expect(computeQuote(matrix, 40000, {'bill': 'bill_warranty'}).finalPriceInr, 41200);
  });

  test('floor: everything bad cannot go below max(5%, 300)', () {
    final q = computeQuote(matrix, 10500, {
      'powers_on': 'dead',
      'display_condition': 'broken',
      'touch': 'partial',
      'body_condition': 'bent',
      'camera': 'dead',
      'battery': 'weak',
      'network': 'issue',
      'water': 'yes',
    });
    expect(q.finalPriceInr, scrapFloor(10500));
    expect(q.flooredAt, 525);
  });

  test('floor minimum is ₹300 for cheap bases', () {
    expect(scrapFloor(4000), 300);
  });

  test('kills_deal hard-stops', () {
    final q = computeQuote(matrix, 24500, {'authenticity': 'clone', 'display_condition': 'flawless'});
    expect(q.status, 'declined');
    expect(q.finalPriceInr, 0);
  });

  test('unknown option ids are ignored', () {
    expect(computeQuote(matrix, 24500, {'display_condition': 'does_not_exist'}).finalPriceInr, 24500);
  });

  test('composed base: base_config price + selected axis modifiers', () {
    final entry = ComposedPriceEntry.fromJson(laptopPrices['lenovo-thinkpad-t14-gen-3'] as Map<String, dynamic>);
    expect(
      composedBase(entry, {'cpu': 'Core i7-1255U', 'ram_gb': '32', 'storage': '1TB SSD', 'gpu': 'Integrated'}),
      32000 + 3500 + 5000 + 3000,
    );
    expect(composedBase(entry, {'cpu': 'does_not_exist'}), 32000);
  });

  test('laptop activation/BIOS lock kills the deal', () {
    expect(computeQuote(laptopMatrix, 47000, {'account_lock': 'no'}).status, 'declined');
  });

  test('laptop happy path: charger missing (−1500), bill+warranty (+3%)', () {
    final q = computeQuote(laptopMatrix, 40000, {
      'account_lock': 'yes',
      'boots': 'normal',
      'screen': 'flawless',
      'keyboard': 'fine',
      'body_condition': 'like_new',
      'battery': 'good',
      'ports': 'fine',
      'storage_health': 'fine',
      'os_license': 'genuine',
      'charger': 'none',
      'bill': 'bill_warranty',
    });
    expect(q.finalPriceInr, 40000 - 1500 + 1200);
  });

  test('formatInr: en-IN digit grouping', () {
    expect(formatInr(300), '₹300');
    expect(formatInr(24500), '₹24,500');
    expect(formatInr(1234567), '₹12,34,567');
    expect(formatSigned(-7350), '− ₹7,350');
    expect(formatSigned(250), '+ ₹250');
  });
}
