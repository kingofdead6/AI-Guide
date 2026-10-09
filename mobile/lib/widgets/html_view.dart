import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:webview_flutter/webview_flutter.dart';

import '../theme/app_theme.dart';

String _hex(Color c) => '#${(c.toARGB32() & 0xFFFFFF).toRadixString(16).padLeft(6, '0')}';

String _cssFamily(String? family, String fallback) => family == null ? fallback : "'$family', $fallback";

class _Assets {
  static String? css;
  static String? js;
  static Future<void> load() async {
    css ??= await rootBundle.loadString('assets/web/lesson.css');
    js ??= await rootBundle.loadString('assets/web/widgets.js');
  }
}

/// Renders a lesson or reference page exactly like the website: KaTeX math, SVG figures,
/// highlighted code and the interactive widgets, themed with the app's palette and fonts.
class HtmlView extends StatefulWidget {
  final String html;

  /// Optional title block shown above the content (inside the scrolling page).
  final String? header;

  /// Called with in-app routes such as "/course/ml/linear-regression".
  final void Function(String route)? onRoute;
  final void Function(double progress)? onScroll;

  const HtmlView({super.key, required this.html, this.header, this.onRoute, this.onScroll});

  @override
  State<HtmlView> createState() => _HtmlViewState();
}

class _HtmlViewState extends State<HtmlView> {
  WebViewController? _ctl;
  String? _themeKey;
  bool _loaded = false;

  String _doc(Look look) {
    final p = look.p;
    final vars = p.cssVars.entries.map((e) => '${e.key}:${_hex(e.value)}').join(';');
    final families = {look.uiFamily, look.readingFamily, look.codeFamily}.whereType<String>().map((f) => 'family=${Uri.encodeComponent(f)}:ital,wght@0,400;0,600;0,700;1,400').join('&');
    final ui = _cssFamily(look.uiFamily, 'system-ui, sans-serif');
    final serif = look.readingFamily == null ? ui : _cssFamily(look.readingFamily, 'Georgia, serif');
    final mono = _cssFamily(look.codeFamily, 'ui-monospace, monospace');
    return '''<!doctype html>
<html class="${p.dark ? 'dark' : ''}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=4">
${families.isEmpty ? '' : '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?$families&display=swap">'}
<style>${_Assets.css}</style>
<style>
:root{$vars;--font-sans:$ui;--font-serif:$serif;--font-mono:$mono;--reading-scale:${look.readingScale};color-scheme:${p.dark ? 'dark' : 'light'}}
html,body{margin:0;background:${_hex(p.bg)};color:${_hex(p.text)};font-family:var(--font-sans);-webkit-text-size-adjust:100%;-webkit-tap-highlight-color:transparent}
body{padding:18px 18px 120px}
.head h1{font-family:var(--font-sans);font-size:30px;line-height:1.08;letter-spacing:-.02em;margin:6px 0 10px;font-weight:800}
.head .kicker{font-weight:700;font-size:14px;color:var(--accent)}
.head .lead{font-family:var(--font-serif);font-size:calc(1.2rem * var(--reading-scale));line-height:1.55;color:var(--muted);margin:0 0 6px}
.head .meta{font-size:13px;color:var(--muted);margin-bottom:22px}
.prose-lesson{max-width:760px;margin:0 auto}
.fig svg,svg{max-width:100%;height:auto}
.table-wrap,table{display:block;overflow-x:auto}
.katex-display{overflow-x:auto;overflow-y:hidden;padding:2px 0}
pre.code{position:relative;padding-top:2.4em}
.reveal{opacity:0;transform:translateY(14px);transition:opacity .6s ease,transform .6s ease}
.reveal.in{opacity:1;transform:none}
${look.reduceMotion ? '.reveal{opacity:1;transform:none;transition:none}' : ''}
</style>
</head>
<body>
${widget.header ?? ''}
<div class="prose-lesson">${widget.html}</div>
<script>${_Assets.js}</script>
<script>
(function(){
  function post(m){ try { App.postMessage(JSON.stringify(m)); } catch(e){} }
  document.addEventListener('click', function(e){
    var a = e.target.closest && e.target.closest('a[href]');
    if(!a) return;
    var href = a.getAttribute('href');
    if(href.indexOf('#/') === 0){ e.preventDefault(); post({route: href.slice(1)}); }
    else if(/^https?:/.test(href)){ e.preventDefault(); post({open: href}); }
  });
  document.querySelectorAll('.widget[data-widget]').forEach(function(el){
    try { AIGWidgets.mountWidget(el, el.getAttribute('data-widget')); } catch(e){}
  });
  document.querySelectorAll('pre.code').forEach(function(pre){
    var b = document.createElement('button'); b.className = 'copy-btn'; b.textContent = 'Copy';
    b.onclick = function(){ post({copy: (pre.querySelector('code')||pre).textContent}); b.textContent = 'Copied'; setTimeout(function(){ b.textContent = 'Copy'; }, 1500); };
    pre.appendChild(b);
  });
  var blocks = document.querySelectorAll('.prose-lesson > *');
  var io = new IntersectionObserver(function(es){ es.forEach(function(x){ if(x.isIntersecting){ x.target.classList.add('in'); io.unobserve(x.target);} }); }, {rootMargin:'0px 0px -5% 0px'});
  blocks.forEach(function(b){ b.classList.add('reveal'); io.observe(b); });
  var t = 0;
  window.addEventListener('scroll', function(){
    if (t) return;
    t = setTimeout(function(){ t = 0;
      var h = document.documentElement.scrollHeight - innerHeight;
      post({scroll: h > 0 ? Math.min(1, scrollY / h) : 1});
    }, 80);
  }, {passive:true});
})();
</script>
</body>
</html>''';
  }

