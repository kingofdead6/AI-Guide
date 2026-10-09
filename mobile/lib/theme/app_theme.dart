import 'package:flutter/cupertino.dart' show CupertinoPageTransitionsBuilder;
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../state/appearance_store.dart';
import 'palettes.dart';

/// Applies a Google Font if it is available, otherwise keeps the platform font.
TextStyle fontStyle(String? family, [TextStyle base = const TextStyle()]) {
  if (family == null) return base;
  try {
    return GoogleFonts.getFont(family, textStyle: base);
  } catch (_) {
    return base;
  }
}

/// Everything widgets need beyond Material's ColorScheme: the full palette, fonts and motion choice.
class Look extends ThemeExtension<Look> {
  final Palette p;
  final String? uiFamily;
  final String? readingFamily;
  final String? codeFamily;
  final double readingScale;
  final bool reduceMotion;

  const Look({required this.p, this.uiFamily, this.readingFamily, this.codeFamily, this.readingScale = 1, this.reduceMotion = false});

  TextStyle reading([TextStyle base = const TextStyle()]) => fontStyle(readingFamily ?? uiFamily, base);
  TextStyle code([TextStyle base = const TextStyle()]) => fontStyle(codeFamily, base.copyWith(fontFamilyFallback: const ['monospace']));
  Duration d(int ms) => reduceMotion ? Duration.zero : Duration(milliseconds: ms);

  @override
  Look copyWith() => this;

  @override
  Look lerp(Look? other, double t) => t < 0.5 ? this : (other ?? this);
}

extension LookX on BuildContext {
  Look get look => Theme.of(this).extension<Look>()!;
  Palette get pal => look.p;
}

