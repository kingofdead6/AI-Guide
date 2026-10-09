import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../app.dart';
import '../data/content.dart';
import '../data/models.dart';
import '../logic/progress_logic.dart';
import '../state/auth_store.dart';
import '../state/progress_store.dart';
import '../theme/app_theme.dart';
import '../widgets/ui.dart';
import 'certificate_screen.dart';
import 'course_screen.dart';
import 'lesson_screen.dart';
import 'main_shell.dart';
import 'nav.dart';

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final p = context.pal;
    final t = Theme.of(context).textTheme;
    final progress = context.watch<ProgressStore>();
    final user = context.watch<AuthStore>().user;
    final o = overall(progress.data);
    final up = nextUp(progress.data);
    final fresh = o.lessonsDone == 0 && progress.last == null;
    final c = Content.I;
    final first = (user?.name ?? progress.name).split(' ').first;

    return GlowBackground(
      child: SafeArea(
        bottom: false,
        child: CustomScrollView(slivers: [
          SliverPadding(
            padding: const EdgeInsets.fromLTRB(20, 14, 20, 0),
            sliver: SliverList.list(children: [
              Row(children: [
                const AppLogo(size: 30),
                const SizedBox(width: 10),
                Expanded(child: Text('The AI Guide Academy', style: t.titleMedium)),
                if (o.streak > 0) Pill('${o.streak} day streak', icon: Icons.local_fire_department_rounded, color: p.course[1], background: p.courseSoft[1]),
              ]),
              const SizedBox(height: 26),
              if (fresh) ...[
                FadeIn(
                  child: Wrap(children: [
                    Text('From vectors to ', style: t.displaySmall),
                    GradientText('agents.', style: t.displaySmall),
                  ]),
                ),
                const SizedBox(height: 10),
                FadeIn(
                  index: 1,
                  child: Text(
                    'A self-paced academy for becoming an AI engineer. ${c.courses.length} courses, ${c.totalLessons} lessons, ${c.totalQuestions} graded questions and ${c.totalExercises} code exercises.',
                    style: t.bodyLarge?.copyWith(color: p.muted, height: 1.5),
                  ),
                ),
              ] else
                FadeIn(child: Text(first.isEmpty ? 'Welcome back' : 'Welcome back, $first', style: t.headlineMedium)),
              const SizedBox(height: 20),
              if (up != null)
                FadeIn(index: 2, child: _ContinueCard(up: up, fresh: fresh, o: o))
              else
                FadeIn(
                  index: 2,
                  child: AppCard(
                    onTap: () => push(context, const CertificateScreen(courseId: 'program')),
                    child: Row(children: [
                      IconTile(Icons.emoji_events_rounded, color: p.warn),
                      const SizedBox(width: 14),
                      Expanded(child: Text('You finished every course. View your program certificate.', style: t.titleSmall)),
                    ]),
                  ),
                ),
              const SizedBox(height: 30),
              FadeIn(index: 3, child: SectionTitle('The path', sub: 'Courses in recommended order. Each ends with an exam and a certificate.', trailing: TextButton(onPressed: () => MainShell.goTo(context, 1), child: const Text('All')))),
            ]),
          ),
          for (final track in c.tracks) ...[
            SliverPadding(
              padding: const EdgeInsets.fromLTRB(20, 10, 20, 8),
              sliver: SliverToBoxAdapter(
                child: Row(children: [
                  Text(track.title.toUpperCase(), style: t.labelMedium?.copyWith(color: p.muted, letterSpacing: 1.1, fontWeight: FontWeight.w800)),
                  const SizedBox(width: 10),
                  Expanded(child: Divider(color: p.border)),
                ]),
              ),
            ),
            SliverPadding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              sliver: SliverList.builder(
                itemCount: c.courses.where((x) => x.track == track.id).length,
                itemBuilder: (context, i) {
                  final course = c.courses.where((x) => x.track == track.id).toList()[i];
                  return FadeIn(index: i, child: Padding(padding: const EdgeInsets.only(bottom: 10), child: CourseRow(course: course)));
                },
              ),
            ),
          ],
          const SliverToBoxAdapter(child: SizedBox(height: 24)),
        ]),
      ),
    );
  }
}

class _ContinueCard extends StatelessWidget {
  final NextUp up;
  final bool fresh;
  final Overall o;
  const _ContinueCard({required this.up, required this.fresh, required this.o});

