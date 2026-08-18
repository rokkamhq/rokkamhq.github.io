import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:url_launcher/url_launcher.dart';

import '../data/api.dart';
import '../data/catalog.dart';
import '../data/engine.dart';
import '../data/models.dart';
import '../theme.dart';
import '../widgets/ledger.dart';

const _whatsappNumber = '918448348653';

class ResultScreen extends StatefulWidget {
  final Catalog catalog;
  final String categorySlug, deviceLabel, modelSlug;
  final String? variantLabel;
  final Map<String, String>? axisSelection;
  final Answers answers;
  final QuoteResult quote;

  const ResultScreen({
    super.key,
    required this.catalog,
    required this.categorySlug,
    required this.deviceLabel,
    required this.modelSlug,
    this.variantLabel,
    this.axisSelection,
    required this.answers,
    required this.quote,
  });

  @override
  State<ResultScreen> createState() => _ResultScreenState();
}

class _ResultScreenState extends State<ResultScreen> {
  late final String _demoCode = demoQuoteCode();
  late final DateTime _demoLockUntil = DateTime.now().add(const Duration(days: quoteLockDays));
  ServerQuote? _serverQuote;
  bool _copied = false;
  Zone? _zoneMatch;
  bool _zoneChecked = false;
  final _pincodeController = TextEditingController();

  @override
  void initState() {
    super.initState();
    // The server issues the authoritative locked quote when reachable; the
    // local ledger stands in when offline.
    Api.createQuote(
      category: widget.categorySlug,
      modelSlug: widget.modelSlug,
      variantLabel: widget.variantLabel,
      axisSelection: widget.axisSelection,
      answers: widget.answers,
    ).then((sq) {
      if (mounted && sq != null) setState(() => _serverQuote = sq);
    });
  }

  @override
  void dispose() {
    _pincodeController.dispose();
    super.dispose();
  }

  String get _quoteCode => _serverQuote?.publicCode ?? _demoCode;
  int get _finalPrice => _serverQuote?.finalPriceInr ?? widget.quote.finalPriceInr;

