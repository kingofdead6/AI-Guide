import 'dart:math' as math;

import 'package:flutter/material.dart';

/// Port of client/src/lib/themes.ts: the same 20 themes, generated from the same OKLCH parameters.
class ThemeDef {
  final String id, name, blurb;
  final double h, c, h2, h3, nh, nc, al;
  const ThemeDef(this.id, this.name, this.blurb, {required this.h, required this.c, required this.h2, required this.h3, required this.nh, required this.nc, this.al = 0.52});
}

const defaultThemeId = 'indigo';

const themes = <ThemeDef>[
  ThemeDef('indigo', 'Indigo', 'The academy default', h: 277, c: 0.21, h2: 305, h3: 15, nh: 280, nc: 0.012),
  ThemeDef('ocean', 'Ocean', 'Deep blue and teal', h: 245, c: 0.17, h2: 215, h3: 185, nh: 235, nc: 0.014),
  ThemeDef('forest', 'Forest', 'Calm greens', h: 152, c: 0.15, h2: 130, h3: 95, nh: 150, nc: 0.012, al: 0.5),
  ThemeDef('sunset', 'Sunset', 'Warm orange into pink', h: 40, c: 0.18, h2: 15, h3: 350, nh: 50, nc: 0.012, al: 0.58),
  ThemeDef('rose', 'Rose', 'Soft and rosy', h: 5, c: 0.19, h2: 340, h3: 20, nh: 10, nc: 0.012),
  ThemeDef('lavender', 'Lavender', 'Gentle purples', h: 300, c: 0.16, h2: 280, h3: 330, nh: 300, nc: 0.016),
  ThemeDef('mint', 'Mint', 'Fresh teal and green', h: 178, c: 0.13, h2: 160, h3: 200, nh: 180, nc: 0.012),
  ThemeDef('honey', 'Honey', 'Golden amber', h: 70, c: 0.16, h2: 55, h3: 35, nh: 75, nc: 0.016, al: 0.54),
  ThemeDef('crimson', 'Crimson', 'Bold reds', h: 25, c: 0.21, h2: 10, h3: 45, nh: 20, nc: 0.01, al: 0.53),
  ThemeDef('nord', 'Nord', 'Arctic blue-greys', h: 235, c: 0.09, h2: 200, h3: 175, nh: 240, nc: 0.022),
  ThemeDef('dracula', 'Dracula', 'Purple and pink night', h: 305, c: 0.19, h2: 345, h3: 190, nh: 290, nc: 0.035),
  ThemeDef('solarized', 'Solarized', 'Classic paper and blue', h: 240, c: 0.13, h2: 195, h3: 85, nh: 90, nc: 0.03, al: 0.55),
  ThemeDef('coffee', 'Coffee', 'Roasted browns', h: 55, c: 0.1, h2: 40, h3: 75, nh: 60, nc: 0.025, al: 0.5),
  ThemeDef('cyber', 'Cyberpunk', 'Neon magenta and cyan', h: 330, c: 0.26, h2: 290, h3: 200, nh: 285, nc: 0.03),
  ThemeDef('sakura', 'Sakura', 'Cherry blossom pink', h: 350, c: 0.14, h2: 320, h3: 25, nh: 350, nc: 0.018, al: 0.58),
  ThemeDef('aurora', 'Aurora', 'Northern lights', h: 165, c: 0.15, h2: 220, h3: 300, nh: 230, nc: 0.02),
  ThemeDef('grape', 'Grape', 'Rich violet', h: 290, c: 0.22, h2: 270, h3: 320, nh: 290, nc: 0.014, al: 0.48),
  ThemeDef('sky', 'Sky', 'Bright and airy blue', h: 230, c: 0.15, h2: 250, h3: 200, nh: 225, nc: 0.01, al: 0.53),
  ThemeDef('lime', 'Lime', 'Zesty yellow-green', h: 128, c: 0.17, h2: 105, h3: 160, nh: 120, nc: 0.012, al: 0.55),
  ThemeDef('mono', 'Monochrome', 'Pure greys, no distractions', h: 260, c: 0, h2: 260, h3: 260, nh: 260, nc: 0, al: 0.3),
];

ThemeDef themeById(String id) => themes.firstWhere((t) => t.id == id, orElse: () => themes.first);

