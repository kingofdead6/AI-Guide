import 'dart:math' as math;

import 'package:flutter/material.dart';

import '../theme/app_theme.dart';

/// Fades and slides a child in after a short, index-based delay (the app's "scroll reveal").
class FadeIn extends StatefulWidget {
  final Widget child;
  final int index;
  final double dy;
  const FadeIn({super.key, required this.child, this.index = 0, this.dy = 18});

  @override
  State<FadeIn> createState() => _FadeInState();
}

class _FadeInState extends State<FadeIn> with SingleTickerProviderStateMixin {
  late final AnimationController _c = AnimationController(vsync: this, duration: const Duration(milliseconds: 620));
  late final Animation<double> _a = CurvedAnimation(parent: _c, curve: Curves.easeOutCubic);

  @override
  void initState() {
    super.initState();
    Future.delayed(Duration(milliseconds: 60 * math.min(widget.index, 8)), () {
      if (mounted) _c.forward();
    });
  }

  @override
  void dispose() {
    _c.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (context.look.reduceMotion) return widget.child;
    return AnimatedBuilder(
      animation: _a,
      builder: (_, child) => Opacity(opacity: _a.value, child: Transform.translate(offset: Offset(0, widget.dy * (1 - _a.value)), child: child)),
      child: widget.child,
    );
  }
}

/// Surface card with the site's border, radius and soft shadow. Lifts slightly while pressed.
class AppCard extends StatefulWidget {
  final Widget child;
  final EdgeInsetsGeometry padding;
  final VoidCallback? onTap;
  final Color? color;
  final Color? borderColor;
  final double radius;
  const AppCard({super.key, required this.child, this.padding = const EdgeInsets.all(16), this.onTap, this.color, this.borderColor, this.radius = 18});

  @override
  State<AppCard> createState() => _AppCardState();
}

class _AppCardState extends State<AppCard> {
  bool _down = false;

  @override
  Widget build(BuildContext context) {
    final p = context.pal;
    final card = AnimatedContainer(
      duration: context.look.d(180),
      curve: Curves.easeOut,
      transform: Matrix4.diagonal3Values(_down ? 0.985 : 1.0, _down ? 0.985 : 1.0, 1),
      transformAlignment: Alignment.center,
      decoration: BoxDecoration(
        color: widget.color ?? p.surface,
        borderRadius: BorderRadius.circular(widget.radius),
        border: Border.all(color: widget.borderColor ?? p.border),
        boxShadow: [
          BoxShadow(color: Colors.black.withValues(alpha: p.dark ? 0.28 : 0.045), blurRadius: _down ? 6 : 22, offset: Offset(0, _down ? 2 : 8), spreadRadius: -10),
        ],
      ),
      child: ClipRRect(borderRadius: BorderRadius.circular(widget.radius), child: Padding(padding: widget.padding, child: widget.child)),
    );
    if (widget.onTap == null) return card;
    return GestureDetector(
      onTapDown: (_) => setState(() => _down = true),
      onTapUp: (_) => setState(() => _down = false),
      onTapCancel: () => setState(() => _down = false),
      onTap: widget.onTap,
      behavior: HitTestBehavior.opaque,
      child: card,
    );
  }
}

/// Primary call to action with the brand gradient.
class GradientButton extends StatelessWidget {
  final String label;
  final IconData? icon;
  final VoidCallback? onPressed;
  final bool busy;
  final bool expand;
  const GradientButton({super.key, required this.label, this.icon, this.onPressed, this.busy = false, this.expand = false});

  @override
  Widget build(BuildContext context) {
    final p = context.pal;
    final enabled = onPressed != null && !busy;
    final child = Row(
      mainAxisSize: expand ? MainAxisSize.max : MainAxisSize.min,
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        if (busy)
          SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2.4, color: p.onAccent))
        else if (icon != null)
          Icon(icon, size: 19, color: p.onAccent),
        if (busy || icon != null) const SizedBox(width: 8),
        Flexible(child: Text(label, overflow: TextOverflow.ellipsis, style: Theme.of(context).textTheme.labelLarge!.copyWith(color: p.onAccent, fontSize: 15.5))),
      ],
    );
    return AnimatedOpacity(
      duration: context.look.d(200),
      opacity: enabled ? 1 : 0.5,
      child: DecoratedBox(
        decoration: BoxDecoration(
          gradient: p.gradient,
          borderRadius: BorderRadius.circular(14),
          boxShadow: enabled ? [BoxShadow(color: p.accent.withValues(alpha: 0.35), blurRadius: 18, offset: const Offset(0, 8), spreadRadius: -8)] : null,
        ),
        child: Material(
          color: Colors.transparent,
          child: InkWell(
            borderRadius: BorderRadius.circular(14),
            onTap: enabled ? onPressed : null,
            child: ConstrainedBox(
              constraints: const BoxConstraints(minHeight: 50),
              child: Padding(padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12), child: child),
            ),
          ),
        ),
      ),
    );
  }
}

