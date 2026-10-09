import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../data/content.dart';
import '../data/models.dart';
import '../state/progress_store.dart';
import '../theme/app_theme.dart';
import '../widgets/html_view.dart';
import '../widgets/rich_html.dart';
import '../widgets/ui.dart';
import 'lesson_screen.dart';
import 'nav.dart';

class ExploreScreen extends StatelessWidget {
  const ExploreScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final p = context.pal;
    final t = Theme.of(context).textTheme;
    final items = [
      (Icons.flag_rounded, p.course[1], 'Guided projects', 'Six portfolio projects with milestones you can tick off.', () => push(context, const ProjectsScreen())),
      (Icons.menu_book_rounded, p.course[0], 'Glossary', 'Every key term in one place, with flashcards.', () => push(context, const GlossaryScreen())),
      (Icons.functions_rounded, p.course[3], 'Cheat sheet', 'The equations worth knowing by heart.', () => push(context, const PageScreen(name: 'cheatsheet', title: 'Equation cheat sheet'))),
      (Icons.route_rounded, p.course[2], 'How this works', 'How the academy is organised and how to study.', () => push(context, const PageScreen(name: 'start', title: 'How this works'))),
      (Icons.library_books_rounded, p.course[4], 'Books and courses', 'Papers, books and courses worth your time.', () => push(context, const PageScreen(name: 'resources', title: 'Books and courses'))),
    ];
    return SafeArea(
      bottom: false,
      child: ListView(
        padding: const EdgeInsets.fromLTRB(20, 18, 20, 24),
        children: [
          FadeIn(child: Text('Explore', style: t.headlineMedium)),
          const SizedBox(height: 4),
          FadeIn(index: 1, child: Text('Projects, reference material and practice beyond the lessons.', style: t.bodyMedium?.copyWith(color: p.muted))),
          const SizedBox(height: 18),
          for (var i = 0; i < items.length; i++)
            FadeIn(
              index: i + 2,
              child: Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: AppCard(
                  onTap: items[i].$5,
                  child: Row(children: [
                    IconTile(items[i].$1, color: items[i].$2, size: 48),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                        Text(items[i].$3, style: t.titleMedium),
                        const SizedBox(height: 2),
                        Text(items[i].$4, style: t.bodySmall),
                      ]),
                    ),
                    Icon(Icons.chevron_right_rounded, color: p.muted),
                  ]),
                ),
              ),
            ),
        ],
      ),
    );
  }
}

/// Reference pages (start, cheat sheet, resources) rendered like lessons.
class PageScreen extends StatelessWidget {
  final String name, title;
  const PageScreen({super.key, required this.name, required this.title});

  @override
  Widget build(BuildContext context) => Scaffold(
        appBar: AppBar(title: Text(title)),
        body: FutureBuilder<String>(
          future: Content.I.pageHtml(name),
          builder: (context, s) => s.hasData ? HtmlView(html: s.data!, onRoute: (r) => openRoute(context, r)) : const SizedBox(),
        ),
      );
}

// ------------------------------------------------------------------ glossary
class GlossaryScreen extends StatefulWidget {
  const GlossaryScreen({super.key});

  @override
  State<GlossaryScreen> createState() => _GlossaryScreenState();
}

class _GlossaryScreenState extends State<GlossaryScreen> {
  String _q = '';
  bool _cards = false;
  int _card = 0;
  bool _flipped = false;

