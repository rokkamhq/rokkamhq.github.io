// The live deduction ledger — Rokkam's signature trust element (CLAUDE.md §2).
// A receipt that animates every rupee line in as the seller answers.

import 'package:flutter/material.dart';

import '../data/engine.dart';
import '../data/models.dart';
import '../theme.dart';

class LedgerReceipt extends StatelessWidget {
  final String deviceLabel;
  final QuoteResult quote;
  final bool animateLines;

  const LedgerReceipt({super.key, required this.deviceLabel, required this.quote, this.animateLines = true});

  @override
  Widget build(BuildContext context) {
    return PhysicalShape(
      clipper: const ShapeBorderClipper(shape: _ReceiptBorder()),
      color: Colors.white,
      elevation: 6,
      shadowColor: RokkamColors.ink.withValues(alpha: 0.35),
      child: Padding(
        padding: const EdgeInsets.fromLTRB(20, 20, 20, 28),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          mainAxisSize: MainAxisSize.min,
          children: [
            Text('YOUR PRICE, LIVE', style: mono(size: 11, weight: 600, color: RokkamColors.slate, letterSpacing: 2)),
            const SizedBox(height: 12),
            _dashedDivider(),
            const SizedBox(height: 12),
            _line(
              Text('$deviceLabel — base', style: body(size: 13, color: RokkamColors.slate)),
              Text(formatInr(quote.basePriceInr), style: mono(size: 13)),
            ),
            for (final line in quote.ledger)
              _AnimatedEntry(
                key: ValueKey('${line.questionId}:${line.optionId}'),
                animate: animateLines,
                child: Padding(
                  padding: const EdgeInsets.only(top: 10),
                  child: _line(
                    Text(line.label, style: body(size: 13, color: RokkamColors.slate)),
                    Text(
                      formatSigned(line.amountInr),
                      style: mono(
                        size: 13,
                        color: line.amountInr < 0 ? RokkamColors.brick : RokkamColors.green,
                      ),
                    ),
                  ),
                ),
              ),
            const SizedBox(height: 14),
            _dashedDivider(),
            const SizedBox(height: 12),
            _line(
              Text('You get', style: body(size: 14, weight: 600)),
              _PricePop(
                priceInr: quote.finalPriceInr,
                child: Text(formatInr(quote.finalPriceInr), style: mono(size: 24, weight: 700, color: RokkamColors.green)),
              ),
            ),
            if (quote.flooredAt != null) ...[
              const SizedBox(height: 8),
              Text('Minimum scrap value applied', style: body(size: 12, weight: 500, color: RokkamColors.amber)),
            ],
          ],
        ),
      ),
    );
  }

  Widget _line(Widget label, Widget amount) => Row(
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          Expanded(child: label),
          const SizedBox(width: 12),
          amount,
        ],
      );

  Widget _dashedDivider() => LayoutBuilder(
        builder: (context, constraints) {
          final count = (constraints.maxWidth / 8).floor();
          return Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: List.generate(
              count,
              (_) => Container(width: 4, height: 1.2, color: RokkamColors.ink.withValues(alpha: 0.15)),
            ),
          );
        },
      );
}

/// Fades + slides a new ledger line in (web's `ledger-in` keyframes).
class _AnimatedEntry extends StatelessWidget {
  final Widget child;
  final bool animate;
  const _AnimatedEntry({super.key, required this.child, required this.animate});

  @override
  Widget build(BuildContext context) {
    if (!animate) return child;
    return TweenAnimationBuilder<double>(
      tween: Tween(begin: 0, end: 1),
      duration: const Duration(milliseconds: 450),
      curve: Curves.easeOutCubic,
      builder: (context, t, c) => Opacity(
        opacity: t,
        child: Transform.translate(offset: Offset(0, 8 * (1 - t)), child: c),
      ),
      child: child,
    );
  }
}

/// Scale-pop whenever the price changes (web's `price-pop` keyframes).
class _PricePop extends StatelessWidget {
  final int priceInr;
  final Widget child;
  const _PricePop({required this.priceInr, required this.child});

  @override
  Widget build(BuildContext context) {
    return TweenAnimationBuilder<double>(
      key: ValueKey(priceInr),
      tween: Tween(begin: 0.92, end: 1),
      duration: const Duration(milliseconds: 400),
      curve: Curves.easeOutBack,
      builder: (context, scale, c) => Transform.scale(scale: scale, child: c),
      child: child,
    );
  }
}

/// Rounded top, torn-receipt zigzag bottom.
class _ReceiptBorder extends ShapeBorder {
  const _ReceiptBorder();

  static const _notch = 9.0;
  static const _radius = 18.0;

  @override
  EdgeInsetsGeometry get dimensions => EdgeInsets.zero;

  @override
  Path getOuterPath(Rect rect, {TextDirection? textDirection}) {
    final path = Path()
      ..moveTo(rect.left, rect.top + _radius)
      ..arcToPoint(Offset(rect.left + _radius, rect.top), radius: const Radius.circular(_radius))
      ..lineTo(rect.right - _radius, rect.top)
      ..arcToPoint(Offset(rect.right, rect.top + _radius), radius: const Radius.circular(_radius))
      ..lineTo(rect.right, rect.bottom - _notch);
    final teeth = (rect.width / (_notch * 2)).floor();
    final toothWidth = rect.width / teeth;
    for (var i = 0; i < teeth; i++) {
      final x = rect.right - toothWidth * i;
      path.lineTo(x - toothWidth / 2, rect.bottom);
      path.lineTo(x - toothWidth, rect.bottom - _notch);
    }
    return path..close();
  }

  @override
  Path getInnerPath(Rect rect, {TextDirection? textDirection}) => getOuterPath(rect);

  @override
  void paint(Canvas canvas, Rect rect, {TextDirection? textDirection}) {}

  @override
  ShapeBorder scale(double t) => this;
}