/// A progress bar that animates from empty to its value.
class Bar extends StatelessWidget {
  final double value;
  final Color? color;
  final double height;
  const Bar({super.key, required this.value, this.color, this.height = 8});

  @override
  Widget build(BuildContext context) {
    final p = context.pal;
    return ClipRRect(
      borderRadius: BorderRadius.circular(height),
      child: Container(
        height: height,
        color: p.sunk,
        alignment: Alignment.centerLeft,
        child: TweenAnimationBuilder<double>(
          tween: Tween(begin: 0, end: value.clamp(0, 1)),
          duration: context.look.d(900),
          curve: Curves.easeOutCubic,
          builder: (_, v, _) => FractionallySizedBox(
            widthFactor: v,
            child: Container(decoration: BoxDecoration(color: color ?? p.accent, borderRadius: BorderRadius.circular(height))),
          ),
        ),
      ),
    );
  }
}

/// Circular progress ring that fills from zero.
class Ring extends StatelessWidget {
  final double value;
  final double size;
  final double stroke;
  final Color? color;
  final Widget? child;
  const Ring({super.key, required this.value, this.size = 60, this.stroke = 7, this.color, this.child});

  @override
  Widget build(BuildContext context) {
    final p = context.pal;
    return SizedBox(
      width: size,
      height: size,
      child: TweenAnimationBuilder<double>(
        tween: Tween(begin: 0, end: value.clamp(0, 1)),
        duration: context.look.d(1100),
        curve: Curves.easeOutCubic,
        builder: (_, v, c) => CustomPaint(painter: _RingPainter(v, stroke, color ?? p.accent, p.sunk), child: Center(child: c)),
        child: child,
      ),
    );
  }
}

class _RingPainter extends CustomPainter {
  final double v, stroke;
  final Color color, track;
  _RingPainter(this.v, this.stroke, this.color, this.track);

  @override
  void paint(Canvas canvas, Size size) {
    final r = (size.shortestSide - stroke) / 2;
    final c = size.center(Offset.zero);
    canvas.drawCircle(c, r, Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = stroke
      ..color = track);
    if (v > 0) {
      canvas.drawArc(Rect.fromCircle(center: c, radius: r), -math.pi / 2, 2 * math.pi * v, false, Paint()
        ..style = PaintingStyle.stroke
        ..strokeWidth = stroke
        ..strokeCap = StrokeCap.round
        ..color = color);
    }
  }

  @override
  bool shouldRepaint(_RingPainter o) => o.v != v || o.color != color || o.track != track;
}

/// Counts up to [value].
class CountUp extends StatelessWidget {
  final num value;
  final TextStyle? style;
  final String Function(double)? format;
  const CountUp(this.value, {super.key, this.style, this.format});

  @override
  Widget build(BuildContext context) => TweenAnimationBuilder<double>(
        tween: Tween(begin: 0, end: value.toDouble()),
        duration: context.look.d(1000),
        curve: Curves.easeOutCubic,
        builder: (_, v, _) => Text(format?.call(v) ?? v.round().toString(), style: style),
      );
}

/// Initials on a gradient whose hue is stable per name (same as the website).
class Avatar extends StatelessWidget {
  final String name;
  final double size;
  const Avatar(this.name, {super.key, this.size = 40});

  @override
  Widget build(BuildContext context) {
    var h = 0;
    for (final ch in name.runes) {
      h = (h * 31 + ch) % 360;
    }
    final initials = name.split(RegExp(r'\s+')).where((w) => w.isNotEmpty).take(2).map((w) => w[0].toUpperCase()).join();
    return Container(
      width: size,
      height: size,
      alignment: Alignment.center,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        gradient: LinearGradient(
          colors: [HSLColor.fromAHSL(1, h.toDouble(), 0.7, 0.55).toColor(), HSLColor.fromAHSL(1, ((h + 50) % 360).toDouble(), 0.7, 0.45).toColor()],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
      ),
      child: Text(initials.isEmpty ? '?' : initials, style: TextStyle(color: Colors.white, fontWeight: FontWeight.w800, fontSize: size * 0.38)),
    );
  }
}