/// OKLCH to sRGB, clamped.
Color oklch(double l, double c, double h) {
  final a = c * math.cos(h * math.pi / 180), b = c * math.sin(h * math.pi / 180);
  final l_ = math.pow(l + 0.3963377774 * a + 0.2158037573 * b, 3).toDouble();
  final m_ = math.pow(l - 0.1055613458 * a - 0.0638541728 * b, 3).toDouble();
  final s_ = math.pow(l - 0.0894841775 * a - 1.291485548 * b, 3).toDouble();
  double enc(double x) {
    x = x.clamp(0.0, 1.0);
    return x <= 0.0031308 ? 12.92 * x : 1.055 * math.pow(x, 1 / 2.4) - 0.055;
  }

  final r = enc(4.0767416621 * l_ - 3.3077115913 * m_ + 0.2309699292 * s_);
  final g = enc(-1.2684380046 * l_ + 2.6097574011 * m_ - 0.3413193965 * s_);
  final bl = enc(-0.0041960863 * l_ - 0.7034186147 * m_ + 1.707614701 * s_);
  return Color.fromARGB(255, (r * 255).round(), (g * 255).round(), (bl * 255).round());
}

/// Every colour the app uses. Matches the CSS tokens in client/src/index.css.
class Palette {
  final bool dark;
  final Color bg, surface, sunk, text, muted, border, borderStrong;
  final Color accent, accentInk, accentSoft, onAccent;
  final Color ok, okSoft, bad, badSoft, warn, warnSoft;
  final List<Color> course; // c1..c5
  final List<Color> courseSoft;
  final List<Color> grad;
  final Color codeBg, figBg, fline, fstroke;
  final List<Color> blobs;

  const Palette({
    required this.dark,
    required this.bg,
    required this.surface,
    required this.sunk,
    required this.text,
    required this.muted,
    required this.border,
    required this.borderStrong,
    required this.accent,
    required this.accentInk,
    required this.accentSoft,
    required this.onAccent,
    required this.ok,
    required this.okSoft,
    required this.bad,
    required this.badSoft,
    required this.warn,
    required this.warnSoft,
    required this.course,
    required this.courseSoft,
    required this.grad,
    required this.codeBg,
    required this.figBg,
    required this.fline,
    required this.fstroke,
    required this.blobs,
  });

  LinearGradient get gradient => LinearGradient(colors: grad, begin: Alignment.topLeft, end: Alignment.bottomRight);

  Color courseColor(String key) => course[(int.tryParse(key.replaceAll('c', '')) ?? 1) - 1];
  Color courseSoftColor(String key) => courseSoft[(int.tryParse(key.replaceAll('c', '')) ?? 1) - 1];

  /// CSS custom properties for the lesson WebView, so lessons follow the app theme.
  Map<String, Color> get cssVars => {
        '--bg': bg,
        '--surface': surface,
        '--sunk': sunk,
        '--text': text,
        '--muted': muted,
        '--border': border,
        '--border-strong': borderStrong,
        '--accent': accent,
        '--accent-ink': accentInk,
        '--accent-soft': accentSoft,
        '--ok': ok,
        '--ok-soft': okSoft,
        '--bad': bad,
        '--bad-soft': badSoft,
        '--warn': warn,
        '--warn-soft': warnSoft,
        '--c1': course[0],
        '--c2': course[1],
        '--c3': course[2],
        '--c4': course[3],
        '--c5': course[4],
        '--c1s': courseSoft[0],
        '--c2s': courseSoft[1],
        '--c3s': courseSoft[2],
        '--c4s': courseSoft[3],
        '--c5s': courseSoft[4],
        '--fline': fline,
        '--fstroke': fstroke,
        '--fig-bg': figBg,
        '--code-bg': codeBg,
      };
}

Color _h(int v) => Color(0xFF000000 | v);

const _lightFixed = (
  ok: 0x0e8f5b, okSoft: 0xe0f5ec, bad: 0xd43c4c, badSoft: 0xfde8ea, warn: 0xc06a0a, warnSoft: 0xfdf0e1,
  c: [0x5145e5, 0xe07612, 0x0e9a6a, 0x9b3fd9, 0xe0365a], cs: [0xeeedfd, 0xfdf0e2, 0xe0f5ec, 0xf4e9fc, 0xfde7ec],
  fline: 0x7a7c8a, fstroke: 0xcfd0dd,
);
const _darkFixed = (
  ok: 0x3fcf8e, okSoft: 0x0f2a1f, bad: 0xff7a85, badSoft: 0x3a1a20, warn: 0xf5a84a, warnSoft: 0x33240f,
  c: [0x8c87ff, 0xf5a84a, 0x3fcf8e, 0xc58bfa, 0xff7a95], cs: [0x1f1d42, 0x36260f, 0x0f2c21, 0x2c1d40, 0x3a1a24],
  fline: 0x9496a6, fstroke: 0x393a50,
);

