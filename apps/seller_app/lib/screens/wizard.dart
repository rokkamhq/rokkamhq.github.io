import 'package:flutter/material.dart';

import '../data/catalog.dart';
import '../data/engine.dart';
import '../data/models.dart';
import '../theme.dart';
import '../widgets/ledger.dart';
import 'result.dart';

const _axisLabels = {'cpu': 'Processor', 'ram_gb': 'RAM', 'storage': 'Storage', 'gpu': 'Graphics'};

String _axisOptionLabel(String axis, String label) => axis == 'ram_gb' ? '$label GB' : label;

class WizardScreen extends StatefulWidget {
  final Catalog catalog;
  final Category category;
  final String brandName;
  final SeedModel model;
  const WizardScreen({
    super.key,
    required this.catalog,
    required this.category,
    required this.brandName,
    required this.model,
  });

  @override
  State<WizardScreen> createState() => _WizardScreenState();
}

class _WizardScreenState extends State<WizardScreen> {
  late final List<String> _variantLabels;
  late final List<({String axis, List<String> labels})> _axes;
  late final ComposedPriceEntry? _composedEntry;

  String? _variantLabel;
  final Map<String, String> _axisSelection = {};
  late String _phase; // variant | config | questions
  int _stepIndex = 0;
  final Answers _answers = {};

  @override
  void initState() {
    super.initState();
    final isComposed = widget.model.variantMode == 'composed';
    _composedEntry = isComposed ? widget.catalog.laptopPrices[widget.model.slug] : null;

    final fixedPrices = widget.catalog.phonePrices[widget.model.slug] ?? const {};
    _variantLabels = widget.model.variants.map((v) => v.label).where(fixedPrices.containsKey).toList();

    _axes = [
      if (_composedEntry != null)
        for (final MapEntry(key: axis, value: options) in widget.model.variantAxes.entries)
          if (options.map((o) => o.label).where((l) => _composedEntry.axes[axis]?.containsKey(l) ?? false).isNotEmpty)
            (
              axis: axis,
              labels: options.map((o) => o.label).where((l) => _composedEntry.axes[axis]!.containsKey(l)).toList(),
            ),
    ];
    for (final (:axis, :labels) in _axes) {
      _axisSelection[axis] = labels.firstWhere((l) => _composedEntry!.axes[axis]![l] == 0, orElse: () => labels.first);
    }

    if (_composedEntry != null) {
      _phase = _axes.isNotEmpty ? 'config' : 'questions';
    } else if (_variantLabels.length == 1) {
      _variantLabel = _variantLabels.first;
      _phase = 'questions';
    } else {
      _phase = 'variant';
    }
  }

  int? get _basePrice {
    if (_composedEntry != null) return composedBase(_composedEntry, _axisSelection);
    if (_variantLabel == null) return null;
    return widget.catalog.phonePrices[widget.model.slug]?[_variantLabel];
  }

  String get _configSummary => _composedEntry != null
      ? _axes.map((a) => _axisOptionLabel(a.axis, _axisSelection[a.axis]!)).join(' · ')
      : (_variantLabel ?? '');

  String get _deviceLabel {
    final config = _configSummary;
    return '${widget.brandName} ${widget.model.name}${config.isEmpty ? '' : ' · $config'}';
  }

  List<ConditionSection> get _sections => widget.category.matrix.sections;

  @override
  Widget build(BuildContext context) {
    final basePrice = _basePrice;
    final quote = basePrice == null ? null : computeQuote(widget.category.matrix, basePrice, _answers);

    if (quote != null && quote.status == 'declined') return const _DeclinedScreen();

    return Scaffold(
      appBar: AppBar(title: Text(widget.model.name)),
      body: switch (_phase) {
        'variant' => _variantPicker(),
        'config' => _configPicker(basePrice),
        _ => _questions(quote!),
      },
      bottomNavigationBar: _phase == 'questions' && quote != null ? _ledgerBar(quote) : null,
    );
  }

  Widget _variantPicker() {
    final prices = widget.catalog.phonePrices[widget.model.slug] ?? const {};
    return ListView(
      padding: const EdgeInsets.all(20),
      children: [
        Text('Which storage do you have?', style: display(size: 26, weight: 700)),
        const SizedBox(height: 4),
        Text('Check Settings → General → About if unsure.', style: body(size: 13, color: RokkamColors.slate)),
        const SizedBox(height: 20),
        for (final label in _variantLabels)
          Padding(
            padding: const EdgeInsets.only(bottom: 10),
            child: Material(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              elevation: 1,
              shadowColor: RokkamColors.ink.withValues(alpha: 0.12),
              child: InkWell(
                borderRadius: BorderRadius.circular(16),
                onTap: () => setState(() {
                  _variantLabel = label;
                  _phase = 'questions';
                  _stepIndex = 0;
                }),
                child: Padding(
                  padding: const EdgeInsets.all(18),
                  child: Row(
                    children: [
                      Expanded(child: Text(label, style: body(size: 16, weight: 600))),
                      Text('Get up to ', style: body(size: 12, color: RokkamColors.slate)),
                      Text(formatInr(prices[label] ?? 0), style: mono(size: 15, weight: 700, color: RokkamColors.greenDeep)),
                    ],
                  ),
                ),
              ),
            ),
          ),
      ],
    );
  }

