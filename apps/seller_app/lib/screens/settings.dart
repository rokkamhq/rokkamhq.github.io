import 'package:flutter/material.dart';

import '../data/api.dart';
import '../theme.dart';

/// Dev settings — point the app at whichever machine runs the Rokkam API.
/// The app works fully offline (demo quotes + WhatsApp) when unreachable.
class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  final _controller = TextEditingController();
  String _status = '';
  bool _busy = false;

  @override
  void initState() {
    super.initState();
    Api.baseUrl().then((url) {
      if (mounted) setState(() => _controller.text = url);
    });
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  Future<void> _saveAndTest() async {
    setState(() {
      _busy = true;
      _status = '';
    });
    await Api.setBaseUrl(_controller.text);
    final ok = await Api.healthy();
    if (mounted) {
      setState(() {
        _busy = false;
        _status = ok
            ? '✅ API reachable — server quotes and booking are live.'
            : '⚠️ Not reachable — the app will use demo quotes + WhatsApp booking.';
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Dev settings')),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          Text('Rokkam API URL', style: body(size: 15, weight: 600)),
          const SizedBox(height: 6),
          Text(
            'The machine running start-dev.bat, reachable from this phone '
            '(same Wi-Fi/hotspot). Leave unreachable to demo offline mode.',
            style: body(size: 13, color: RokkamColors.slate),
          ),
          const SizedBox(height: 14),
          TextField(
            controller: _controller,
            keyboardType: TextInputType.url,
            autocorrect: false,
            style: mono(size: 14),
            decoration: const InputDecoration(hintText: defaultApiUrl),
          ),
          const SizedBox(height: 14),
          Row(
            children: [
              FilledButton(
                onPressed: _busy ? null : _saveAndTest,
                child: Text(_busy ? 'Testing…' : 'Save & test'),
              ),
              const SizedBox(width: 12),
              OutlinedButton(
                onPressed: _busy
                    ? null
                    : () {
                        _controller.text = defaultApiUrl;
                        _saveAndTest();
                      },
                child: const Text('Reset'),
              ),
            ],
          ),
          if (_status.isNotEmpty) ...[
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(14),
              ),
              child: Text(_status, style: body(size: 13, weight: 500)),
            ),
          ],
          const SizedBox(height: 28),
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: RokkamColors.sand.withValues(alpha: 0.6),
              borderRadius: BorderRadius.circular(14),
            ),
            child: Text(
              'Demo build. Catalog, deduction rules and zone maps are bundled '
              'from the repo seeds — the full quote flow works with no network at all. '
              'With the API reachable, quotes lock server-side and OTP booking goes live.',
              style: body(size: 12, color: RokkamColors.slate),
            ),
          ),
        ],
      ),
    );
  }
}
