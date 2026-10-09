import 'dart:math' as math;

import 'package:flutter/material.dart';

import '../data/models.dart';
import '../logic/grade.dart';
import '../theme/app_theme.dart';
import 'rich_html.dart';

/// One graded question. [result] null = not checked yet. Without [onCheck] (exam mode) there is no
/// per-question check button.
class QuestionCard extends StatefulWidget {
  final Question q;
  final int n;
  final Object? value;
  final bool? result;
  final ValueChanged<Object> onChange;
  final VoidCallback? onCheck;

  const QuestionCard({super.key, required this.q, required this.n, required this.value, required this.result, required this.onChange, this.onCheck});

  @override
  State<QuestionCard> createState() => _QuestionCardState();
}

class _QuestionCardState extends State<QuestionCard> with SingleTickerProviderStateMixin {
  late final AnimationController _shake = AnimationController(vsync: this, duration: const Duration(milliseconds: 480));
  late final TextEditingController _text = TextEditingController(text: widget.value is String ? widget.value as String : '');
  bool _pulse = false;

  @override
  void didUpdateWidget(QuestionCard old) {
    super.didUpdateWidget(old);
    if (old.result == null && widget.result != null && !context.look.reduceMotion) {
      if (widget.result == true) {
        setState(() => _pulse = true);
        Future.delayed(const Duration(milliseconds: 650), () {
          if (mounted) setState(() => _pulse = false);
        });
      } else {
        _shake.forward(from: 0);
      }
    }
    if (old.result != null && widget.result == null && (widget.value == null)) _text.text = '';
  }

  @override
  void dispose() {
    _shake.dispose();
    _text.dispose();
    super.dispose();
  }

  bool get graded => widget.result != null;

  String _optionState(int i) {
    if (!graded) return 'idle';
    final q = widget.q;
    final v = widget.value;
    final isCorrect = q.type == QType.single ? q.answer == i : (q.answer as List<int>).contains(i);
    final chosen = q.type == QType.single ? (v is num && v.toInt() == i) : (v is List && v.contains(i));
    if (isCorrect) return chosen ? 'right' : 'missed';
    return chosen ? 'wrong' : 'idle';
  }