Palette buildPalette(String themeId, bool dark) {
  final f = dark ? _darkFixed : _lightFixed;
  final ok = _h(f.ok), okSoft = _h(f.okSoft), bad = _h(f.bad), badSoft = _h(f.badSoft), warn = _h(f.warn), warnSoft = _h(f.warnSoft);
  final course = f.c.map(_h).toList(), courseSoft = f.cs.map(_h).toList();
  final onAccent = dark ? _h(0x0a0a12) : Colors.white;

  if (themeId == defaultThemeId) {
    // The hand-tuned default palette from index.css.
    return dark
        ? Palette(dark: true, bg: _h(0x0a0a12), surface: _h(0x13131f), sunk: _h(0x07070d), text: _h(0xececf4), muted: _h(0x9c9db3), border: _h(0x24253a), borderStrong: _h(0x35364f), accent: _h(0x8c87ff), accentInk: _h(0xb3b0ff), accentSoft: _h(0x1d1b3d), onAccent: onAccent, ok: ok, okSoft: okSoft, bad: bad, badSoft: badSoft, warn: warn, warnSoft: warnSoft, course: course, courseSoft: courseSoft, grad: [_h(0x8c87ff), _h(0xc58bfa), _h(0xff8aa0)], codeBg: _h(0x07070d), figBg: _h(0x10101b), fline: _h(f.fline), fstroke: _h(f.fstroke), blobs: [_h(0x2e2a8c), _h(0x4d2a80), _h(0x6b2440)])
        : Palette(dark: false, bg: _h(0xf6f6fa), surface: Colors.white, sunk: _h(0xeeeef5), text: _h(0x14141f), muted: _h(0x5c5f72), border: _h(0xe3e3ee), borderStrong: _h(0xc9cada), accent: _h(0x5145e5), accentInk: _h(0x3b30b8), accentSoft: _h(0xeeedfd), onAccent: onAccent, ok: ok, okSoft: okSoft, bad: bad, badSoft: badSoft, warn: warn, warnSoft: warnSoft, course: course, courseSoft: courseSoft, grad: [_h(0x5145e5), _h(0xa23fd9), _h(0xec4f6f)], codeBg: _h(0x12121e), figBg: _h(0xfbfbfe), fline: _h(f.fline), fstroke: _h(f.fstroke), blobs: [_h(0xa7a2ff), _h(0xe2b6ff), _h(0xffc2cf)]);
  }

  final t = themeById(themeId);
  final h = t.h, c = t.c, nh = t.nh, nc = t.nc, al = t.al;
  final mono = c == 0;
  if (!dark) {
    return Palette(
      dark: false,
      bg: oklch(0.977, nc * 0.7, nh),
      surface: oklch(0.997, nc * 0.25, nh),
      sunk: oklch(0.945, nc, nh),
      text: oklch(0.21, nc * 1.6, nh),
      muted: oklch(0.5, nc * 2, nh),
      border: oklch(0.905, nc * 1.1, nh),
      borderStrong: oklch(0.82, nc * 1.3, nh),
      accent: oklch(al, c, h),
      accentInk: oklch(al - 0.1, c * 0.95, h),
      accentSoft: oklch(0.95, mono ? 0 : math.min(0.045, c * 0.25), h),
      onAccent: onAccent,
      ok: ok, okSoft: okSoft, bad: bad, badSoft: badSoft, warn: warn, warnSoft: warnSoft,
      course: course, courseSoft: courseSoft,
      grad: [oklch(al, c, h), oklch(al + 0.04, c, t.h2), oklch(al + 0.1, c, t.h3)],
      codeBg: oklch(0.2, nc * 1.5 + 0.01, nh),
      figBg: oklch(0.985, nc * 0.5, nh),
      fline: _h(f.fline), fstroke: _h(f.fstroke),
      blobs: [oklch(0.84, mono ? 0 : 0.11, h), oklch(0.86, mono ? 0 : 0.1, t.h2), oklch(0.9, mono ? 0 : 0.09, t.h3)],
    );
  }
  return Palette(
    dark: true,
    bg: oklch(0.165, nc * 1.1 + 0.004, nh),
    surface: oklch(0.205, nc * 1.1 + 0.006, nh),
    sunk: oklch(0.135, nc + 0.003, nh),
    text: oklch(0.945, nc * 0.5, nh),
    muted: oklch(0.72, nc * 1.4, nh),
    border: oklch(0.29, nc * 1.2 + 0.006, nh),
    borderStrong: oklch(0.37, nc * 1.2 + 0.006, nh),
    accent: oklch(0.74, c * 0.85, h),
    accentInk: oklch(0.84, c * 0.6, h),
    accentSoft: oklch(0.27, mono ? 0 : math.min(0.07, c * 0.4), h),
    onAccent: onAccent,
    ok: ok, okSoft: okSoft, bad: bad, badSoft: badSoft, warn: warn, warnSoft: warnSoft,
    course: course, courseSoft: courseSoft,
    grad: [oklch(0.74, c * 0.85, h), oklch(0.76, c * 0.85, t.h2), oklch(0.8, c * 0.8, t.h3)],
    codeBg: oklch(0.13, nc + 0.004, nh),
    figBg: oklch(0.19, nc + 0.004, nh),
    fline: _h(f.fline), fstroke: _h(f.fstroke),
    blobs: [oklch(0.36, mono ? 0 : 0.12, h), oklch(0.34, mono ? 0 : 0.12, t.h2), oklch(0.32, mono ? 0 : 0.1, t.h3)],
  );
}

