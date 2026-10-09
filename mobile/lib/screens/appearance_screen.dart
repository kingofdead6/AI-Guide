import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../state/appearance_store.dart';
import '../state/progress_store.dart';
import '../theme/app_theme.dart';
import '../theme/palettes.dart';
import '../widgets/ui.dart';

/// Same options as the website's Settings page: mode, 20 themes, three font choices, reading size, motion.
class AppearanceScreen extends StatelessWidget {
  const AppearanceScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final p = context.pal;
    final t = Theme.of(context).textTheme;
    final a = context.watch<AppearanceStore>();
    final progress = context.watch<ProgressStore>();
    final look = context.look;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Appearance'),
        actions: [if (!a.isDefault) TextButton.icon(onPressed: a.reset, icon: const Icon(Icons.restart_alt_rounded), label: const Text('Reset'))],
      ),
      body: ListView(padding: const EdgeInsets.fromLTRB(16, 8, 16, 40), children: [
        // ---------------------------------------------------------- preview
        FadeIn(
          child: AppCard(
            padding: EdgeInsets.zero,
            child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
              Container(height: 5, decoration: BoxDecoration(gradient: p.gradient)),
              Padding(
                padding: const EdgeInsets.all(16),
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text('Course 4 of 16', style: t.labelMedium?.copyWith(color: p.accent)),
                  const SizedBox(height: 4),
                  Wrap(children: [Text('From vectors to ', style: t.headlineSmall), GradientText('agents.', style: t.headlineSmall)]),
                  const SizedBox(height: 6),
                  Text('A short paragraph in your lesson font, so you can judge how reading feels.',
                      style: look.reading(TextStyle(fontSize: 15.5 * look.readingScale, height: 1.5, color: p.muted))),
                  const SizedBox(height: 10),
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(color: p.codeBg, borderRadius: BorderRadius.circular(10)),
                    child: Text('def relu(x):\n    return max(0, x)', style: look.code(const TextStyle(color: Color(0xFFE6EDF3), fontSize: 12.5, height: 1.5))),
                  ),
                  const SizedBox(height: 12),
                  const Bar(value: 0.67),
                  const SizedBox(height: 10),
                  Row(children: [for (final c in [...p.course, p.ok, p.warn, p.bad]) Expanded(child: Container(height: 12, margin: const EdgeInsets.only(right: 4), decoration: BoxDecoration(color: c, borderRadius: BorderRadius.circular(3))))]),
                ]),
              ),
            ]),
          ),
        ),
        const SizedBox(height: 22),
        // ---------------------------------------------------------- mode
        const SectionTitle('Light and dark'),
        SegmentedButton<String>(
          segments: const [
            ButtonSegment(value: 'light', icon: Icon(Icons.light_mode_rounded), label: Text('Light')),
            ButtonSegment(value: 'dark', icon: Icon(Icons.dark_mode_rounded), label: Text('Dark')),
            ButtonSegment(value: 'system', icon: Icon(Icons.brightness_auto_rounded), label: Text('System')),
          ],
          selected: {progress.theme},
          onSelectionChanged: (s) => progress.setTheme(s.first),
        ),
        const SizedBox(height: 26),
        // ---------------------------------------------------------- themes
        SectionTitle('Colour theme', sub: '${themes.length} palettes, each with a light and a dark version.'),
        GridView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(crossAxisCount: 2, mainAxisSpacing: 10, crossAxisSpacing: 10, childAspectRatio: 1.25),
          itemCount: themes.length,
          itemBuilder: (context, i) {
            final th = themes[i];
            final sw = buildPalette(th.id, p.dark);
            final active = a.palette == th.id;
            return FadeIn(
              index: i % 6,
              child: GestureDetector(
                onTap: () => a.setPalette(th.id),
                child: AnimatedContainer(
                  duration: look.d(250),
                  padding: const EdgeInsets.all(6),
                  decoration: BoxDecoration(
                    color: p.surface,
                    borderRadius: BorderRadius.circular(18),
                    border: Border.all(color: active ? p.accent : p.border, width: active ? 2.2 : 1),
                    boxShadow: active ? [BoxShadow(color: p.accent.withValues(alpha: 0.3), blurRadius: 16, spreadRadius: -4)] : null,
                  ),
                  child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Expanded(
                      child: Container(
                        decoration: BoxDecoration(color: sw.bg, borderRadius: BorderRadius.circular(12), border: Border.all(color: sw.border)),
                        clipBehavior: Clip.antiAlias,
                        child: Column(children: [
                          Container(height: 6, decoration: BoxDecoration(gradient: sw.gradient)),
                          Expanded(
                            child: Padding(
                              padding: const EdgeInsets.all(8),
                              child: Row(children: [
                                Expanded(
                                  child: Container(
                                    padding: const EdgeInsets.all(6),
                                    decoration: BoxDecoration(color: sw.surface, borderRadius: BorderRadius.circular(8), border: Border.all(color: sw.border)),
                                    child: Column(crossAxisAlignment: CrossAxisAlignment.start, mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                                      Container(height: 5, width: 40, decoration: BoxDecoration(color: sw.text, borderRadius: BorderRadius.circular(4))),
                                      Container(height: 4, decoration: BoxDecoration(color: sw.muted.withValues(alpha: 0.5), borderRadius: BorderRadius.circular(4))),
                                      Container(height: 10, width: 36, decoration: BoxDecoration(gradient: sw.gradient, borderRadius: BorderRadius.circular(4))),
                                    ]),
                                  ),
                                ),
                                const SizedBox(width: 6),
                                Column(mainAxisAlignment: MainAxisAlignment.center, children: [
                                  CircleAvatar(radius: 8, backgroundColor: sw.accent),
                                  const SizedBox(height: 4),
                                  CircleAvatar(radius: 8, backgroundColor: sw.accent.withValues(alpha: 0.5)),
                                ]),
                              ]),
                            ),
                          ),
                        ]),
                      ),
                    ),
                    const SizedBox(height: 6),
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 4),
                      child: Row(children: [
                        Expanded(child: Text(th.name, style: t.titleSmall, overflow: TextOverflow.ellipsis)),
                        if (active) Icon(Icons.check_circle_rounded, size: 18, color: p.accent),
                      ]),
                    ),
                    Padding(padding: const EdgeInsets.fromLTRB(4, 0, 4, 2), child: Text(th.blurb, style: t.bodySmall?.copyWith(fontSize: 11.5), maxLines: 1, overflow: TextOverflow.ellipsis)),
                  ]),
                ),
              ),
            );
          },
        ),
        const SizedBox(height: 26),
        // ---------------------------------------------------------- fonts
        const SectionTitle('Fonts', sub: 'Fonts download the first time you pick them.'),
        _FontPicker(label: 'Interface', options: uiFonts, value: a.uiFont, onPick: a.setUiFont, sample: 'Aa'),
        const SizedBox(height: 16),
        _FontPicker(label: 'Lesson text', options: readingFonts, value: a.readingFont, onPick: a.setReadingFont, sample: 'Aa'),
        const SizedBox(height: 16),
        _FontPicker(label: 'Code', options: codeFonts, value: a.codeFont, onPick: a.setCodeFont, sample: '{ }=>', mono: true),
        const SizedBox(height: 26),
        // ---------------------------------------------------------- reading
        SectionTitle('Reading size', sub: '${(a.readingScale * 100).round()}% for lessons and reference pages.'),
        Row(children: [
          const Text('A', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700)),
          Expanded(child: Slider(value: a.readingScale, min: 0.85, max: 1.3, divisions: 9, label: '${(a.readingScale * 100).round()}%', onChanged: a.setReadingScale)),
          const Text('A', style: TextStyle(fontSize: 21, fontWeight: FontWeight.w700)),
        ]),
        const SizedBox(height: 20),
        // ---------------------------------------------------------- motion
        AppCard(
          padding: const EdgeInsets.symmetric(horizontal: 4),
          child: SwitchListTile(
            value: !a.reduceMotion,
            onChanged: (v) => a.setReduceMotion(!v),
            title: const Text('Animations', style: TextStyle(fontWeight: FontWeight.w600)),
            subtitle: Text('Transitions, reveals, confetti and the background glow.', style: t.bodySmall),
          ),
        ),
      ]),
    );
  }
}

