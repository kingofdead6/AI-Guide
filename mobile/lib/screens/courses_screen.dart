import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../data/content.dart';
import '../logic/progress_logic.dart';
import '../state/progress_store.dart';
import '../theme/app_theme.dart';
import '../widgets/ui.dart';
import 'course_screen.dart';
import 'home_screen.dart';
import 'nav.dart';

class CoursesScreen extends StatefulWidget {
  const CoursesScreen({super.key});

  @override
  State<CoursesScreen> createState() => _CoursesScreenState();
}

class _CoursesScreenState extends State<CoursesScreen> {
  String _track = 'all';

  @override
  Widget build(BuildContext context) {
    final p = context.pal;
    final t = Theme.of(context).textTheme;
    final progress = context.watch<ProgressStore>();
    final c = Content.I;
    final list = c.courses.where((x) => _track == 'all' || x.track == _track).toList();

    return SafeArea(
      bottom: false,
      child: CustomScrollView(slivers: [
        SliverPadding(
          padding: const EdgeInsets.fromLTRB(20, 18, 20, 6),
          sliver: SliverList.list(children: [
            FadeIn(child: Text('Courses', style: t.headlineMedium)),
            const SizedBox(height: 4),
            FadeIn(index: 1, child: Text('Sixteen courses, from Python and linear algebra to agents and distributed training.', style: t.bodyMedium?.copyWith(color: p.muted))),
            const SizedBox(height: 14),
          ]),
        ),
        SliverToBoxAdapter(
          child: SizedBox(
            height: 42,
            child: ListView(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 20),
              children: [
                for (final tr in [('all', 'All'), ...c.tracks.map((x) => (x.id, x.title))])
                  Padding(
                    padding: const EdgeInsets.only(right: 8),
                    child: ChoiceChip(
                      label: Text(tr.$2),
                      selected: _track == tr.$1,
                      showCheckmark: false,
                      labelStyle: TextStyle(color: _track == tr.$1 ? p.bg : p.text, fontWeight: FontWeight.w600),
                      onSelected: (_) => setState(() => _track = tr.$1),
                    ),
                  ),
              ],
            ),
          ),
        ),
        SliverPadding(
          padding: const EdgeInsets.fromLTRB(20, 14, 20, 24),
          sliver: SliverList.builder(
            itemCount: list.length,
            itemBuilder: (context, i) {
              final course = list[i];
              final s = courseStatus(progress.data, course);
              final color = p.courseColor(course.color);
              return FadeIn(
                key: ValueKey('$_track-${course.id}'),
                index: i,
                child: Padding(
                  padding: const EdgeInsets.only(bottom: 12),
                  child: AppCard(
                    padding: EdgeInsets.zero,
                    onTap: () => push(context, CourseScreen(course: course)),
                    child: IntrinsicHeight(
                      child: Row(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
                        Container(width: 5, color: color),
                        Expanded(
                          child: Padding(
                            padding: const EdgeInsets.all(16),
                            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                              Row(children: [
                                Hero(tag: 'badge-${course.id}', child: CourseBadge(n: c.courseNumber(course), color: color, certified: s.certified, size: 34)),
                                const SizedBox(width: 10),
                                Expanded(child: Text(course.level, style: t.labelMedium?.copyWith(color: color, fontWeight: FontWeight.w700))),
                                if (s.certified) Pill('CERTIFIED', icon: Icons.emoji_events_rounded, color: p.ok, background: p.okSoft),
                              ]),
                              const SizedBox(height: 10),
                              Text(course.title, style: t.titleLarge),
                              const SizedBox(height: 4),
                              Text(course.description, style: t.bodyMedium?.copyWith(color: p.muted), maxLines: 3, overflow: TextOverflow.ellipsis),
                              const SizedBox(height: 10),
                              Wrap(spacing: 14, runSpacing: 4, children: [
                                _meta(context, Icons.menu_book_rounded, '${course.lessons.length} lessons'),
                                _meta(context, Icons.schedule_rounded, '~${course.hours} h'),
                                _meta(context, Icons.quiz_outlined, '${course.questions + course.examQuestions} questions'),
                                if (course.exercises > 0) _meta(context, Icons.code_rounded, '${course.exercises} exercises'),
                              ]),
                              const SizedBox(height: 12),
                              Row(children: [
                                Expanded(child: Bar(value: s.pct, color: color, height: 6)),
                                const SizedBox(width: 10),
                                Text(s.started ? '${s.done}/${s.total}' : 'Not started', style: t.bodySmall?.copyWith(fontWeight: FontWeight.w600)),
                              ]),
                            ]),
                          ),
                        ),
                      ]),
                    ),
                  ),
                ),
              );
            },
          ),
        ),
      ]),
    );
  }

  Widget _meta(BuildContext context, IconData icon, String text) {
    final p = context.pal;
    return Row(mainAxisSize: MainAxisSize.min, children: [
      Icon(icon, size: 14, color: p.muted),
      const SizedBox(width: 4),
      Text(text, style: TextStyle(fontSize: 13, color: p.muted, fontWeight: FontWeight.w500)),
    ]);
  }
}
