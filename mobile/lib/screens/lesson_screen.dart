import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../data/content.dart';
import '../data/models.dart';
import '../state/progress_store.dart';
import '../theme/app_theme.dart';
import '../widgets/html_view.dart';
import 'exercises_screen.dart';
import 'nav.dart';
import 'quiz_screen.dart';

class LessonScreen extends StatefulWidget {
  final Course course;
  final Lesson lesson;
  const LessonScreen({super.key, required this.course, required this.lesson});

  @override
  State<LessonScreen> createState() => _LessonScreenState();
}

class _LessonScreenState extends State<LessonScreen> {
  late final Future<String> _html = Content.I.lessonHtml(widget.lesson.id);
  double _scroll = 0;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => context.read<ProgressStore>().visit(widget.course.id, widget.lesson.id));
  }

  void _go(Lesson l) => Navigator.of(context).pushReplacement(MaterialPageRoute(builder: (_) => LessonScreen(course: widget.course, lesson: l)));

  @override
  Widget build(BuildContext context) {
    final p = context.pal;
    final t = Theme.of(context).textTheme;
    final c = Content.I;
    final course = widget.course;
    final lesson = widget.lesson;
    final index = course.lessons.indexOf(lesson);
    final nb = c.neighbours(course.id, lesson.id);
    final done = context.select<ProgressStore, bool>((s) => s.lessonDone(lesson.id));
    final color = p.courseColor(course.color);

    return Scaffold(
      appBar: AppBar(
        titleSpacing: 0,
        title: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(course.title, style: t.labelMedium?.copyWith(color: color, fontWeight: FontWeight.w700), maxLines: 1, overflow: TextOverflow.ellipsis),
          Text('Lesson ${index + 1} of ${course.lessons.length}', style: t.titleSmall),
        ]),
        actions: [
          if (done)
            Padding(
              padding: const EdgeInsets.only(right: 12),
              child: Row(children: [Icon(Icons.check_circle_rounded, color: p.ok, size: 18), const SizedBox(width: 4), Text('Complete', style: TextStyle(color: p.ok, fontWeight: FontWeight.w700))]),
            ),
        ],
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(3),
          child: TweenAnimationBuilder<double>(
            tween: Tween(end: _scroll),
            duration: const Duration(milliseconds: 150),
            builder: (_, v, _) => LinearProgressIndicator(value: v, minHeight: 3, color: color, backgroundColor: Colors.transparent),
          ),
        ),
      ),
      body: FutureBuilder<String>(
        future: _html,
        builder: (context, snap) {
          if (!snap.hasData) return const SizedBox();
          return HtmlView(
            html: snap.data!,
            header: lessonHeader(
              kicker: 'Lesson ${index + 1} · ${course.title}',
              title: lesson.title,
              lead: lesson.lead,
              meta: '${lesson.minutes} min read · ${lesson.questions} quiz questions${lesson.exercises.isNotEmpty ? ' · ${lesson.exercises.length} code exercises' : ''}',
            ),
            onRoute: (r) => openRoute(context, r),
            onScroll: (v) {
              if ((v - _scroll).abs() > 0.01) setState(() => _scroll = v);
            },
          );
        },
      ),
      bottomNavigationBar: Container(
        decoration: BoxDecoration(color: p.surface, border: Border(top: BorderSide(color: p.border))),
        padding: EdgeInsets.fromLTRB(12, 10, 12, 10 + MediaQuery.paddingOf(context).bottom),
        child: Row(children: [
          IconButton.outlined(
            tooltip: nb.prev?.title ?? 'First lesson',
            onPressed: nb.prev == null ? null : () => _go(nb.prev!),
            icon: const Icon(Icons.chevron_left_rounded),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: FilledButton.icon(
              onPressed: () => push(context, QuizScreen(course: course, lesson: lesson)),
              icon: Icon(done ? Icons.check_circle_rounded : Icons.quiz_rounded, size: 19),
              label: Text(done ? 'Quiz passed' : 'Take the quiz'),
            ),
          ),
          if (lesson.exercises.isNotEmpty) ...[
            const SizedBox(width: 8),
            IconButton.filledTonal(
              tooltip: 'Code exercises',
              onPressed: () => push(context, ExercisesScreen(course: course, lesson: lesson)),
              icon: Badge(label: Text('${lesson.exercises.length}'), child: const Icon(Icons.code_rounded)),
            ),
          ],
          const SizedBox(width: 8),
          IconButton.outlined(
            tooltip: nb.next?.title ?? 'Last lesson',
            onPressed: nb.next == null ? null : () => _go(nb.next!),
            icon: const Icon(Icons.chevron_right_rounded),
          ),
        ]),
      ),
    );
  }
}