  String get _lockUntilLabel {
    final d = _serverQuote != null ? DateTime.parse(_serverQuote!.lockedUntil) : _demoLockUntil;
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July',
        'August', 'September', 'October', 'November', 'December'];
    return '${d.day} ${months[d.month - 1]}';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Your locked price')),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(20, 8, 20, 32),
        children: [
          _priceCard(),
          const SizedBox(height: 20),
          if (_serverQuote != null)
            BookingFlow(quoteCode: _serverQuote!.publicCode, amountInr: _serverQuote!.finalPriceInr)
          else
            _offlineBooking(),
          const SizedBox(height: 20),
          LedgerReceipt(deviceLabel: widget.deviceLabel, quote: widget.quote, animateLines: false),
          const SizedBox(height: 16),
          Center(
            child: TextButton(
              onPressed: () => Navigator.of(context).pop(),
              child: Text('Re-check with different answers',
                  style: body(size: 13, weight: 600, color: RokkamColors.slate)),
            ),
          ),
        ],
      ),
    );
  }

  Widget _priceCard() {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(color: RokkamColors.ink, borderRadius: BorderRadius.circular(24)),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(widget.deviceLabel, style: body(size: 13, color: RokkamColors.sand.withValues(alpha: 0.8))),
          const SizedBox(height: 8),
          TweenAnimationBuilder<double>(
            key: ValueKey(_finalPrice),
            tween: Tween(begin: 0.92, end: 1),
            duration: const Duration(milliseconds: 450),
            curve: Curves.easeOutBack,
            builder: (context, scale, child) =>
                Transform.scale(scale: scale, alignment: Alignment.centerLeft, child: child),
            child: Text(formatInr(_finalPrice), style: mono(size: 42, weight: 800, color: Colors.white)),
          ),
          const SizedBox(height: 8),
          Text('🔒 Locked for $quoteLockDays days against this exact condition report.',
              style: body(size: 13, color: RokkamColors.sand.withValues(alpha: 0.8))),
          const SizedBox(height: 16),
          Container(height: 1, color: Colors.white.withValues(alpha: 0.1)),
          const SizedBox(height: 14),
          Row(
            children: [
              Expanded(
                child: Text.rich(TextSpan(children: [
                  TextSpan(text: 'Quote code: ', style: body(size: 13, color: RokkamColors.sand.withValues(alpha: 0.8))),
                  TextSpan(text: _quoteCode, style: mono(size: 14, weight: 700, color: Colors.white)),
                  TextSpan(
                      text: '\nvalid till $_lockUntilLabel',
                      style: body(size: 12, color: RokkamColors.sand.withValues(alpha: 0.6))),
                ])),
              ),
              OutlinedButton(
                style: OutlinedButton.styleFrom(
                  side: BorderSide(color: Colors.white.withValues(alpha: 0.25)),
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                ),
                onPressed: () {
                  Clipboard.setData(ClipboardData(text: _quoteCode));
                  setState(() => _copied = true);
                  Future.delayed(const Duration(seconds: 2), () {
                    if (mounted) setState(() => _copied = false);
                  });
                },
                child: Text(_copied ? 'Copied ✓' : 'Copy',
                    style: body(size: 12, weight: 600, color: RokkamColors.sand)),
              ),
            ],
          ),
          if (_serverQuote != null) ...[
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
              decoration: BoxDecoration(
                color: RokkamColors.green.withValues(alpha: 0.25),
                borderRadius: BorderRadius.circular(999),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Container(
                      width: 8, height: 8,
                      decoration: const BoxDecoration(color: RokkamColors.green, shape: BoxShape.circle)),
                  const SizedBox(width: 8),
                  Text('Locked on Rokkam servers — the agent app cannot change it.',
                      style: body(size: 11, weight: 600, color: Colors.white)),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _offlineBooking() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(18)),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Check pickup time', style: body(size: 15, weight: 600)),
          const SizedBox(height: 12),
          Row(
            children: [
              SizedBox(
                width: 150,
                child: TextField(
                  controller: _pincodeController,
                  keyboardType: TextInputType.number,
                  maxLength: 6,
                  style: mono(size: 16),
                  decoration: const InputDecoration(hintText: '500081', counterText: ''),
                  onChanged: (_) => setState(() => _zoneChecked = false),
                ),
              ),
              const SizedBox(width: 12),
              OutlinedButton(
                onPressed: _pincodeController.text.length == 6
                    ? () => setState(() {
                          _zoneMatch = widget.catalog.zoneForPincode(_pincodeController.text);
                          _zoneChecked = true;
                        })
                    : null,
                child: const Text('Check'),
              ),
            ],
          ),
          if (_zoneChecked) ...[
            const SizedBox(height: 10),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
              decoration: BoxDecoration(
                color: _zoneMatch != null
                    ? RokkamColors.green.withValues(alpha: 0.1)
                    : RokkamColors.amber.withValues(alpha: 0.15),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Text(
                _zoneMatch != null
                    ? '✅ ${_zoneMatch!.name} — ${_zoneMatch!.slaLabel}'
                    : "Not in your area yet — we're expanding across GHMC first.",
                style: body(size: 13, weight: 500,
                    color: _zoneMatch != null ? RokkamColors.greenDeep : RokkamColors.slate),
              ),
            ),
          ],
          const SizedBox(height: 16),
          FilledButton.icon(
            onPressed: () {
              final text = Uri.encodeComponent(
                  'Hi Rokkam! Quote $_quoteCode: ${widget.deviceLabel} for ${formatInr(_finalPrice)}. '
                  "I'd like to book a pickup.");
              launchUrl(Uri.parse('https://wa.me/$_whatsappNumber?text=$text'),
                  mode: LaunchMode.externalApplication);
            },
            icon: const Icon(Icons.chat),
            label: const Text('Book pickup on WhatsApp'),
          ),
        ],
      ),
    );
  }
}

// ---------------------------------------------------------------------------

class BookingFlow extends StatefulWidget {
  final String quoteCode;
  final int amountInr;
  const BookingFlow({super.key, required this.quoteCode, required this.amountInr});

  @override
  State<BookingFlow> createState() => _BookingFlowState();
}

class _BookingFlowState extends State<BookingFlow> {
  String _step = 'phone'; // phone | otp | address | slot | done
  bool _busy = false;
  String _error = '';
  String? _devCode;
  String _token = '';
  SlotsResponse? _slots;
  ({int orderId, String slot, String sla})? _confirmation;