// ------------------------------------------------------------------ fonts
class FontChoice {
  final String id, name;

  /// Google Fonts family name; null = platform default.
  final String? family;
  final String? note;
  const FontChoice(this.id, this.name, this.family, [this.note]);
}

const uiFonts = <FontChoice>[
  FontChoice('archivo', 'Archivo', 'Archivo', 'Default'),
  FontChoice('inter', 'Inter', 'Inter'),
  FontChoice('jakarta', 'Plus Jakarta Sans', 'Plus Jakarta Sans'),
  FontChoice('grotesk', 'Space Grotesk', 'Space Grotesk'),
  FontChoice('dmsans', 'DM Sans', 'DM Sans'),
  FontChoice('outfit', 'Outfit', 'Outfit'),
  FontChoice('manrope', 'Manrope', 'Manrope'),
  FontChoice('nunito', 'Nunito', 'Nunito', 'Rounded'),
  FontChoice('poppins', 'Poppins', 'Poppins'),
  FontChoice('plex', 'IBM Plex Sans', 'IBM Plex Sans'),
  FontChoice('lexend', 'Lexend', 'Lexend', 'Easy reading'),
  FontChoice('atkinson', 'Atkinson Hyperlegible', 'Atkinson Hyperlegible', 'High legibility'),
  FontChoice('system', 'System', null, 'Your device font'),
];

const readingFonts = <FontChoice>[
  FontChoice('sourceserif', 'Source Serif 4', 'Source Serif 4', 'Default'),
  FontChoice('merriweather', 'Merriweather', 'Merriweather'),
  FontChoice('lora', 'Lora', 'Lora'),
  FontChoice('literata', 'Literata', 'Literata'),
  FontChoice('newsreader', 'Newsreader', 'Newsreader'),
  FontChoice('crimson', 'Crimson Pro', 'Crimson Pro'),
  FontChoice('fraunces', 'Fraunces', 'Fraunces'),
  FontChoice('sans', 'Same as interface', null, 'Sans-serif lessons'),
];

const codeFonts = <FontChoice>[
  FontChoice('jetbrains', 'JetBrains Mono', 'JetBrains Mono', 'Default'),
  FontChoice('fira', 'Fira Code', 'Fira Code'),
  FontChoice('sourcecode', 'Source Code Pro', 'Source Code Pro'),
  FontChoice('plexmono', 'IBM Plex Mono', 'IBM Plex Mono'),
  FontChoice('robotomono', 'Roboto Mono', 'Roboto Mono'),
  FontChoice('spacemono', 'Space Mono', 'Space Mono'),
];

FontChoice fontById(List<FontChoice> list, String id) => list.firstWhere((f) => f.id == id, orElse: () => list.first);