  @override
  Widget build(BuildContext context) {
    final p = context.pal;
    final t = Theme.of(context).textTheme;
    return Scaffold(
      appBar: AppBar(
        title: const Text('Glossary'),
        actions: [
          TextButton.icon(
            onPressed: () => setState(() {
              _cards = !_cards;
              _flipped = false;
            }),
            icon: Icon(_cards ? Icons.list_rounded : Icons.style_rounded),
            label: Text(_cards ? 'List' : 'Flashcards'),
          ),
        ],
      ),
      body: FutureBuilder<List<GlossaryEntry>>(
        future: Content.I.glossary(),
        builder: (context, snap) {
          if (!snap.hasData) return const Center(child: CircularProgressIndicator());
          final all = snap.data!;
          if (_cards) {
            final e = all[_card % all.length];
            return Padding(
              padding: const EdgeInsets.all(20),
              child: Column(children: [
                Text('Card ${_card % all.length + 1} of ${all.length}. Tap to flip.', style: t.bodySmall),
                const SizedBox(height: 14),
                Expanded(
                  child: GestureDetector(
                    onTap: () => setState(() => _flipped = !_flipped),
                    child: TweenAnimationBuilder<double>(
                      tween: Tween(end: _flipped ? 1 : 0),
                      duration: context.look.d(450),
                      curve: Curves.easeInOutCubic,
                      builder: (_, v, _) {
                        final showBack = v > 0.5;
                        return Transform(
                          alignment: Alignment.center,
                          transform: Matrix4.identity()
                            ..setEntry(3, 2, 0.0012)
                            ..rotateY(v * 3.14159),
                          child: Transform(
                            alignment: Alignment.center,
                            transform: Matrix4.rotationY(showBack ? 3.14159 : 0),
                            child: Container(
                              width: double.infinity,
                              padding: const EdgeInsets.all(26),
                              decoration: BoxDecoration(
                                gradient: showBack ? null : p.gradient,
                                color: showBack ? p.surface : null,
                                borderRadius: BorderRadius.circular(24),
                                border: Border.all(color: p.border),
                                boxShadow: [BoxShadow(color: p.accent.withValues(alpha: 0.25), blurRadius: 30, offset: const Offset(0, 14), spreadRadius: -12)],
                              ),
                              alignment: Alignment.center,
                              child: showBack
                                  ? Column(mainAxisAlignment: MainAxisAlignment.center, children: [
                                      Text(e.term, style: t.titleMedium?.copyWith(color: p.accent)),
                                      const SizedBox(height: 12),
                                      Text(e.def, style: context.look.reading(t.bodyLarge!.copyWith(height: 1.5)), textAlign: TextAlign.center),
                                    ])
                                  : Text(e.term, style: t.headlineSmall?.copyWith(color: p.onAccent), textAlign: TextAlign.center),
                            ),
                          ),
                        );
                      },
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                Row(children: [
                  Expanded(child: OutlinedButton.icon(onPressed: () => setState(() { _card = (_card - 1 + all.length) % all.length; _flipped = false; }), icon: const Icon(Icons.arrow_back_rounded), label: const Text('Previous'))),
                  const SizedBox(width: 10),
                  Expanded(child: FilledButton.icon(onPressed: () => setState(() { _card = (_card + 1) % all.length; _flipped = false; }), icon: const Icon(Icons.arrow_forward_rounded), label: const Text('Next'))),
                ]),
              ]),
            );
          }
          final q = _q.toLowerCase();
          final list = q.isEmpty ? all : all.where((e) => e.term.toLowerCase().contains(q) || e.def.toLowerCase().contains(q)).toList();
          return Column(children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 4, 16, 8),
              child: TextField(onChanged: (v) => setState(() => _q = v), decoration: InputDecoration(hintText: 'Search ${all.length} terms', prefixIcon: const Icon(Icons.search_rounded))),
            ),
            Expanded(
              child: ListView.separated(
                padding: const EdgeInsets.fromLTRB(16, 4, 16, 24),
                itemCount: list.length,
                separatorBuilder: (_, _) => const SizedBox(height: 8),
                itemBuilder: (context, i) {
                  final e = list[i];
                  final l = Content.I.lesson(e.lesson);
                  return AppCard(
                    padding: const EdgeInsets.all(14),
                    onTap: l == null ? null : () => push(context, LessonScreen(course: l.course, lesson: l.lesson)),
                    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      Text(e.term, style: t.titleSmall?.copyWith(fontSize: 15.5)),
                      const SizedBox(height: 4),
                      Text(e.def, style: t.bodyMedium?.copyWith(color: p.muted)),
                      if (l != null) Padding(padding: const EdgeInsets.only(top: 6), child: Text('Lesson: ${l.lesson.title}', style: t.bodySmall?.copyWith(color: p.accent, fontWeight: FontWeight.w600))),
                    ]),
                  );
                },
              ),
            ),
          ]);
        },
      ),
    );
  }
}