  Widget _configPicker(int? basePrice) {
    return ListView(
      padding: const EdgeInsets.all(20),
      children: [
        Text('Which configuration is yours?', style: display(size: 26, weight: 700)),
        const SizedBox(height: 4),
        Text("Pick what's inside your machine — the price adjusts as you choose.",
            style: body(size: 13, color: RokkamColors.slate)),
        if (widget.model.baseConfigDescription != null) ...[
          const SizedBox(height: 12),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
            decoration: BoxDecoration(
              color: RokkamColors.sand.withValues(alpha: 0.6),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Text('Base model: ${widget.model.baseConfigDescription}',
                style: body(size: 12, weight: 500, color: RokkamColors.slate)),
          ),
        ],
        const SizedBox(height: 20),
        for (final (:axis, :labels) in _axes) ...[
          Text(_axisLabels[axis] ?? axis, style: body(size: 15, weight: 600)),
          const SizedBox(height: 10),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              for (final label in labels)
                _ChoiceChip(
                  label: _axisOptionLabel(axis, label),
                  selected: _axisSelection[axis] == label,
                  onTap: () => setState(() => _axisSelection[axis] = label),
                ),
            ],
          ),
          const SizedBox(height: 20),
        ],
        Row(
          children: [
            FilledButton(
              onPressed: () => setState(() {
                _phase = 'questions';
                _stepIndex = 0;
              }),
              child: const Text('Next'),
            ),
            const SizedBox(width: 16),
            if (basePrice != null)
              Text.rich(TextSpan(children: [
                TextSpan(text: 'Get up to ', style: body(size: 13, color: RokkamColors.slate)),
                TextSpan(text: formatInr(basePrice), style: mono(size: 14, weight: 700, color: RokkamColors.greenDeep)),
              ])),
          ],
        ),
      ],
    );
  }

  Widget _questions(QuoteResult quote) {
    final section = _sections[_stepIndex];
    final sectionComplete = section.questions.every((q) => q.type == 'multi' || _answers.containsKey(q.id));

    return ListView(
      key: PageStorageKey(section.id),
      padding: const EdgeInsets.all(20),
      children: [
        Text('STEP ${_stepIndex + 1} / ${_sections.length}',
            style: mono(size: 11, weight: 700, color: RokkamColors.slate, letterSpacing: 1.5)),
        const SizedBox(height: 8),
        ClipRRect(
          borderRadius: BorderRadius.circular(999),
          child: LinearProgressIndicator(
            value: (_stepIndex + 1) / _sections.length,
            minHeight: 6,
            backgroundColor: RokkamColors.ink.withValues(alpha: 0.1),
            color: RokkamColors.green,
          ),
        ),
        const SizedBox(height: 20),
        Text(section.titleEn, style: display(size: 26, weight: 700)),
        const SizedBox(height: 8),
        for (final q in section.questions) ...[
          const SizedBox(height: 16),
          Text(q.textEn, style: body(size: 15, weight: 600)),
          const SizedBox(height: 10),
          for (final opt in q.options)
            _OptionCard(
              option: opt,
              selected: q.type == 'multi'
                  ? (_answers[q.id] as List?)?.contains(opt.id) ?? false
                  : _answers[q.id] == opt.id,
              onTap: () => setState(() {
                if (q.type == 'multi') {
                  final current = List<String>.from(_answers[q.id] as List? ?? const []);
                  current.contains(opt.id) ? current.remove(opt.id) : current.add(opt.id);
                  _answers[q.id] = current;
                } else {
                  _answers[q.id] = opt.id;
                }
              }),
            ),
        ],
        const SizedBox(height: 24),
        Row(
          children: [
            if (_stepIndex > 0 || _variantLabels.length > 1 || _axes.isNotEmpty)
              OutlinedButton(
                onPressed: () => setState(() {
                  if (_stepIndex > 0) {
                    _stepIndex--;
                  } else if (_composedEntry != null && _axes.isNotEmpty) {
                    _phase = 'config';
                  } else if (_variantLabels.length > 1) {
                    _phase = 'variant';
                  }
                }),
                child: const Text('Back'),
              ),
            const SizedBox(width: 12),
            Expanded(
              child: FilledButton(
                onPressed: sectionComplete ? _goNext : null,
                child: Text(_stepIndex == _sections.length - 1 ? 'Show my final price' : 'Next'),
              ),
            ),
          ],
        ),
        const SizedBox(height: 8),
      ],
    );
  }

  void _goNext() {
    if (_stepIndex < _sections.length - 1) {
      setState(() => _stepIndex++);
    } else {
      Navigator.of(context).push(
        MaterialPageRoute(
          builder: (_) => ResultScreen(
            catalog: widget.catalog,
            categorySlug: widget.category.slug,
            deviceLabel: _deviceLabel,
            modelSlug: widget.model.slug,
            variantLabel: _composedEntry == null ? _variantLabel : null,
            axisSelection: _composedEntry != null ? Map.of(_axisSelection) : null,
            answers: Map.of(_answers),
            quote: computeQuote(widget.category.matrix, _basePrice!, _answers),
          ),
        ),
      );
    }
  }

  Widget _ledgerBar(QuoteResult quote) {
    return Material(
      color: RokkamColors.ink,
      child: InkWell(
        onTap: () => showModalBottomSheet(
          context: context,
          backgroundColor: Colors.transparent,
          builder: (_) => Padding(
            padding: const EdgeInsets.all(16),
            child: LedgerReceipt(deviceLabel: _deviceLabel, quote: quote, animateLines: false),
          ),
        ),
        child: SafeArea(
          top: false,
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
            child: Row(
              children: [
                Text('You get', style: body(size: 14, color: RokkamColors.sand)),
                const Spacer(),
                TweenAnimationBuilder<double>(
                  key: ValueKey(quote.finalPriceInr),
                  tween: Tween(begin: 0.92, end: 1),
                  duration: const Duration(milliseconds: 400),
                  curve: Curves.easeOutBack,
                  builder: (context, scale, child) => Transform.scale(scale: scale, child: child),
                  child: Text(formatInr(quote.finalPriceInr), style: mono(size: 20, weight: 700, color: Colors.white)),
                ),
                const SizedBox(width: 8),
                Icon(Icons.expand_less, color: RokkamColors.sand.withValues(alpha: 0.7)),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _ChoiceChip extends StatelessWidget {
  final String label;
  final bool selected;
  final VoidCallback onTap;
  const _ChoiceChip({required this.label, required this.selected, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Material(
      color: selected ? RokkamColors.green.withValues(alpha: 0.08) : Colors.white,
      borderRadius: BorderRadius.circular(12),
      child: InkWell(
        borderRadius: BorderRadius.circular(12),
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
              width: 2,
              color: selected ? RokkamColors.green : RokkamColors.ink.withValues(alpha: 0.1),
            ),
          ),
          child: Text(label, style: body(size: 13, weight: 500, color: selected ? RokkamColors.ink : RokkamColors.slate)),
        ),
      ),
    );
  }
}

class _OptionCard extends StatelessWidget {
  final ConditionOption option;
  final bool selected;
  final VoidCallback onTap;
  const _OptionCard({required this.option, required this.selected, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Material(
        color: selected ? RokkamColors.green.withValues(alpha: 0.06) : Colors.white,
        borderRadius: BorderRadius.circular(14),
        child: InkWell(
          borderRadius: BorderRadius.circular(14),
          onTap: onTap,
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(14),
              border: Border.all(
                width: 2,
                color: selected ? RokkamColors.green : RokkamColors.ink.withValues(alpha: 0.08),
              ),
            ),
            child: Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(option.labelEn,
                          style: body(size: 14, weight: 500, color: selected ? RokkamColors.ink : RokkamColors.slate)),
                      if (option.noteEn != null) ...[
                        const SizedBox(height: 2),
                        Text(option.noteEn!, style: body(size: 12, color: RokkamColors.slate.withValues(alpha: 0.8))),
                      ],
                    ],
                  ),
                ),
                const SizedBox(width: 12),
                AnimatedContainer(
                  duration: const Duration(milliseconds: 150),
                  width: 22,
                  height: 22,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: selected ? RokkamColors.green : Colors.transparent,
                    border: Border.all(
                      width: 2,
                      color: selected ? RokkamColors.green : RokkamColors.ink.withValues(alpha: 0.2),
                    ),
                  ),
                  child: selected ? const Icon(Icons.check, size: 14, color: Colors.white) : null,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _DeclinedScreen extends StatelessWidget {
  const _DeclinedScreen();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(),
      body: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const Text('🙏', textAlign: TextAlign.center, style: TextStyle(fontSize: 48)),
            const SizedBox(height: 16),
            Text("We can't buy this one", textAlign: TextAlign.center, style: display(size: 26, weight: 700)),
            const SizedBox(height: 12),
            Text(
              "We're unable to complete this purchase. Nothing is wrong with asking — but this device doesn't fit what we can legally buy and resell.",
              textAlign: TextAlign.center,
              style: body(size: 14, color: RokkamColors.slate),
            ),
            const SizedBox(height: 24),
            FilledButton(
              onPressed: () => Navigator.of(context).popUntil((r) => r.isFirst),
              child: const Text('Check a different phone'),
            ),
          ],
        ),
      ),
    );
  }
}