class _FontPicker extends StatelessWidget {
  final String label;
  final List<FontChoice> options;
  final String value;
  final ValueChanged<String> onPick;
  final String sample;
  final bool mono;
  const _FontPicker({required this.label, required this.options, required this.value, required this.onPick, required this.sample, this.mono = false});

  @override
  Widget build(BuildContext context) {
    final p = context.pal;
    final t = Theme.of(context).textTheme;
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Text(label, style: t.titleSmall),
      const SizedBox(height: 8),
      SizedBox(
        height: 104,
        child: ListView.separated(
          scrollDirection: Axis.horizontal,
          itemCount: options.length,
          separatorBuilder: (_, _) => const SizedBox(width: 8),
          itemBuilder: (context, i) {
            final f = options[i];
            final active = f.id == value;
            final family = f.family ?? (f.id == 'sans' ? context.look.uiFamily : null);
            return GestureDetector(
              onTap: () => onPick(f.id),
              child: AnimatedContainer(
                duration: context.look.d(200),
                width: 118,
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: active ? p.accentSoft : p.surface,
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: active ? p.accent : p.border, width: active ? 2 : 1),
                ),
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text(sample, style: fontStyle(family, TextStyle(fontSize: mono ? 20 : 26, fontWeight: FontWeight.w600, color: p.text, height: 1.1))),
                  const Spacer(),
                  Text(f.name, maxLines: 1, overflow: TextOverflow.ellipsis, style: fontStyle(family, TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: p.text))),
                  Text(f.note ?? '', maxLines: 1, overflow: TextOverflow.ellipsis, style: TextStyle(fontSize: 11, color: p.muted)),
                ]),
              ),
            );
          },
        ),
      ),
    ]);
  }
}