ThemeData buildTheme(AppearanceStore a, bool dark) {
  final p = buildPalette(a.palette, dark);
  final ui = fontById(uiFonts, a.uiFont).family;
  final reading = fontById(readingFonts, a.readingFont).family;
  final code = fontById(codeFonts, a.codeFont).family;

  final scheme = ColorScheme(
    brightness: dark ? Brightness.dark : Brightness.light,
    primary: p.accent,
    onPrimary: p.onAccent,
    primaryContainer: p.accentSoft,
    onPrimaryContainer: p.accentInk,
    secondary: p.grad[1],
    onSecondary: p.onAccent,
    tertiary: p.grad[2],
    onTertiary: p.onAccent,
    error: p.bad,
    onError: p.onAccent,
    errorContainer: p.badSoft,
    onErrorContainer: p.bad,
    surface: p.surface,
    onSurface: p.text,
    onSurfaceVariant: p.muted,
    surfaceContainerLowest: p.bg,
    surfaceContainerLow: p.bg,
    surfaceContainer: p.surface,
    surfaceContainerHigh: p.sunk,
    surfaceContainerHighest: p.sunk,
    outline: p.borderStrong,
    outlineVariant: p.border,
    shadow: Colors.black,
    inverseSurface: p.text,
    onInverseSurface: p.bg,
    inversePrimary: p.accentSoft,
  );

  final base = ThemeData(useMaterial3: true, colorScheme: scheme, brightness: scheme.brightness);
  var text = base.textTheme.apply(bodyColor: p.text, displayColor: p.text);
  if (ui != null) {
    // getFont registers the family with the engine and starts the download.
    final family = fontStyle(ui).fontFamily;
    if (family != null) text = text.apply(fontFamily: family);
  }
  text = text.copyWith(
    displaySmall: text.displaySmall?.copyWith(fontWeight: FontWeight.w800, letterSpacing: -1.2, height: 1.05),
    headlineMedium: text.headlineMedium?.copyWith(fontWeight: FontWeight.w800, letterSpacing: -0.8, height: 1.1),
    headlineSmall: text.headlineSmall?.copyWith(fontWeight: FontWeight.w800, letterSpacing: -0.5, height: 1.15),
    titleLarge: text.titleLarge?.copyWith(fontWeight: FontWeight.w700, letterSpacing: -0.3),
    titleMedium: text.titleMedium?.copyWith(fontWeight: FontWeight.w700),
    titleSmall: text.titleSmall?.copyWith(fontWeight: FontWeight.w700),
    bodyMedium: text.bodyMedium?.copyWith(height: 1.45),
    bodySmall: text.bodySmall?.copyWith(color: p.muted, height: 1.4),
    labelLarge: text.labelLarge?.copyWith(fontWeight: FontWeight.w700),
  );

  final radius = BorderRadius.circular(14);
  return base.copyWith(
    scaffoldBackgroundColor: p.bg,
    textTheme: text,
    extensions: [Look(p: p, uiFamily: ui, readingFamily: reading, codeFamily: code, readingScale: a.readingScale, reduceMotion: a.reduceMotion)],
    appBarTheme: AppBarTheme(
      backgroundColor: p.bg,
      foregroundColor: p.text,
      surfaceTintColor: Colors.transparent,
      elevation: 0,
      scrolledUnderElevation: 0.5,
      centerTitle: false,
      titleTextStyle: text.titleLarge?.copyWith(fontSize: 19, fontWeight: FontWeight.w700),
    ),
    segmentedButtonTheme: SegmentedButtonThemeData(
      style: ButtonStyle(
        backgroundColor: WidgetStateProperty.resolveWith((s) => s.contains(WidgetState.selected) ? p.accentSoft : p.surface),
        foregroundColor: WidgetStateProperty.resolveWith((s) => s.contains(WidgetState.selected) ? p.accentInk : p.text),
        iconColor: WidgetStateProperty.resolveWith((s) => s.contains(WidgetState.selected) ? p.accentInk : p.muted),
        side: WidgetStatePropertyAll(BorderSide(color: p.borderStrong)),
        textStyle: WidgetStatePropertyAll(text.labelLarge),
      ),
    ),
    cardTheme: CardThemeData(
      color: p.surface,
      surfaceTintColor: Colors.transparent,
      elevation: 0,
      margin: EdgeInsets.zero,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18), side: BorderSide(color: p.border)),
    ),
    dividerTheme: DividerThemeData(color: p.border, space: 1, thickness: 1),
    navigationBarTheme: NavigationBarThemeData(
      backgroundColor: p.surface,
      surfaceTintColor: Colors.transparent,
      indicatorColor: p.accentSoft,
      elevation: 0,
      height: 68,
      labelTextStyle: WidgetStateProperty.resolveWith(
        (s) => text.labelMedium!.copyWith(fontWeight: s.contains(WidgetState.selected) ? FontWeight.w700 : FontWeight.w500, color: s.contains(WidgetState.selected) ? p.accentInk : p.muted),
      ),
      iconTheme: WidgetStateProperty.resolveWith((s) => IconThemeData(color: s.contains(WidgetState.selected) ? p.accentInk : p.muted)),
    ),
    filledButtonTheme: FilledButtonThemeData(
      style: FilledButton.styleFrom(
        backgroundColor: p.accent,
        foregroundColor: p.onAccent,
        disabledBackgroundColor: p.sunk,
        minimumSize: const Size(48, 50),
        padding: const EdgeInsets.symmetric(horizontal: 20),
        shape: RoundedRectangleBorder(borderRadius: radius),
        textStyle: text.labelLarge?.copyWith(fontSize: 15.5),
      ),
    ),
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        foregroundColor: p.text,
        side: BorderSide(color: p.borderStrong),
        minimumSize: const Size(48, 50),
        padding: const EdgeInsets.symmetric(horizontal: 18),
        shape: RoundedRectangleBorder(borderRadius: radius),
        textStyle: text.labelLarge?.copyWith(fontSize: 15.5),
      ),
    ),
    textButtonTheme: TextButtonThemeData(style: TextButton.styleFrom(foregroundColor: p.accent, textStyle: text.labelLarge)),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: p.bg,
      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
      border: OutlineInputBorder(borderRadius: radius, borderSide: BorderSide(color: p.borderStrong)),
      enabledBorder: OutlineInputBorder(borderRadius: radius, borderSide: BorderSide(color: p.borderStrong)),
      focusedBorder: OutlineInputBorder(borderRadius: radius, borderSide: BorderSide(color: p.accent, width: 2)),
      errorBorder: OutlineInputBorder(borderRadius: radius, borderSide: BorderSide(color: p.bad)),
      hintStyle: TextStyle(color: p.muted),
      labelStyle: TextStyle(color: p.muted),
    ),
    chipTheme: ChipThemeData(
      backgroundColor: p.surface,
      selectedColor: p.text,
      side: BorderSide(color: p.border),
      shape: const StadiumBorder(),
      labelStyle: text.labelLarge!.copyWith(fontWeight: FontWeight.w600),
      secondaryLabelStyle: text.labelLarge!.copyWith(color: p.bg, fontWeight: FontWeight.w700),
      checkmarkColor: p.bg,
    ),
    snackBarTheme: SnackBarThemeData(behavior: SnackBarBehavior.floating, backgroundColor: p.text, contentTextStyle: TextStyle(color: p.bg), shape: RoundedRectangleBorder(borderRadius: radius)),
    dialogTheme: DialogThemeData(backgroundColor: p.surface, surfaceTintColor: Colors.transparent, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(22))),
    bottomSheetTheme: BottomSheetThemeData(backgroundColor: p.surface, surfaceTintColor: Colors.transparent),
    progressIndicatorTheme: ProgressIndicatorThemeData(color: p.accent, linearTrackColor: p.sunk),
    sliderTheme: SliderThemeData(activeTrackColor: p.accent, thumbColor: p.accent, inactiveTrackColor: p.sunk),
    switchTheme: SwitchThemeData(
      trackColor: WidgetStateProperty.resolveWith((s) => s.contains(WidgetState.selected) ? p.accent : p.borderStrong),
      thumbColor: const WidgetStatePropertyAll(Colors.white),
      trackOutlineColor: const WidgetStatePropertyAll(Colors.transparent),
    ),
    pageTransitionsTheme: PageTransitionsTheme(
      builders: {
        TargetPlatform.android: a.reduceMotion ? const _NoTransition() : const FadeForwardsPageTransitionsBuilder(),
        TargetPlatform.iOS: a.reduceMotion ? const _NoTransition() : const CupertinoPageTransitionsBuilder(),
      },
    ),
  );
}

class _NoTransition extends PageTransitionsBuilder {
  const _NoTransition();
  @override
  Widget buildTransitions<T>(PageRoute<T> route, BuildContext context, Animation<double> a, Animation<double> b, Widget child) => child;
}
