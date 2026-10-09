import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../data/content.dart';
import '../logic/progress_logic.dart';
import '../state/auth_store.dart';
import '../state/progress_store.dart';
import '../theme/app_theme.dart';
import '../widgets/ui.dart';
import 'auth_screen.dart';
import 'certificate_screen.dart';
import 'course_screen.dart';
import 'nav.dart';

class ProgressScreen extends StatelessWidget {
  const ProgressScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final p = context.pal;
    final t = Theme.of(context).textTheme;
    final progress = context.watch<ProgressStore>();
    final auth = context.watch<AuthStore>();
    final o = overall(progress.data);
    final courses = Content.I.courses;

    return SafeArea(
      bottom: false,
      child: ListView(
        padding: const EdgeInsets.fromLTRB(20, 18, 20, 28),
        children: [
          FadeIn(child: Text('My progress', style: t.headlineMedium)),
          const SizedBox(height: 4),
          FadeIn(
            index: 1,
            child: Text(
              auth.user != null ? 'Saved to your account and synced with the website.' : 'Saved on this phone. Create an account to keep it safe and use it on the website.',
              style: t.bodyMedium?.copyWith(color: p.muted),
            ),
          ),
          if (auth.user == null) ...[
            const SizedBox(height: 14),
            FadeIn(
              index: 2,
              child: AppCard(
                color: p.accentSoft,
                borderColor: p.accent.withValues(alpha: 0.3),
                child: Row(children: [
                  Icon(Icons.cloud_upload_rounded, color: p.accent),
                  const SizedBox(width: 12),
                  Expanded(child: Text('Save your progress to an account', style: t.titleSmall)),
                  FilledButton(onPressed: () => push(context, const AuthScreen(register: true)), child: const Text('Sign up')),
                ]),
              ),
            ),
          ],
          const SizedBox(height: 18),
          FadeIn(
            index: 2,
            child: AppCard(
              child: Row(children: [
                Ring(value: o.lessonsTotal == 0 ? 0 : o.lessonsDone / o.lessonsTotal, size: 82, stroke: 9, child: Text(pct(o.lessonsTotal == 0 ? 0 : o.lessonsDone / o.lessonsTotal), style: t.titleSmall)),
                const SizedBox(width: 18),
                Expanded(
                  child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Row(crossAxisAlignment: CrossAxisAlignment.baseline, textBaseline: TextBaseline.alphabetic, children: [
                      CountUp(o.lessonsDone, style: t.headlineMedium),
                      Text(' / ${o.lessonsTotal}', style: t.titleMedium?.copyWith(color: p.muted)),
                    ]),
                    Text('lessons complete', style: t.bodySmall),
                  ]),
                ),
              ]),
            ),
          ),
          const SizedBox(height: 12),
          Row(children: [
            Expanded(child: FadeIn(index: 3, child: _Stat(icon: Icons.quiz_rounded, color: p.course[0], value: o.answered, label: '${o.answered == 0 ? '0%' : pct(o.accuracy)} correct'))),
            const SizedBox(width: 12),
            Expanded(child: FadeIn(index: 4, child: _Stat(icon: Icons.local_fire_department_rounded, color: p.course[1], value: o.streak, label: 'day streak'))),
          ]),
          const SizedBox(height: 12),
          Row(children: [
            Expanded(child: FadeIn(index: 5, child: _Stat(icon: Icons.workspace_premium_rounded, color: p.warn, value: o.certified, label: 'of ${courses.length} certificates'))),
            const SizedBox(width: 12),
            Expanded(child: FadeIn(index: 6, child: _Stat(icon: Icons.code_rounded, color: p.course[3], value: o.codePassed, label: 'exercises solved'))),
          ]),
          const SizedBox(height: 26),
          const SectionTitle('Activity', sub: 'Each square is a day. Answers, lessons, exams and exercises all count.'),
          FadeIn(child: AppCard(child: Heatmap(activity: progress.activity))),
          const SizedBox(height: 26),
          const SectionTitle('Courses'),
          for (var i = 0; i < courses.length; i++)
            () {
              final c = courses[i];
              final s = courseStatus(progress.data, c);
              return FadeIn(
                index: i,
                child: Padding(
                  padding: const EdgeInsets.only(bottom: 8),
                  child: AppCard(
                    padding: const EdgeInsets.all(14),
                    onTap: () => push(context, s.certified ? CertificateScreen(courseId: c.id) : CourseScreen(course: c)),
                    child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
                      Row(children: [
                        Expanded(child: Text(c.title, style: t.titleSmall)),
                        if (s.certified)
                          Pill('CERTIFICATE', icon: Icons.workspace_premium_rounded, color: p.ok, background: p.okSoft)
                        else if (s.lessonsComplete)
                          Pill('EXAM OPEN', color: p.accentInk, background: p.accentSoft)
                        else
                          Text('${s.done}/${s.total}', style: t.bodySmall?.copyWith(fontWeight: FontWeight.w600)),
                      ]),
                      const SizedBox(height: 8),
                      Bar(value: s.certified ? 1 : s.pct, color: p.courseColor(c.color), height: 6),
                    ]),
                  ),
                ),
              );
            }(),
          const SizedBox(height: 10),
          OutlinedButton.icon(
            onPressed: () => push(context, const CertificateScreen(courseId: 'program')),
            icon: const Icon(Icons.emoji_events_rounded),
            label: Text('Program certificate: ${o.certified} of ${courses.length} courses'),
          ),
          const SizedBox(height: 26),
          Center(
            child: TextButton.icon(
              onPressed: () => _confirmReset(context, auth.user != null),
              icon: Icon(Icons.delete_outline_rounded, color: p.bad),
              label: Text('Erase all progress', style: TextStyle(color: p.bad)),
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _confirmReset(BuildContext context, bool account) async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (c) => AlertDialog(
        title: const Text('Erase all progress?'),
        content: Text('This deletes every completed lesson, quiz answer, exam result and certificate ${account ? 'in your account' : 'on this phone'}. It cannot be undone.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(c, false), child: const Text('Keep my progress')),
          FilledButton(style: FilledButton.styleFrom(backgroundColor: context.pal.bad), onPressed: () => Navigator.pop(c, true), child: const Text('Erase everything')),
        ],
      ),
    );
    if (ok == true && context.mounted) context.read<ProgressStore>().reset();
  }
}

class _Stat extends StatelessWidget {
  final IconData icon;
  final Color color;
  final int value;
  final String label;
  const _Stat({required this.icon, required this.color, required this.value, required this.label});

  @override
  Widget build(BuildContext context) {
    final t = Theme.of(context).textTheme;
    return AppCard(
      padding: const EdgeInsets.all(14),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        IconTile(icon, color: color, size: 36),
        const SizedBox(height: 10),
        CountUp(value, style: t.headlineSmall),
        Text(label, style: t.bodySmall, maxLines: 1, overflow: TextOverflow.ellipsis),
      ]),
    );
  }
}