/// Small rounded label.
class Pill extends StatelessWidget {
  final String text;
  final Color color;
  final Color background;
  final IconData? icon;
  const Pill(this.text, {super.key, required this.color, required this.background, this.icon});

  @override
  Widget build(BuildContext context) => Container(
        padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 3),
        decoration: BoxDecoration(color: background, borderRadius: BorderRadius.circular(99)),
        child: Row(mainAxisSize: MainAxisSize.min, children: [
          if (icon != null) ...[Icon(icon, size: 13, color: color), const SizedBox(width: 4)],
          Text(text, style: TextStyle(color: color, fontSize: 11.5, fontWeight: FontWeight.w800, letterSpacing: 0.4)),
        ]),
      );
}

/// Rounded square icon tile in a soft tint.
class IconTile extends StatelessWidget {
  final IconData icon;
  final Color color;
  final double size;
  const IconTile(this.icon, {super.key, required this.color, this.size = 42});

  @override
  Widget build(BuildContext context) => Container(
        width: size,
        height: size,
        decoration: BoxDecoration(color: color.withValues(alpha: 0.14), borderRadius: BorderRadius.circular(size * 0.3)),
        child: Icon(icon, color: color, size: size * 0.5),
      );
}

class SectionTitle extends StatelessWidget {
  final String title;
  final String? sub;
  final Widget? trailing;
  const SectionTitle(this.title, {super.key, this.sub, this.trailing});

  @override
  Widget build(BuildContext context) {
    final t = Theme.of(context).textTheme;
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(crossAxisAlignment: CrossAxisAlignment.end, children: [
        Expanded(
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(title, style: t.titleLarge),
            if (sub != null) Padding(padding: const EdgeInsets.only(top: 2), child: Text(sub!, style: t.bodySmall)),
          ]),
        ),
        ?trailing,
      ]),
    );
  }
}

/// Text painted with the brand gradient.
class GradientText extends StatelessWidget {
  final String text;
  final TextStyle? style;
  const GradientText(this.text, {super.key, this.style});

  @override
  Widget build(BuildContext context) => ShaderMask(
        blendMode: BlendMode.srcIn,
        shaderCallback: (r) => context.pal.gradient.createShader(r),
        child: Text(text, style: style),
      );
}

/// Banner for errors and successes.
class Notice extends StatelessWidget {
  final String text;
  final bool ok;
  const Notice(this.text, {super.key, this.ok = false});

  @override
  Widget build(BuildContext context) {
    final p = context.pal;
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 11),
      decoration: BoxDecoration(color: ok ? p.okSoft : p.badSoft, borderRadius: BorderRadius.circular(12)),
      child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Icon(ok ? Icons.check_circle_rounded : Icons.error_outline_rounded, size: 19, color: ok ? p.ok : p.bad),
        const SizedBox(width: 8),
        Expanded(child: Text(text, style: TextStyle(color: ok ? p.ok : p.bad, fontWeight: FontWeight.w600))),
      ]),
    );
  }
}

/// Soft colour blobs drifting behind a screen (the website's background glow).
class GlowBackground extends StatefulWidget {
  final Widget child;
  const GlowBackground({super.key, required this.child});

  @override
  State<GlowBackground> createState() => _GlowBackgroundState();
}

class _GlowBackgroundState extends State<GlowBackground> with SingleTickerProviderStateMixin {
  late final AnimationController _c = AnimationController(vsync: this, duration: const Duration(seconds: 18))..repeat(reverse: true);

  @override
  void dispose() {
    _c.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final p = context.pal;
    final still = context.look.reduceMotion;
    return Stack(children: [
      Positioned.fill(
        child: AnimatedBuilder(
          animation: _c,
          builder: (_, _) {
            final t = still ? 0.0 : Curves.easeInOut.transform(_c.value);
            return CustomPaint(painter: _BlobPainter(p.blobs, t, p.dark ? 0.32 : 0.38));
          },
        ),
      ),
      widget.child,
    ]);
  }
}

class _BlobPainter extends CustomPainter {
  final List<Color> colors;
  final double t, opacity;
  _BlobPainter(this.colors, this.t, this.opacity);