// ------------------------------------------------------------------ projects
class ProjectsScreen extends StatelessWidget {
  const ProjectsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final p = context.pal;
    final t = Theme.of(context).textTheme;
    final progress = context.watch<ProgressStore>();
    return Scaffold(
      appBar: AppBar(title: const Text('Guided projects')),
      body: FutureBuilder<List<Project>>(
        future: Content.I.projects(),
        builder: (context, snap) {
          if (!snap.hasData) return const Center(child: CircularProgressIndicator());
          final list = snap.data!;
          return ListView.separated(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
            itemCount: list.length,
            separatorBuilder: (_, _) => const SizedBox(height: 12),
            itemBuilder: (context, i) {
              final pr = list[i];
              final done = ProgressStore.m(progress.projects[pr.id]).values.where((v) => v == true).length;
              return FadeIn(
                index: i,
                child: AppCard(
                  onTap: () => push(context, ProjectScreen(project: pr)),
                  child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Row(children: [
                      Pill(pr.level.toUpperCase(), color: p.accentInk, background: p.accentSoft),
                      const SizedBox(width: 8),
                      Text(pr.hours, style: t.bodySmall),
                    ]),
                    const SizedBox(height: 10),
                    Text(pr.title, style: t.titleMedium),
                    const SizedBox(height: 4),
                    Text(pr.summary, style: t.bodyMedium?.copyWith(color: p.muted)),
                    const SizedBox(height: 12),
                    Row(children: [
                      Expanded(child: Bar(value: pr.milestones.isEmpty ? 0 : done / pr.milestones.length, color: p.course[1], height: 6)),
                      const SizedBox(width: 10),
                      Text('$done/${pr.milestones.length} milestones', style: t.bodySmall?.copyWith(fontWeight: FontWeight.w600)),
                    ]),
                  ]),
                ),
              );
            },
          );
        },
      ),
    );
  }
}

class ProjectScreen extends StatelessWidget {
  final Project project;
  const ProjectScreen({super.key, required this.project});

  @override
  Widget build(BuildContext context) {
    final p = context.pal;
    final t = Theme.of(context).textTheme;
    final progress = context.watch<ProgressStore>();
    final ms = ProgressStore.m(progress.projects[project.id]);
    final done = ms.values.where((v) => v == true).length;
    return Scaffold(
      appBar: AppBar(title: Text(project.title, maxLines: 1, overflow: TextOverflow.ellipsis)),
      body: ListView(padding: const EdgeInsets.fromLTRB(16, 8, 16, 32), children: [
        Text(project.title, style: t.headlineSmall),
        const SizedBox(height: 6),
        Text('${project.level} · ${project.hours}', style: t.bodySmall),
        const SizedBox(height: 12),
        RichHtml(project.brief, serif: true, style: TextStyle(fontSize: 16 * context.look.readingScale, height: 1.55, color: p.text)),
        const SizedBox(height: 12),
        Wrap(spacing: 6, runSpacing: 6, children: [for (final s in project.skills) Pill(s, color: p.text, background: p.sunk)]),
        const SizedBox(height: 22),
        SectionTitle('Milestones', sub: '$done of ${project.milestones.length} done'),
        for (final m in project.milestones)
          Padding(
            padding: const EdgeInsets.only(bottom: 8),
            child: AppCard(
              padding: const EdgeInsets.fromLTRB(8, 4, 12, 4),
              borderColor: ms[m.id] == true ? p.ok : null,
              child: CheckboxListTile(
                value: ms[m.id] == true,
                onChanged: (_) => progress.toggleMilestone(project.id, m.id),
                controlAffinity: ListTileControlAffinity.leading,
                contentPadding: EdgeInsets.zero,
                activeColor: p.ok,
                title: Text(m.text, style: t.titleSmall?.copyWith(decoration: ms[m.id] == true ? TextDecoration.lineThrough : null, decorationColor: p.muted)),
                subtitle: m.detail.isEmpty ? null : Text(stripHtml(m.detail), style: t.bodySmall),
              ),
            ),
          ),
        if (project.stretch.isNotEmpty) ...[
          const SizedBox(height: 18),
          const SectionTitle('Stretch goals'),
          for (final s in project.stretch) _bullet(context, s),
        ],
        if (project.rubric.isNotEmpty) ...[
          const SizedBox(height: 18),
          const SectionTitle('How to judge your work'),
          for (final s in project.rubric) _bullet(context, s),
        ],
      ]),
    );
  }

  Widget _bullet(BuildContext context, String html) => Padding(
        padding: const EdgeInsets.only(bottom: 8),
        child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Padding(padding: const EdgeInsets.only(top: 7), child: Container(width: 6, height: 6, decoration: BoxDecoration(color: context.pal.accent, shape: BoxShape.circle))),
          const SizedBox(width: 10),
          Expanded(child: RichHtml(html)),
        ]),
      );
}
