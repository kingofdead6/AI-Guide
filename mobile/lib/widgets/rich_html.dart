import 'package:flutter/gestures.dart';
import 'package:flutter/material.dart';
import 'package:flutter_math_fork/flutter_math.dart';
import 'package:html/dom.dart' as dom;
import 'package:html/parser.dart' as parser;
import 'package:url_launcher/url_launcher.dart';

import '../theme/app_theme.dart';

/// Renders the small HTML fragments used in quiz questions, explanations, exercise prompts and project
/// briefs. Math was pre-rendered by KaTeX on the website; we read the original TeX from its
/// `<annotation>` and typeset it natively.
class RichHtml extends StatelessWidget {
  final String html;
  final TextStyle? style;
  final bool serif;

  const RichHtml(this.html, {super.key, this.style, this.serif = false});

  @override
  Widget build(BuildContext context) {
    final look = context.look;
    final base = DefaultTextStyle.of(context).style.merge(style);
    final textStyle = serif ? look.reading(base) : base;
    final frag = parser.parseFragment(html);
    final blocks = _Builder(context, textStyle).blocks(frag.nodes);
    if (blocks.length == 1) return blocks.first;
    return Column(crossAxisAlignment: CrossAxisAlignment.stretch, mainAxisSize: MainAxisSize.min, children: blocks);
  }
}

const _blockTags = {'p', 'div', 'ul', 'ol', 'pre', 'h1', 'h2', 'h3', 'h4', 'h5', 'blockquote', 'table', 'figure', 'li', 'section'};

class _Builder {
  final BuildContext ctx;
  final TextStyle base;
  _Builder(this.ctx, this.base);

  bool _isBlock(dom.Node n) =>
      n is dom.Element && (_blockTags.contains(n.localName) || (n.localName == 'span' && n.classes.contains('katex-display')));

  String? _tex(dom.Element katex) => katex.querySelector('annotation')?.text;

  Widget _math(String tex, {required bool display, required TextStyle style}) => Math.tex(
        tex,
        mathStyle: display ? MathStyle.display : MathStyle.text,
        textStyle: style.copyWith(fontSize: (style.fontSize ?? 15) * (display ? 1.1 : 1.05)),
        onErrorFallback: (_) => Text(tex, style: context.look.code(style.copyWith(fontSize: (style.fontSize ?? 15) * 0.9))),
      );

  BuildContext get context => ctx;

  List<Widget> blocks(List<dom.Node> nodes, {TextStyle? style}) {
    final s = style ?? base;
    final out = <Widget>[];
    var inline = <dom.Node>[];
    void flush() {
      final spans = inline.expand((n) => _inline(n, s)).toList();
      inline = [];
      // Drop runs that are only whitespace.
      if (spans.every((sp) => sp is TextSpan && (sp.text ?? '').trim().isEmpty && (sp.children?.isEmpty ?? true))) return;
      out.add(Padding(padding: const EdgeInsets.only(bottom: 4), child: Text.rich(TextSpan(children: spans), style: s)));
    }

    for (final n in nodes) {
      if (_isBlock(n)) {
        flush();
        final w = _block(n as dom.Element, s);
        if (w != null) out.add(w);
      } else {
        inline.add(n);
      }
    }
    flush();
    return out;
  }

