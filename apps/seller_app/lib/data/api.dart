// Thin client for the Rokkam API (services/api). The app is fully usable
// offline — every call here has a graceful fallback in the UI (demo quote +
// WhatsApp booking), mirroring apps/web/src/lib/api.ts.

import 'dart:async';
import 'dart:convert';

import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

/// Dev default: the machine running start-dev.bat, reachable over LAN/hotspot.
/// Editable at runtime in the in-app dev settings.
const defaultApiUrl = 'http://192.168.43.125:8000';

const _timeout = Duration(seconds: 6);

class ApiException implements Exception {
  final int status;
  final String message;
  ApiException(this.status, this.message);
  @override
  String toString() => message;
}

class Api {
  static Future<String> baseUrl() async {
    final prefs = await SharedPreferences.getInstance();
    return (prefs.getString('api_url') ?? defaultApiUrl).replaceAll(RegExp(r'/+$'), '');
  }

  static Future<void> setBaseUrl(String url) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('api_url', url.trim());
  }

  static Future<dynamic> _call(
    String path, {
    String method = 'GET',
    Map<String, dynamic>? body,
    String? token,
  }) async {
    final uri = Uri.parse('${await baseUrl()}$path');
    final headers = {
      'Content-Type': 'application/json',
      if (token != null) 'Authorization': 'Bearer $token',
    };
    final res = await (method == 'POST'
            ? http.post(uri, headers: headers, body: jsonEncode(body ?? {}))
            : http.get(uri, headers: headers))
        .timeout(_timeout);
    final decoded = res.body.isEmpty ? {} : jsonDecode(res.body);
    if (res.statusCode >= 400) {
      throw ApiException(res.statusCode, (decoded is Map ? decoded['detail'] : null) ?? 'Something went wrong');
    }
    return decoded;
  }

  static Future<bool> healthy() async {
    try {
      final r = await _call('/health');
      return r['ok'] == true;
    } catch (_) {
      return false;
    }
  }

  static Future<ServerQuote?> createQuote({
    required String category,
    required String modelSlug,
    String? variantLabel,
    Map<String, String>? axisSelection,
    required Map<String, Object> answers,
  }) async {
    try {
      final r = await _call('/quotes', method: 'POST', body: {
        'category': category,
        'model_slug': modelSlug,
        'variant_label': ?variantLabel,
        'axis_selection': ?axisSelection,
        'answers': answers,
        'channel': 'web',
      });
      return r['status'] == 'locked' ? ServerQuote.fromJson(r as Map<String, dynamic>) : null;
    } catch (_) {
      return null; // offline / unreachable → UI falls back to demo quote
    }
  }

  static Future<String?> requestOtp(String phone) async {
    final r = await _call('/auth/otp/request', method: 'POST', body: {'phone': phone});
    return r['dev_code'] as String?;
  }

  static Future<String> verifyOtp(String phone, String code) async {
    final r = await _call('/auth/otp/verify', method: 'POST', body: {'phone': phone, 'code': code});
    return r['token'] as String;
  }

  static Future<SlotsResponse> getSlots(String pincode) async {
    final r = await _call('/slots?pincode=$pincode');
    return SlotsResponse.fromJson(r as Map<String, dynamic>);
  }

  static Future<BookingResult> bookOrder({
    required String quoteCode,
    required String line1,
    String? line2,
    required String pincode,
    required String slotStart,
    required String slotEnd,
    required String token,
  }) async {
    final r = await _call('/orders', method: 'POST', token: token, body: {
      'quote_code': quoteCode,
      'line1': line1,
      'line2': line2 ?? '',
      'pincode': pincode,
      'slot_start': slotStart,
      'slot_end': slotEnd,
    });
    return BookingResult.fromJson(r as Map<String, dynamic>);
  }
}

class ServerQuote {
  final String publicCode, lockedUntil;
  final int finalPriceInr;
  ServerQuote.fromJson(Map<String, dynamic> j)
      : publicCode = j['public_code'] as String,
        lockedUntil = j['locked_until'] as String,
        finalPriceInr = (j['final_price_inr'] as num).toInt();
}

class Slot {
  final String start, end;
  Slot.fromJson(Map<String, dynamic> j)
      : start = j['start'] as String,
        end = j['end'] as String;
}

class SlotsResponse {
  final bool serviceable;
  final String? zoneName, slaLabel;
  final List<Slot> slots;
  SlotsResponse.fromJson(Map<String, dynamic> j)
      : serviceable = j['serviceable'] as bool,
        zoneName = j['zone_name'] as String?,
        slaLabel = j['sla_label'] as String?,
        slots = (j['slots'] as List? ?? const []).map((s) => Slot.fromJson(s as Map<String, dynamic>)).toList();
}

class BookingResult {
  final int orderId, amountInr;
  final String slaLabel, slotStart, slotEnd;
  BookingResult.fromJson(Map<String, dynamic> j)
      : orderId = (j['order_id'] as num).toInt(),
        amountInr = (j['amount_inr'] as num).toInt(),
        slaLabel = j['sla_label'] as String,
        slotStart = j['slot_start'] as String,
        slotEnd = j['slot_end'] as String;
}
