import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';

import 'screens/admin/admin_shell.dart';
import 'screens/main_shell.dart';
import 'screens/welcome_screen.dart';
import 'state/appearance_store.dart';
import 'state/auth_store.dart';
import 'state/progress_store.dart';
import 'theme/app_theme.dart';
import 'widgets/ui.dart';

class AcademyApp extends StatefulWidget {
  const AcademyApp({super.key});

  @override
  State<AcademyApp> createState() => _AcademyAppState();
}

class _AcademyAppState extends State<AcademyApp> with WidgetsBindingObserver {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState s) {
    // Save pending progress when the app goes to the background.
    if (s == AppLifecycleState.paused || s == AppLifecycleState.hidden) context.read<AuthStore>().flush();
  }

  @override
  Widget build(BuildContext context) {
    final look = context.watch<AppearanceStore>();
    final mode = context.select<ProgressStore, String>((p) => p.theme);
    return MaterialApp(
      title: 'The AI Guide Academy',
      debugShowCheckedModeBanner: false,
      theme: buildTheme(look, false),
      darkTheme: buildTheme(look, true),
      themeMode: switch (mode) { 'light' => ThemeMode.light, 'dark' => ThemeMode.dark, _ => ThemeMode.system },
      builder: (context, child) {
        final p = context.pal;
        return AnnotatedRegion<SystemUiOverlayStyle>(
          value: (p.dark ? SystemUiOverlayStyle.light : SystemUiOverlayStyle.dark).copyWith(statusBarColor: Colors.transparent, systemNavigationBarColor: p.surface),
          child: child!,
        );
      },
      home: const Root(),
    );
  }
}

/// Picks the right shell: splash while restoring a session, the admin area for admins,
/// the welcome screen on first launch, and the learning app otherwise.
class Root extends StatelessWidget {
  const Root({super.key});

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthStore>();
    final Widget child;
    if (!auth.ready && auth.user == null) {
      child = const _Splash();
    } else if (auth.user?.isAdmin == true) {
      child = const AdminShell(key: ValueKey('admin'));
    } else if (auth.user == null && !auth.onboarded) {
      child = const WelcomeScreen(key: ValueKey('welcome'));
    } else {
      child = const MainShell(key: ValueKey('main'));
    }
    return AnimatedSwitcher(duration: context.look.d(450), switchInCurve: Curves.easeOutCubic, child: child);
  }
}

class _Splash extends StatelessWidget {
  const _Splash();

  @override
  Widget build(BuildContext context) => Scaffold(
        body: GlowBackground(
          child: Center(
            child: Column(mainAxisSize: MainAxisSize.min, children: [
              const AppLogo(size: 64),
              const SizedBox(height: 18),
              SizedBox(width: 120, child: LinearProgressIndicator(borderRadius: BorderRadius.circular(4))),
            ]),
          ),
        ),
      );
}

/// The academy logo (same drawing as the website's header).
class AppLogo extends StatelessWidget {
  final double size;
  const AppLogo({super.key, this.size = 34});

  @override
  Widget build(BuildContext context) {
    final p = context.pal;
    return SizedBox(width: size, height: size, child: CustomPaint(painter: _LogoPainter(p.accent, p.surface)));
  }
}

class _LogoPainter extends CustomPainter {
  final Color bg, fg;
  _LogoPainter(this.bg, this.fg);

  @override
  void paint(Canvas canvas, Size s) {
    final k = s.width / 32;
    canvas.drawRRect(RRect.fromRectAndRadius(Offset.zero & s, Radius.circular(8 * k)), Paint()..color = bg);
    final line = Paint()
      ..color = fg
      ..strokeWidth = 1.6 * k;
    canvas.drawLine(Offset(12.6 * k, 12.2 * k), Offset(19 * k, 15 * k), line);
    canvas.drawLine(Offset(12.6 * k, 19.8 * k), Offset(19 * k, 17 * k), line);
    canvas.drawCircle(Offset(10 * k, 11 * k), 3 * k, Paint()..color = fg);
    canvas.drawCircle(Offset(10 * k, 21 * k), 3 * k, Paint()..color = fg);
    canvas.drawCircle(Offset(22 * k, 16 * k), 3.6 * k, Paint()..color = const Color(0xFFF5A84A));
  }

  @override
  bool shouldRepaint(_LogoPainter o) => o.bg != bg || o.fg != fg;
}