  void _onMessage(JavaScriptMessage m) {
    try {
      final data = jsonDecode(m.message) as Map<String, dynamic>;
      if (data['route'] != null) widget.onRoute?.call(data['route'] as String);
      if (data['open'] != null) launchUrl(Uri.parse(data['open'] as String), mode: LaunchMode.externalApplication);
      if (data['scroll'] != null) widget.onScroll?.call((data['scroll'] as num).toDouble());
      if (data['copy'] != null) {
        Clipboard.setData(ClipboardData(text: data['copy'] as String));
      }
    } catch (_) {}
  }

  Future<void> _render(Look look) async {
    await _Assets.load();
    final key = '${look.p.accent}${look.p.bg}${look.uiFamily}${look.readingFamily}${look.codeFamily}${look.readingScale}${look.reduceMotion}${widget.html.hashCode}';
    if (key == _themeKey) return;
    _themeKey = key;
    _ctl ??= WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setBackgroundColor(look.p.bg)
      ..addJavaScriptChannel('App', onMessageReceived: _onMessage)
      ..setNavigationDelegate(NavigationDelegate(
        onPageFinished: (_) {
          if (mounted) setState(() => _loaded = true);
        },
        onNavigationRequest: (r) {
          if (r.url.startsWith('about:') || r.url.startsWith('data:') || r.url.startsWith('https://academy.local')) return NavigationDecision.navigate;
          launchUrl(Uri.parse(r.url), mode: LaunchMode.externalApplication);
          return NavigationDecision.prevent;
        },
      ));
    await _ctl!.setBackgroundColor(look.p.bg);
    await _ctl!.loadHtmlString(_doc(look), baseUrl: 'https://academy.local/');
    if (mounted) setState(() {});
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    _render(context.look);
  }

  @override
  void didUpdateWidget(HtmlView old) {
    super.didUpdateWidget(old);
    if (old.html != widget.html) _render(context.look);
  }

  @override
  Widget build(BuildContext context) {
    final p = context.pal;
    return Stack(children: [
      if (_ctl != null) Positioned.fill(child: WebViewWidget(controller: _ctl!)),
      IgnorePointer(
        child: AnimatedOpacity(
          opacity: _loaded ? 0 : 1,
          duration: context.look.d(300),
          child: Container(
            color: p.bg,
            padding: const EdgeInsets.all(20),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              for (final w in [0.5, 0.9, 1.0, 0.95, 0.7, 1.0, 0.85])
                Container(
                  margin: const EdgeInsets.only(bottom: 12),
                  height: 14,
                  width: MediaQuery.sizeOf(context).width * w * 0.85,
                  decoration: BoxDecoration(color: p.sunk, borderRadius: BorderRadius.circular(6)),
                ),
            ]),
          ),
        ),
      ),
    ]);
  }
}

/// Escapes text for the HTML header block.
String esc(String s) => const HtmlEscape().convert(s);

/// The header block used at the top of lesson pages.
String lessonHeader({required String kicker, required String title, required String lead, required String meta}) =>
    '<div class="head"><div class="kicker">${esc(kicker)}</div><h1>${esc(title)}</h1><p class="lead">${esc(lead)}</p><div class="meta">${esc(meta)}</div></div>';
