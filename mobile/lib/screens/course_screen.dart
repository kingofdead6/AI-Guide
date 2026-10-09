import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../data/content.dart';
import '../data/models.dart';
import '../logic/progress_logic.dart';
import '../state/progress_store.dart';
import '../theme/app_theme.dart';
import '../widgets/ui.dart';
import 'certificate_screen.dart';
import 'exam_screen.dart';
import 'home_screen.dart';
import 'lesson_screen.dart';
import 'nav.dart';

class CourseScreen extends StatelessWidget {
  final Course course;
  const CourseScreen({super.key, required this.course});

  @override
  Widget build(BuildContext context) {
    final p = context.pal;
    final t = Theme.of(context).textTheme;
    final progress = context.watch<ProgressStore>();
    final s = courseStatus(progress.data, course);
    final color = p.courseColor(course.color);
    final c = Content.I;
    final next = course.lessons.where((l) => !progress.lessonDone(l.id)).firstOrNull;
    final exam = progress.exam(course.id);

    return Scaffold(
      body: CustomScrollView(slivers: [
        SliverAppBar(
          pinned: true,
          expandedHeight: 250,
          backgroundColor: p.bg,
          flexibleSpace: FlexibleSpaceBar(
            collapseMode: CollapseMode.parallax,
            titlePadding: const EdgeInsetsDirectional.only(start: 56, bottom: 14, end: 16),
            title: LayoutBuilder(builder: (context, box) {
              final collapsed = box.maxHeight < 90;
              return AnimatedOpacity(opacity: collapsed ? 1 : 0, duration: context.look.d(150), child: Text(course.title, style: t.titleMedium, maxLines: 1, overflow: TextOverflow.ellipsis));
            }),
            background: Container(
              decoration: BoxDecoration(
                gradient: LinearGradient(colors: [color.withValues(alpha: p.dark ? 0.35 : 0.18), p.bg], begin: Alignment.topCenter, end: Alignment.bottomCenter),
              ),
              padding: EdgeInsets.fromLTRB(20, MediaQuery.paddingOf(context).top + 60, 20, 16),
              child: Row(crossAxisAlignment: CrossAxisAlignment.end, children: [
                Expanded(
                  child: Column(crossAxisAlignment: CrossAxisAlignment.start, mainAxisAlignment: MainAxisAlignment.end, children: [
                    Row(children: [
                      Hero(tag: 'badge-${course.id}', child: CourseBadge(n: c.courseNumber(course), color: color, certified: s.certified, size: 30)),
                      const SizedBox(width: 8),
                      Text('Course ${c.courseNumber(course)} of ${c.courses.length} · ${course.level}', style: t.labelMedium?.copyWith(color: color, fontWeight: FontWeight.w700)),
                    ]),
                    const SizedBox(height: 10),
                    Text(course.title, style: t.headlineMedium, maxLines: 3),
                  ]),
                ),
                const SizedBox(width: 12),
                Ring(value: s.pct, size: 76, stroke: 8, color: color, child: Text(pct(s.pct), style: t.titleSmall)),
              ]),
            ),
          ),
        ),
        SliverPadding(
          padding: const EdgeInsets.fromLTRB(20, 8, 20, 32),
          sliver: SliverList.list(children: [
            FadeIn(child: Text(course.description, style: t.bodyLarge?.copyWith(color: p.muted, height: 1.5))),
            const SizedBox(height: 16),
            FadeIn(
              index: 1,
              child: next != null
                  ? GradientButton(
                      label: s.started ? 'Continue: ${next.title}' : 'Start the course',
                      icon: Icons.play_arrow_rounded,
                      expand: true,
                      onPressed: () => push(context, LessonScreen(course: course, lesson: next)),
                    )
                  : GradientButton(
                      label: s.examPassed ? 'View certificate' : 'Take the final exam',
                      icon: Icons.emoji_events_rounded,
                      expand: true,
                      onPressed: () => push(context, s.examPassed ? CertificateScreen(courseId: course.id) : ExamScreen(course: course)),
                    ),
            ),
            const SizedBox(height: 26),
            SectionTitle('Lessons', sub: '${s.done} of ${s.total} complete'),
            for (var i = 0; i < course.lessons.length; i++)
              FadeIn(
                index: i,
                child: _LessonTile(course: course, lesson: course.lessons[i], n: i + 1),
              ),
            FadeIn(
              index: course.lessons.length,
              child: _Tile(
                icon: s.examPassed ? Icons.check_rounded : (s.lessonsComplete ? Icons.emoji_events_outlined : Icons.lock_outline_rounded),
                iconColor: s.examPassed ? p.ok : (s.lessonsComplete ? p.accent : p.muted),
                filled: s.examPassed,
                title: 'Final exam',
                sub: s.lessonsComplete
                    ? ((exam?['attempts'] as num? ?? 0) > 0 ? 'Best score ${pct(((exam!['best'] as num?) ?? 0).toDouble())}. Pass mark $examPassPct.' : 'Questions from the whole course. Pass mark $examPassPct.')
                    : 'Opens when all ${s.total} lessons are complete.',
                onTap: () => push(context, ExamScreen(course: course)),
              ),
            ),
            FadeIn(
              index: course.lessons.length + 1,
              child: _Tile(
                icon: Icons.workspace_premium_rounded,
                iconColor: s.certified ? p.warn : p.muted,
                filled: s.certified,
                fillColor: p.warn,
                title: 'Certificate',
                sub: s.certified ? 'Earned. Tap to view it.' : 'Complete every lesson and pass the final exam.',
                onTap: () => push(context, CertificateScreen(courseId: course.id)),
              ),
            ),
            const SizedBox(height: 26),
            const SectionTitle('What you will learn'),
            for (final o in course.outcomes)
              Padding(
                padding: const EdgeInsets.only(bottom: 10),
                child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Icon(Icons.check_circle_rounded, size: 19, color: color),
                  const SizedBox(width: 10),
                  Expanded(child: Text(o, style: t.bodyMedium)),
                ]),
              ),
            if (course.prereqs.isNotEmpty) ...[
              const SizedBox(height: 16),
              const SectionTitle('Builds on'),
              for (final id in course.prereqs)
                if (c.course(id) case final pc?)
                  Padding(padding: const EdgeInsets.only(bottom: 10), child: CourseRow(course: pc)),
            ],
          ]),
        ),
      ]),
    );
  }
}

