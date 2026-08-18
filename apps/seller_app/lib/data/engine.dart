// Dart port of the pricing engine (packages/pricing, mirrored in
// apps/web/src/lib/quote.ts). Keep behaviour in sync across all three.

import 'dart:math';

import 'models.dart';

const quoteLockDays = 7;

/// Scrap-value floor: max(base × 5%, ₹300) — CLAUDE.md §6.
int scrapFloor(int baseInr) => max((baseInr * 0.05).round(), 300);

int _amountFor(int baseInr, String type, num value) {
  // Sign convention: value > 0 is a deduction, value < 0 a bonus.
  final magnitude = type == 'pct' ? ((baseInr * value.abs()) / 100).round() : value.abs().toInt();
  return value > 0 ? -magnitude : magnitude;
}

/// Pure quote computation: base − Σ deductions + Σ bonuses, floored at scrap value.
QuoteResult computeQuote(DeductionMatrix matrix, int baseInr, Answers answers) {
  final ledger = <LedgerLine>[];

  for (final section in matrix.sections) {
    for (final q in section.questions) {
      final answer = answers[q.id];
      if (answer == null) continue;
      final chosen = answer is List ? answer.cast<String>() : [answer as String];
      for (final optionId in chosen) {
        final matches = q.options.where((o) => o.id == optionId);
        if (matches.isEmpty) continue;
        final opt = matches.first;
        if (opt.killsDeal) {
          return QuoteResult(status: 'declined', basePriceInr: baseInr, ledger: const [], finalPriceInr: 0);
        }
        final d = opt.deduction;
        if (d != null) {
          ledger.add(LedgerLine(q.id, opt.id, opt.labelEn, _amountFor(baseInr, d.type, d.value)));
        }
      }
    }
  }

  final raw = baseInr + ledger.fold<int>(0, (sum, line) => sum + line.amountInr);
  final floor = scrapFloor(baseInr);
  final floored = raw < floor;
  return QuoteResult(
    status: 'ok',
    basePriceInr: baseInr,
    ledger: ledger,
    finalPriceInr: floored ? floor : raw,
    flooredAt: floored ? floor : null,
  );
}

/// Effective base for a composed-mode device (laptops): base_config buyback
/// plus the INR modifier of each selected axis label.
int composedBase(ComposedPriceEntry entry, Map<String, String> selection) {
  var total = entry.base;
  for (final MapEntry(key: axis, value: options) in entry.axes.entries) {
    final chosen = selection[axis];
    if (chosen != null && options[chosen] != null) total += options[chosen]!;
  }
  return total;
}

/// Demo quote code, e.g. RKM-7F3KQ2 (the server issues real codes).
String demoQuoteCode() {
  const alphabet = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
  final rng = Random();
  return 'RKM-${List.generate(6, (_) => alphabet[rng.nextInt(alphabet.length)]).join()}';
}

/// ₹12,345 (en-IN grouping: last 3, then 2s).
String formatInr(int amount) {
  final sign = amount < 0 ? '−' : '';
  var digits = amount.abs().toString();
  final parts = <String>[];
  if (digits.length > 3) {
    parts.add(digits.substring(digits.length - 3));
    digits = digits.substring(0, digits.length - 3);
    while (digits.length > 2) {
      parts.add(digits.substring(digits.length - 2));
      digits = digits.substring(0, digits.length - 2);
    }
    parts.add(digits);
    digits = parts.reversed.join(',');
  }
  return '$sign₹$digits';
}

/// "− ₹1,470" / "+ ₹250" — signed ledger amounts.
String formatSigned(int amount) => amount < 0 ? '− ${formatInr(-amount)}' : '+ ${formatInr(amount)}';