  @override
  Widget build(BuildContext context) {
    final p = context.pal;
    final t = Theme.of(context).textTheme;
    final color = p.courseColor(up.course.color);
    return AppCard(
      padding: EdgeInsets.zero,
      onTap: () => push(context, LessonScreen(course: up.course, lesson: up.lesson)),
      child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
        Container(height: 5, decoration: BoxDecoration(gradient: p.gradient)),
        Padding(
          padding: const EdgeInsets.all(18),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(fresh ? 'Start here' : (up.resume ? 'Pick up where you left off' : 'Up next'), style: t.labelLarge?.copyWith(color: p.accent)),
            const SizedBox(height: 6),
            Text(up.lesson.title, style: t.titleLarge),
            const SizedBox(height: 2),
            Row(children: [
              Container(width: 8, height: 8, decoration: BoxDecoration(color: color, shape: BoxShape.circle)),
              const SizedBox(width: 6),
              Expanded(child: Text(up.course.title, style: t.bodySmall, overflow: TextOverflow.ellipsis)),
              Icon(Icons.schedule_rounded, size: 14, color: p.muted),
              const SizedBox(width: 3),
              Text('${up.lesson.minutes} min', style: t.bodySmall),
            ]),
            if (!fresh) ...[
              const SizedBox(height: 16),
              Row(children: [
                _stat(context, o.lessonsDone, 'lessons'),
                _stat(context, (o.accuracy * 100).round(), 'accuracy', suffix: '%'),
                _stat(context, o.codePassed, 'exercises'),
                _stat(context, o.certified, 'certificates'),
              ]),
            ],
            const SizedBox(height: 16),
            GradientButton(
              label: fresh ? 'Start with ${up.course.title}' : (up.resume ? 'Resume lesson' : 'Start lesson'),
              icon: Icons.play_arrow_rounded,
              expand: true,
              onPressed: () => push(context, LessonScreen(course: up.course, lesson: up.lesson)),
            ),
          ]),
        ),
      ]),
    );
  }

  Widget _stat(BuildContext context, int v, String label, {String suffix = ''}) {
    final t = Theme.of(context).textTheme;
    return Expanded(
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        CountUp(v, style: t.titleLarge, format: (x) => '${x.round()}$suffix'),
        Text(label, style: t.bodySmall),
      ]),
    );
  }
}

/// Compact course row: number badge, title, tagline and a progress bar.
class CourseRow extends StatelessWidget {
  final Course course;
  const CourseRow({super.key, required this.course});

  @override
  Widget build(BuildContext context) {
    final p = context.pal;
    final t = Theme.of(context).textTheme;
    final s = courseStatus(context.watch<ProgressStore>().data, course);
    final color = p.courseColor(course.color);
    final n = Content.I.courseNumber(course);
    return AppCard(
      padding: const EdgeInsets.all(14),
      onTap: () => push(context, CourseScreen(course: course)),
      child: Row(children: [
        Hero(tag: 'badge-${course.id}', child: CourseBadge(n: n, color: color, certified: s.certified)),
        const SizedBox(width: 14),
        Expanded(
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(course.title, style: t.titleSmall?.copyWith(fontSize: 16)),
            const SizedBox(height: 2),
            Text(course.tagline, style: t.bodySmall, maxLines: 1, overflow: TextOverflow.ellipsis),
            const SizedBox(height: 9),
            Row(children: [
              Expanded(child: Bar(value: s.pct, color: color, height: 6)),
              const SizedBox(width: 10),
              Text(s.certified ? 'Certified' : (s.started ? '${s.done}/${s.total}' : '${course.lessons.length} lessons'), style: t.bodySmall?.copyWith(fontWeight: FontWeight.w600)),
            ]),
          ]),
        ),
        const SizedBox(width: 4),
        Icon(Icons.chevron_right_rounded, color: p.muted),
      ]),
    );
  }
}

class CourseBadge extends StatelessWidget {
  final int n;
  final Color color;
  final bool certified;
  final double size;
  const CourseBadge({super.key, required this.n, required this.color, this.certified = false, this.size = 42});

  @override
  Widget build(BuildContext context) {
    final p = context.pal;
    return Container(
      width: size,
      height: size,
      alignment: Alignment.center,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: certified ? color : color.withValues(alpha: 0.12),
        border: Border.all(color: color, width: 2),
      ),
      child: certified
          ? Icon(Icons.check_rounded, color: p.onAccent, size: size * 0.5)
          : Text('$n', style: TextStyle(color: color, fontWeight: FontWeight.w800, fontSize: size * 0.36)),
    );
  }
}