  @override
  Widget build(BuildContext context) {
    final p = context.pal;
    final t = Theme.of(context).textTheme;
    final q = widget.q;
    final look = context.look;
    final answered = isAnswered(q, widget.value);
    final border = !graded ? p.border : (widget.result! ? p.ok : p.bad);

    Widget body = AnimatedContainer(
      duration: look.d(300),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: p.surface,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: border, width: graded ? 1.6 : 1),
        boxShadow: [
          if (_pulse) BoxShadow(color: p.ok.withValues(alpha: 0.4), blurRadius: 0, spreadRadius: 6),
          BoxShadow(color: Colors.black.withValues(alpha: p.dark ? 0.25 : 0.04), blurRadius: 20, offset: const Offset(0, 8), spreadRadius: -10),
        ],
      ),
      child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
        Row(children: [
          Text('Question ${widget.n}', style: t.titleSmall),
          const Spacer(),
          Text(typeHint[q.type]!, style: t.bodySmall),
        ]),
        const SizedBox(height: 8),
        RichHtml(q.prompt, serif: true, style: TextStyle(fontSize: 17 * look.readingScale, height: 1.5, color: p.text)),
        const SizedBox(height: 12),
        ..._input(context),
        if (widget.onCheck != null && !graded) ...[
          const SizedBox(height: 12),
          Align(
            alignment: Alignment.centerLeft,
            child: FilledButton.icon(onPressed: answered ? widget.onCheck : null, icon: const Icon(Icons.check_rounded, size: 19), label: const Text('Check answer')),
          ),
        ],
        AnimatedSize(
          duration: look.d(300),
          curve: Curves.easeOutCubic,
          child: graded ? _feedback(context) : const SizedBox(width: double.infinity),
        ),
      ]),
    );

    return AnimatedBuilder(
      animation: _shake,
      builder: (_, child) => Transform.translate(offset: Offset(math.sin(_shake.value * math.pi * 6) * 7 * (1 - _shake.value), 0), child: child),
      child: body,
    );
  }

  List<Widget> _input(BuildContext context) {
    final p = context.pal;
    final q = widget.q;
    final look = context.look;
    switch (q.type) {
      case QType.single:
      case QType.multi:
        return [
          for (var i = 0; i < q.options.length; i++)
            Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: _option(context, i),
            ),
        ];
      case QType.tf:
        return [
          Row(children: [
            for (final v in [true, false]) ...[
              Expanded(child: _tfButton(context, v)),
              if (v) const SizedBox(width: 10),
            ],
          ]),
        ];
      case QType.num:
      case QType.text:
        return [
          TextField(
            controller: _text,
            enabled: !graded,
            keyboardType: q.type == QType.num ? const TextInputType.numberWithOptions(decimal: true, signed: true) : TextInputType.text,
            onChanged: (v) => widget.onChange(v),
            onSubmitted: (_) {
              if (isAnswered(q, widget.value)) widget.onCheck?.call();
            },
            style: q.type == QType.num ? look.code(TextStyle(color: p.text, fontSize: 16)) : TextStyle(color: p.text, fontSize: 16),
            decoration: InputDecoration(hintText: q.type == QType.num ? 'e.g. 0.25, 1/4 or 25%' : 'Your answer'),
          ),
        ];
    }
  }

  Widget _option(BuildContext context, int i) {
    final p = context.pal;
    final q = widget.q;
    final v = widget.value;
    final selected = q.type == QType.single ? (v is num && v.toInt() == i) : (v is List && v.contains(i));
    final st = _optionState(i);
    final (Color bg, Color bd) = switch (st) {
      'right' => (p.okSoft, p.ok),
      'missed' => (p.surface, p.ok),
      'wrong' => (p.badSoft, p.bad),
      _ => selected ? (p.accentSoft, p.accent) : (p.surface, p.border),
    };
    final mark = st == 'right' || st == 'missed' ? p.ok : (st == 'wrong' ? p.bad : (selected ? p.accent : p.borderStrong));
    final single = q.type == QType.single;
    return AnimatedContainer(
      duration: context.look.d(200),
      decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(14), border: Border.all(color: bd, width: st == 'idle' && !selected ? 1 : 1.6)),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          borderRadius: BorderRadius.circular(14),
          onTap: graded
              ? null
              : () {
                  if (single) {
                    widget.onChange(i);
                  } else {
                    final cur = v is List ? v.map((e) => (e as num).toInt()).toList() : <int>[];
                    widget.onChange(cur.contains(i) ? (cur..remove(i)) : [...cur, i]);
                  }
                },
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
            child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
              AnimatedContainer(
                duration: context.look.d(200),
                width: 22,
                height: 22,
                margin: const EdgeInsets.only(top: 1),
                decoration: BoxDecoration(
                  shape: single ? BoxShape.circle : BoxShape.rectangle,
                  borderRadius: single ? null : BorderRadius.circular(6),
                  color: selected && st == 'idle' ? p.accent : Colors.transparent,
                  border: Border.all(color: mark, width: 2),
                ),
                child: st == 'right' || st == 'missed'
                    ? Icon(Icons.check_rounded, size: 15, color: p.ok)
                    : st == 'wrong'
                        ? Icon(Icons.close_rounded, size: 15, color: p.bad)
                        : selected
                            ? Icon(single ? Icons.circle : Icons.check_rounded, size: single ? 8 : 15, color: Colors.white)
                            : null,
              ),
              const SizedBox(width: 12),
              Expanded(child: RichHtml(q.options[i], style: TextStyle(fontSize: 15.5, color: p.text, height: 1.4))),
            ]),
          ),
        ),
      ),
    );
  }

  Widget _tfButton(BuildContext context, bool v) {
    final p = context.pal;
    final q = widget.q;
    final selected = widget.value == v;
    Color bg = selected ? p.accentSoft : p.surface;
    Color bd = selected ? p.accent : p.border;
    if (graded) {
      if (q.answer == v) {
        bg = selected ? p.okSoft : p.surface;
        bd = p.ok;
      } else if (selected) {
        bg = p.badSoft;
        bd = p.bad;
      }
    }
    return AnimatedContainer(
      duration: context.look.d(200),
      decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(14), border: Border.all(color: bd, width: 1.5)),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          borderRadius: BorderRadius.circular(14),
          onTap: graded ? null : () => widget.onChange(v),
          child: Padding(
            padding: const EdgeInsets.symmetric(vertical: 14),
            child: Center(child: Text(v ? 'True' : 'False', style: TextStyle(fontWeight: FontWeight.w700, color: p.text))),
          ),
        ),
      ),
    );
  }

  Widget _feedback(BuildContext context) {
    final p = context.pal;
    final q = widget.q;
    final ok = widget.result!;
    final label = correctLabel(q);
    return Container(
      width: double.infinity,
      margin: const EdgeInsets.only(top: 12),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(color: ok ? p.okSoft : p.badSoft, borderRadius: BorderRadius.circular(12)),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: [
          Icon(ok ? Icons.check_circle_rounded : Icons.cancel_rounded, color: ok ? p.ok : p.bad, size: 20),
          const SizedBox(width: 6),
          Text(ok ? 'Correct' : 'Not quite', style: TextStyle(fontWeight: FontWeight.w800, color: ok ? p.ok : p.bad)),
        ]),
        if (!ok && label.isNotEmpty) Padding(padding: const EdgeInsets.only(top: 6), child: Text('Correct answer: $label', style: TextStyle(fontWeight: FontWeight.w600, color: p.text))),
        if (q.explanation.isNotEmpty)
          Padding(
            padding: const EdgeInsets.only(top: 6),
            child: RichHtml(q.explanation, style: TextStyle(color: p.text, fontSize: 14.5, height: 1.45)),
          ),
      ]),
    );
  }
}