  final _phone = TextEditingController();
  final _code = TextEditingController();
  final _line1 = TextEditingController();
  final _line2 = TextEditingController();
  final _pincode = TextEditingController();

  @override
  void dispose() {
    for (final c in [_phone, _code, _line1, _line2, _pincode]) {
      c.dispose();
    }
    super.dispose();
  }

  Future<void> _run(Future<void> Function() action) async {
    setState(() {
      _busy = true;
      _error = '';
    });
    try {
      await action();
    } on ApiException catch (e) {
      setState(() => _error = e.message);
    } catch (_) {
      setState(() => _error = 'Network error — is the Rokkam API reachable?');
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  String _fmtSlot(String startIso, String endIso) {
    final start = DateTime.parse(startIso);
    final end = DateTime.parse(endIso);
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    String time(DateTime d) {
      final h = d.hour % 12 == 0 ? 12 : d.hour % 12;
      final m = d.minute.toString().padLeft(2, '0');
      return '$h:$m ${d.hour < 12 ? 'am' : 'pm'}';
    }

    return '${days[start.weekday - 1]}, ${start.day} ${months[start.month - 1]}, ${time(start)} – ${time(end)}';
  }

  @override
  Widget build(BuildContext context) {
    if (_step == 'done' && _confirmation != null) return _doneCard();

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(18)),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Book your pickup', style: body(size: 15, weight: 600)),
          const SizedBox(height: 14),
          ...switch (_step) {
            'phone' => _phoneStep(),
            'otp' => _otpStep(),
            'address' => _addressStep(),
            _ => _slotStep(),
          },
          if (_error.isNotEmpty) ...[
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              decoration: BoxDecoration(
                color: RokkamColors.brick.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Text(_error, style: body(size: 13, weight: 500, color: RokkamColors.brick)),
            ),
          ],
        ],
      ),
    );
  }

  List<Widget> _phoneStep() => [
        Text('Your mobile number', style: body(size: 13, color: RokkamColors.slate)),
        const SizedBox(height: 8),
        TextField(
          controller: _phone,
          keyboardType: TextInputType.phone,
          maxLength: 10,
          decoration: const InputDecoration(hintText: '98765 43210', counterText: ''),
          onChanged: (_) => setState(() {}),
        ),
        const SizedBox(height: 12),
        FilledButton(
          onPressed: _busy || _phone.text.length != 10
              ? null
              : () => _run(() async {
                    _devCode = await Api.requestOtp(_phone.text);
                    setState(() => _step = 'otp');
                  }),
          child: const Text('Send OTP'),
        ),
      ];

  List<Widget> _otpStep() => [
        Text('Enter the 6-digit code sent to ${_phone.text}', style: body(size: 13, color: RokkamColors.slate)),
        if (_devCode != null) ...[
          const SizedBox(height: 8),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            decoration: BoxDecoration(
              color: RokkamColors.amber.withValues(alpha: 0.15),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Text('dev mode — code: $_devCode', style: mono(size: 12, color: RokkamColors.slate)),
          ),
        ],
        const SizedBox(height: 8),
        TextField(
          controller: _code,
          keyboardType: TextInputType.number,
          maxLength: 6,
          style: mono(size: 18, letterSpacing: 8),
          decoration: const InputDecoration(hintText: '••••••', counterText: ''),
          onChanged: (_) => setState(() {}),
        ),
        const SizedBox(height: 12),
        FilledButton(
          onPressed: _busy || _code.text.length != 6
              ? null
              : () => _run(() async {
                    _token = await Api.verifyOtp(_phone.text, _code.text);
                    setState(() => _step = 'address');
                  }),
          child: const Text('Verify'),
        ),
      ];

  List<Widget> _addressStep() => [
        TextField(
          controller: _line1,
          decoration: const InputDecoration(hintText: 'Flat / house, street, area'),
          onChanged: (_) => setState(() {}),
        ),
        const SizedBox(height: 10),
        TextField(controller: _line2, decoration: const InputDecoration(hintText: 'Landmark (optional)')),
        const SizedBox(height: 10),
        SizedBox(
          width: 170,
          child: TextField(
            controller: _pincode,
            keyboardType: TextInputType.number,
            maxLength: 6,
            style: mono(size: 15),
            decoration: const InputDecoration(hintText: 'Pincode', counterText: ''),
            onChanged: (_) => setState(() {}),
          ),
        ),
        const SizedBox(height: 12),
        FilledButton(
          onPressed: _busy || _line1.text.trim().isEmpty || _pincode.text.length != 6
              ? null
              : () => _run(() async {
                    final info = await Api.getSlots(_pincode.text);
                    if (!info.serviceable) {
                      setState(() => _error = "Not in your area yet — we're expanding across GHMC first.");
                      return;
                    }
                    setState(() {
                      _slots = info;
                      _step = 'slot';
                    });
                  }),
          child: const Text('Find pickup slots'),
        ),
      ];

  List<Widget> _slotStep() => [
        Text('✅ ${_slots!.zoneName} — ${_slots!.slaLabel}',
            style: body(size: 13, weight: 600, color: RokkamColors.greenDeep)),
        const SizedBox(height: 10),
        for (final slot in _slots!.slots)
          Padding(
            padding: const EdgeInsets.only(bottom: 8),
            child: OutlinedButton(
              style: OutlinedButton.styleFrom(
                alignment: Alignment.centerLeft,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
              onPressed: _busy
                  ? null
                  : () => _run(() async {
                        final booking = await Api.bookOrder(
                          quoteCode: widget.quoteCode,
                          line1: _line1.text,
                          line2: _line2.text,
                          pincode: _pincode.text,
                          slotStart: slot.start,
                          slotEnd: slot.end,
                          token: _token,
                        );
                        setState(() {
                          _confirmation = (
                            orderId: booking.orderId,
                            slot: _fmtSlot(booking.slotStart, booking.slotEnd),
                            sla: booking.slaLabel,
                          );
                          _step = 'done';
                        });
                      }),
              child: Text(_fmtSlot(slot.start, slot.end), style: body(size: 13, weight: 500)),
            ),
          ),
      ];

  Widget _doneCard() {
    const nextSteps = [
      "An agent is assigned to your slot — you'll get their name by SMS/WhatsApp.",
      'At your door they run the exact checklist you just answered. Match = locked price, no haggling.',
      'IMEI is screened against the national CEIR registry before payment.',
      'UPI hits your account before the agent leaves. Your data-wipe certificate follows.',
    ];
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: RokkamColors.green.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: RokkamColors.green.withValues(alpha: 0.3)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Pickup booked ✅', style: display(size: 20, weight: 700, color: RokkamColors.greenDeep)),
          const SizedBox(height: 8),
          Text.rich(TextSpan(children: [
            TextSpan(text: 'Your order number is ', style: body(size: 13, color: RokkamColors.slate)),
            TextSpan(text: '#${_confirmation!.orderId}', style: mono(size: 13, weight: 700)),
          ])),
          const SizedBox(height: 4),
          Text('${_confirmation!.slot} · ${_confirmation!.sla}', style: body(size: 13, weight: 600)),
          const SizedBox(height: 8),
          Text.rich(TextSpan(children: [
            TextSpan(text: 'Agent pays you via UPI on verification: ', style: body(size: 13, color: RokkamColors.slate)),
            TextSpan(text: formatInr(widget.amountInr), style: mono(size: 13, weight: 700, color: RokkamColors.greenDeep)),
          ])),
          const SizedBox(height: 16),
          Container(height: 1, color: RokkamColors.green.withValues(alpha: 0.2)),
          const SizedBox(height: 12),
          Text('WHAT HAPPENS NEXT', style: mono(size: 10, weight: 700, color: RokkamColors.slate, letterSpacing: 2)),
          const SizedBox(height: 10),
          for (final (i, step) in nextSteps.indexed)
            Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    width: 20,
                    height: 20,
                    alignment: Alignment.center,
                    decoration: BoxDecoration(
                      color: RokkamColors.green.withValues(alpha: 0.15),
                      shape: BoxShape.circle,
                    ),
                    child: Text('${i + 1}', style: mono(size: 10, weight: 700, color: RokkamColors.greenDeep)),
                  ),
                  const SizedBox(width: 10),
                  Expanded(child: Text(step, style: body(size: 13, color: RokkamColors.slate))),
                ],
              ),
            ),
        ],
      ),
    );
  }
}
