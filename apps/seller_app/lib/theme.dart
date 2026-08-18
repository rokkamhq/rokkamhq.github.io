import 'package:flutter/material.dart';

/// Rokkam palette — CLAUDE.md §2 (mirrors apps/web globals.css).
abstract final class RokkamColors {
  static const ink = Color(0xFF101418);
  static const paper = Color(0xFFF6F1E7);
  static const sand = Color(0xFFE8DCC8);
  static const green = Color(0xFF0E8F5B);
  static const greenDeep = Color(0xFF0A6B45);
  static const slate = Color(0xFF3B4754);
  static const amber = Color(0xFFE0A400);
  static const brick = Color(0xFFBF4034);
}

/// The bundled fonts are variable TTFs — weight must be set through the
/// `wght` axis, fontWeight alone won't move it.
List<FontVariation> _wght(double w) => [FontVariation('wght', w)];

TextStyle display({double size = 28, double weight = 700, Color color = RokkamColors.ink, double? height}) =>
    TextStyle(
      fontFamily: 'AnekTelugu',
      fontSize: size,
      fontVariations: _wght(weight),
      fontWeight: FontWeight.values[(weight ~/ 100) - 1],
      color: color,
      height: height ?? 1.15,
      letterSpacing: -0.5,
    );

TextStyle body({double size = 15, double weight = 400, Color color = RokkamColors.ink, double? height}) =>
    TextStyle(
      fontFamily: 'Inter',
      fontSize: size,
      fontVariations: _wght(weight),
      fontWeight: FontWeight.values[(weight ~/ 100) - 1],
      color: color,
      height: height ?? 1.45,
    );

TextStyle mono({double size = 14, double weight = 500, Color color = RokkamColors.ink, double? letterSpacing}) =>
    TextStyle(
      fontFamily: 'JetBrainsMono',
      fontSize: size,
      fontVariations: _wght(weight),
      fontWeight: FontWeight.values[(weight ~/ 100) - 1],
      color: color,
      letterSpacing: letterSpacing,
    );

ThemeData rokkamTheme() {
  final base = ThemeData(
    useMaterial3: true,
    colorScheme: ColorScheme.fromSeed(
      seedColor: RokkamColors.green,
      primary: RokkamColors.green,
      surface: RokkamColors.paper,
    ),
    scaffoldBackgroundColor: RokkamColors.paper,
    fontFamily: 'Inter',
  );
  return base.copyWith(
    appBarTheme: AppBarTheme(
      backgroundColor: RokkamColors.paper,
      foregroundColor: RokkamColors.ink,
      elevation: 0,
      scrolledUnderElevation: 0.5,
      centerTitle: false,
      titleTextStyle: display(size: 20, weight: 700),
    ),
    filledButtonTheme: FilledButtonThemeData(
      style: FilledButton.styleFrom(
        backgroundColor: RokkamColors.green,
        foregroundColor: Colors.white,
        shape: const StadiumBorder(),
        padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 16),
        textStyle: body(size: 15, weight: 600, color: Colors.white),
      ),
    ),
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        foregroundColor: RokkamColors.ink,
        side: BorderSide(color: RokkamColors.ink.withValues(alpha: 0.15)),
        shape: const StadiumBorder(),
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
        textStyle: body(size: 15, weight: 600),
      ),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: Colors.white,
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(14),
        borderSide: BorderSide(color: RokkamColors.ink.withValues(alpha: 0.10), width: 2),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(14),
        borderSide: const BorderSide(color: RokkamColors.green, width: 2),
      ),
    ),
  );
}