  @override
  void paint(Canvas canvas, Size s) {
    void blob(Color c, Offset at, double r) {
      canvas.drawCircle(at, r, Paint()
        ..color = c.withValues(alpha: opacity)
        ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 70));
    }

    blob(colors[0], Offset(s.width * (0.05 + 0.25 * t), s.height * (0.02 + 0.1 * t)), s.width * 0.55);
    blob(colors[1], Offset(s.width * (1.0 - 0.2 * t), s.height * (0.18 + 0.12 * t)), s.width * 0.45);
    blob(colors[2], Offset(s.width * (0.5 - 0.15 * t), s.height * (0.45 - 0.08 * t)), s.width * 0.35);
  }

  @override
  bool shouldRepaint(_BlobPainter o) => o.t != t || o.colors != colors;
}

/// Activity heatmap: the last [weeks] weeks, one square per day.
class Heatmap extends StatelessWidget {
  final Map<String, dynamic> activity;
  final int weeks;
  const Heatmap({super.key, required this.activity, this.weeks = 18});

  static String _key(DateTime d) => '${d.year}-${d.month.toString().padLeft(2, '0')}-${d.day.toString().padLeft(2, '0')}';

  @override
  Widget build(BuildContext context) {
    final p = context.pal;
    final today = DateTime.now();
    final end = DateTime(today.year, today.month, today.day);
    var start = end.subtract(Duration(days: (weeks - 1) * 7));
    start = start.subtract(Duration(days: start.weekday - 1));
    final maxV = math.max(4, activity.values.fold<num>(0, (m, v) => math.max(m, v as num)).toInt());
    return LayoutBuilder(builder: (context, c) {
      final cell = math.min(16.0, (c.maxWidth - (weeks - 1) * 3) / weeks);
      return Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          for (var w = 0; w < weeks; w++)
            Column(children: [
              for (var d = 0; d < 7; d++)
                () {
                  final day = start.add(Duration(days: w * 7 + d));
                  final v = ((activity[_key(day)] as num?) ?? 0).toInt();
                  final future = day.isAfter(end);
                  return Container(
                    width: cell,
                    height: cell,
                    margin: const EdgeInsets.only(bottom: 3),
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(3),
                      color: future ? Colors.transparent : (v == 0 ? p.sunk : Color.lerp(p.surface, p.ok, 0.25 + 0.75 * math.min(v, maxV) / maxV)),
                    ),
                  );
                }(),
            ]),
        ],
      );
    });
  }
}

/// Empty or locked state.
class EmptyState extends StatelessWidget {
  final IconData icon;
  final String title;
  final String text;
  final Widget? action;
  const EmptyState({super.key, required this.icon, required this.title, required this.text, this.action});

  @override
  Widget build(BuildContext context) {
    final p = context.pal;
    final t = Theme.of(context).textTheme;
    return Padding(
      padding: const EdgeInsets.all(28),
      child: Column(mainAxisSize: MainAxisSize.min, children: [
        IconTile(icon, color: p.accent, size: 60),
        const SizedBox(height: 16),
        Text(title, style: t.titleLarge, textAlign: TextAlign.center),
        const SizedBox(height: 6),
        Text(text, style: t.bodyMedium?.copyWith(color: p.muted), textAlign: TextAlign.center),
        if (action != null) ...[const SizedBox(height: 20), action!],
      ]),
    );
  }
}

String fmtDate(Object? t) {
  DateTime? d;
  if (t is num) d = DateTime.fromMillisecondsSinceEpoch(t.toInt());
  if (t is String) d = DateTime.tryParse(t)?.toLocal();
  if (d == null) return '—';
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  return '${d.day} ${months[d.month - 1]} ${d.year}';
}

String ago(Object? t) {
  DateTime? d;
  if (t is num) d = DateTime.fromMillisecondsSinceEpoch(t.toInt());
  if (t is String) d = DateTime.tryParse(t)?.toLocal();
  if (d == null) return 'never';
  final s = DateTime.now().difference(d).inSeconds;
  if (s < 60) return 'just now';
  const units = [(60, 'minute'), (3600, 'hour'), (86400, 'day'), (604800, 'week'), (2629800, 'month'), (31557600, 'year')];
  var i = 0;
  while (i < units.length - 1 && s >= units[i + 1].$1) {
    i++;
  }
  final n = s ~/ units[i].$1;
  return '$n ${units[i].$2}${n == 1 ? '' : 's'} ago';
}
