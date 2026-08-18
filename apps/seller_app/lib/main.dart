import 'package:flutter/material.dart';

import 'data/catalog.dart';
import 'screens/home.dart';
import 'theme.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const RokkamApp());
}

class RokkamApp extends StatelessWidget {
  const RokkamApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Rokkam',
      debugShowCheckedModeBanner: false,
      theme: rokkamTheme(),
      home: const _Boot(),
    );
  }
}

/// Loads the bundled seed catalog before showing the app.
class _Boot extends StatelessWidget {
  const _Boot();

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<Catalog>(
      future: Catalog.load(),
      builder: (context, snapshot) {
        if (snapshot.hasError) {
          return Scaffold(
            body: Center(
              child: Text('Failed to load catalog:\n${snapshot.error}',
                  textAlign: TextAlign.center, style: body(size: 14, color: RokkamColors.brick)),
            ),
          );
        }
        if (!snapshot.hasData) {
          return const Scaffold(
            body: Center(child: CircularProgressIndicator(color: RokkamColors.green)),
          );
        }
        return HomeScreen(catalog: snapshot.data!);
      },
    );
  }
}