  Widget? _block(dom.Element e, TextStyle s) {
    final p = context.pal;
    switch (e.localName) {
      case 'span': // katex-display
        final tex = _tex(e);
        if (tex == null) return null;
        return Padding(
          padding: const EdgeInsets.symmetric(vertical: 8),
          child: SingleChildScrollView(scrollDirection: Axis.horizontal, child: _math(tex, display: true, style: s)),
        );
      case 'pre':
        return Container(
          margin: const EdgeInsets.symmetric(vertical: 6),
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(color: p.codeBg, borderRadius: BorderRadius.circular(12)),
          child: SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Text(e.text.trimRight(), style: context.look.code(TextStyle(color: const Color(0xFFE6EDF3), fontSize: (s.fontSize ?? 15) * 0.82, height: 1.5))),
          ),
        );
      case 'ul':
      case 'ol':
        final items = e.children.where((c) => c.localName == 'li').toList();
        return Padding(
          padding: const EdgeInsets.symmetric(vertical: 4),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              for (var i = 0; i < items.length; i++)
                Padding(
                  padding: const EdgeInsets.only(bottom: 4),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      SizedBox(
                        width: 22,
                        child: Text(e.localName == 'ol' ? '${i + 1}.' : '•', style: s.copyWith(color: p.accent, fontWeight: FontWeight.w700)),
                      ),
                      Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: blocks(items[i].nodes, style: s))),
                    ],
                  ),
                ),
            ],
          ),
        );
      case 'h1':
      case 'h2':
      case 'h3':
      case 'h4':
      case 'h5':
        final hs = s.copyWith(fontWeight: FontWeight.w700, fontSize: (s.fontSize ?? 15) * 1.15);
        return Padding(padding: const EdgeInsets.only(top: 8, bottom: 4), child: Text.rich(TextSpan(children: e.nodes.expand((n) => _inline(n, hs)).toList()), style: hs));
      case 'blockquote':
        return Container(
          margin: const EdgeInsets.symmetric(vertical: 6),
          padding: const EdgeInsets.fromLTRB(12, 6, 8, 6),
          decoration: BoxDecoration(border: Border(left: BorderSide(color: p.accent, width: 3))),
          child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: blocks(e.nodes, style: s)),
        );
      default:
        final kids = blocks(e.nodes, style: s);
        if (kids.isEmpty) return null;
        return Padding(
          padding: EdgeInsets.only(bottom: e.localName == 'p' ? 6 : 0),
          child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: kids),
        );
    }
  }

  List<InlineSpan> _inline(dom.Node n, TextStyle s) {
    final p = context.pal;
    if (n is dom.Text) {
      final t = n.text.replaceAll(RegExp(r'\s+'), ' ');
      return [TextSpan(text: t)];
    }
    if (n is! dom.Element) return const [];
    final e = n;
    if (e.localName == 'span' && e.classes.contains('katex')) {
      final tex = _tex(e);
      if (tex == null) return [TextSpan(text: e.text)];
      return [WidgetSpan(alignment: PlaceholderAlignment.middle, child: _math(tex, display: false, style: s))];
    }
    List<InlineSpan> kids(TextStyle st) => e.nodes.expand((c) => _inline(c, st)).toList();
    switch (e.localName) {
      case 'br':
        return [const TextSpan(text: '\n')];
      case 'strong':
      case 'b':
        final st = s.copyWith(fontWeight: FontWeight.w700);
        return [TextSpan(style: st, children: kids(st))];
      case 'em':
      case 'i':
        final st = s.copyWith(fontStyle: FontStyle.italic);
        return [TextSpan(style: st, children: kids(st))];
      case 'sub':
      case 'sup':
        final st = s.copyWith(fontSize: (s.fontSize ?? 15) * 0.72);
        return [
          WidgetSpan(
            alignment: e.localName == 'sup' ? PlaceholderAlignment.top : PlaceholderAlignment.bottom,
            child: Text(e.text, style: st),
          ),
        ];
      case 'code':
        return [
          TextSpan(
            text: e.text,
            style: context.look.code(s.copyWith(fontSize: (s.fontSize ?? 15) * 0.86, backgroundColor: p.sunk, color: p.text)),
          ),
        ];
      case 'a':
        final href = e.attributes['href'] ?? '';
        final st = s.copyWith(color: p.accent, decoration: TextDecoration.underline, decorationColor: p.accent.withValues(alpha: 0.5));
        return [
          TextSpan(
            style: st,
            children: kids(st),
            recognizer: href.startsWith('http') ? (TapGestureRecognizer()..onTap = () => launchUrl(Uri.parse(href), mode: LaunchMode.externalApplication)) : null,
          ),
        ];
      default:
        return kids(s);
    }
  }
}

/// Plain text from an HTML fragment (for list previews).
String stripHtml(String html) {
  final frag = parser.parseFragment(html);
  for (final k in frag.querySelectorAll('.katex')) {
    final tex = k.querySelector('annotation')?.text;
    k.replaceWith(dom.Text(tex ?? ''));
  }
  return frag.text?.replaceAll(RegExp(r'\s+'), ' ').trim() ?? '';
}