class _LessonTile extends StatelessWidget {
  final Course course;
  final Lesson lesson;
  final int n;
  const _LessonTile({required this.course, required this.lesson, required this.n});

  @override
  Widget build(BuildContext context) {
    final p = context.pal;
    final t = Theme.of(context).textTheme;
    final progress = context.watch<ProgressStore>();
    final done = progress.lessonDone(lesson.id);
    final visited = progress.lessonVisited(lesson.id);
    final best = ((progress.quiz(lesson.id)?['best'] as num?) ?? 0).toDouble();
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: AppCard(
        padding: const EdgeInsets.all(14),
        onTap: () => push(context, LessonScreen(course: course, lesson: lesson)),
        child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
          AnimatedContainer(
            duration: context.look.d(300),
            width: 32,
            height: 32,
            alignment: Alignment.center,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: done ? p.ok : Colors.transparent,
              border: Border.all(color: done ? p.ok : (visited ? p.accent : p.borderStrong), width: 2),
            ),
            child: done ? Icon(Icons.check_rounded, size: 18, color: p.onAccent) : Text('$n', style: TextStyle(fontWeight: FontWeight.w800, color: visited ? p.accent : p.muted)),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(lesson.title, style: t.titleSmall?.copyWith(fontSize: 15.5)),
              const SizedBox(height: 3),
              Text(lesson.lead, style: t.bodySmall, maxLines: 2, overflow: TextOverflow.ellipsis),
              const SizedBox(height: 6),
              Wrap(spacing: 12, children: [
                Text('${lesson.minutes} min', style: t.bodySmall?.copyWith(fontWeight: FontWeight.w600)),
                Text('${lesson.questions} questions', style: t.bodySmall?.copyWith(fontWeight: FontWeight.w600)),
                if (lesson.exercises.isNotEmpty) Text('${lesson.exercises.length} code', style: t.bodySmall?.copyWith(fontWeight: FontWeight.w600)),
                if (best > 0) Text('Best ${pct(best)}', style: t.bodySmall?.copyWith(fontWeight: FontWeight.w700, color: done ? p.ok : p.warn)),
              ]),
            ]),
          ),
          Icon(Icons.chevron_right_rounded, color: p.muted),
        ]),
      ),
    );
  }
}

class _Tile extends StatelessWidget {
  final IconData icon;
  final Color iconColor;
  final bool filled;
  final Color? fillColor;
  final String title, sub;
  final VoidCallback onTap;
  const _Tile({required this.icon, required this.iconColor, required this.filled, this.fillColor, required this.title, required this.sub, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final p = context.pal;
    final t = Theme.of(context).textTheme;
    final fill = fillColor ?? p.ok;
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: AppCard(
        padding: const EdgeInsets.all(14),
        onTap: onTap,
        child: Row(children: [
          Container(
            width: 32,
            height: 32,
            decoration: BoxDecoration(shape: BoxShape.circle, color: filled ? fill : Colors.transparent, border: Border.all(color: filled ? fill : iconColor, width: 2)),
            child: Icon(icon, size: 17, color: filled ? p.onAccent : iconColor),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(title, style: t.titleSmall?.copyWith(fontSize: 15.5)),
              const SizedBox(height: 2),
              Text(sub, style: t.bodySmall),
            ]),
          ),
          Icon(Icons.chevron_right_rounded, color: p.muted),
        ]),
      ),
    );
  }
}
