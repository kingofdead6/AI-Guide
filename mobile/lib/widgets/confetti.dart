import 'dart:math' as math;

import 'package:flutter/material.dart';

import '../theme/app_theme.dart';

/// A short confetti burst over the whole screen, like the website's.
void showConfetti(BuildContext context, {int count = 140, Offset origin = const Offset(0.5, 0.35)}) {
  if (context.look.reduceMotion) return;
  final p = context.pal;
  final overlay = Overlay.of(context, rootOverlay: true);
  late OverlayEntry entry;
  entry = OverlayEntry(
    builder: (_) => IgnorePointer(
      child: _Confetti(
        colors: [...p.course, p.warn],
        count: count,
        origin: origin,
        onDone: () => entry.remove(),
      ),
    ),
  );
  overlay.insert(entry);
}

class _Bit {
  double x, y, vx, vy, r, vr;
  final double w, h;
  final Color c;
  final bool round;
  _Bit(this.x, this.y, this.vx, this.vy, this.r, this.vr, this.w, this.h, this.c, this.round);
}

class _Confetti extends StatefulWidget {
  final List<Color> colors;
  final int count;
  final Offset origin;
  final VoidCallback onDone;
  const _Confetti({required this.colors, required this.count, required this.origin, required this.onDone});

  @override
  State<_Confetti> createState() => _ConfettiState();
}

class _ConfettiState extends State<_Confetti> with SingleTickerProviderStateMixin {
  late final AnimationController _c = AnimationController(vsync: this, duration: const Duration(milliseconds: 2700));
  List<_Bit>? _bits;
  Duration _last = Duration.zero;

  @override
  void initState() {
    super.initState();
    _c.addListener(_tick);
    _c.forward().whenComplete(widget.onDone);
  }

  void _seed(Size s) {
    final rnd = math.Random();
    _bits = List.generate(widget.count, (_) {
      final angle = -math.pi / 2 + (rnd.nextDouble() - 0.5) * math.pi * 1.1;
      final speed = 7 + rnd.nextDouble() * 9;
      return _Bit(
        widget.origin.dx * s.width,
        widget.origin.dy * s.height,
        math.cos(angle) * speed,
        math.sin(angle) * speed,
        rnd.nextDouble() * math.pi,
        (rnd.nextDouble() - 0.5) * 0.35,
        6 + rnd.nextDouble() * 6,
        8 + rnd.nextDouble() * 8,
        widget.colors[rnd.nextInt(widget.colors.length)],
        rnd.nextDouble() < 0.3,
      );
    });
  }

  void _tick() {
    final now = _c.lastElapsedDuration ?? Duration.zero;
    var steps = ((now - _last).inMicroseconds / 16667).round();
    _last = now;
    if (_bits == null) return;
    steps = steps.clamp(0, 4);
    for (var i = 0; i < steps; i++) {
      for (final b in _bits!) {
        b.vy += 0.28;
        b.vx *= 0.985;
        b.vy *= 0.985;
        b.x += b.vx;
        b.y += b.vy;
        b.r += b.vr;
      }
    }
    setState(() {});
  }

  @override
  void dispose() {
    _c.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => LayoutBuilder(builder: (_, c) {
        if (_bits == null) _seed(c.biggest);
        final age = _c.value * 2700;
        final fade = (1 - math.max(0, age - 1800) / 900).clamp(0.0, 1.0);
        return CustomPaint(size: c.biggest, painter: _Painter(_bits!, fade));
      });
}

class _Painter extends CustomPainter {
  final List<_Bit> bits;
  final double alpha;
  _Painter(this.bits, this.alpha);

  @override
  void paint(Canvas canvas, Size size) {
    for (final b in bits) {
      final paint = Paint()..color = b.c.withValues(alpha: alpha);
      canvas.save();
      canvas.translate(b.x, b.y);
      canvas.rotate(b.r);
      if (b.round) {
        canvas.drawCircle(Offset.zero, b.w / 2, paint);
      } else {
        final h = b.h * math.cos(b.r * 2).abs() + 2;
        canvas.drawRect(Rect.fromCenter(center: Offset.zero, width: b.w, height: h), paint);
      }
      canvas.restore();
    }
  }

  @override
  bool shouldRepaint(_Painter o) => true;
}
