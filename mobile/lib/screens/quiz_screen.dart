import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../data/content.dart';
import '../data/models.dart';
import '../logic/grade.dart';
import '../logic/progress_logic.dart';
import '../state/progress_store.dart';
import '../theme/app_theme.dart';
import '../widgets/confetti.dart';
import '../widgets/question_card.dart';
import '../widgets/ui.dart';
import 'exam_screen.dart';
import 'lesson_screen.dart';

class QuizScreen extends StatefulWidget {
  final Course course;
  final Lesson lesson;
  const QuizScreen({super.key, required this.course, required this.lesson});

  @override
  State<QuizScreen> createState() => _QuizScreenState();
}

class _QuizScreenState extends State<QuizScreen> {
  List<Question>? _qs;
  bool? _wasPassed;

  @override
  void initState() {
    super.initState();
    Content.I.quizzes(widget.course.id).then((q) {
      if (mounted) setState(() => _qs = q[widget.lesson.id] ?? []);
    });
  }

  @override
  Widget build(BuildContext context) {
    final p = context.pal;
    final t = Theme.of(context).textTheme;
    final progress = context.watch<ProgressStore>();
    final qs = _qs;
    final lesson = widget.lesson;
    final course = widget.course;

    if (qs == null) return Scaffold(appBar: AppBar(), body: const Center(child: CircularProgressIndicator()));

    final quiz = progress.quiz(lesson.id);
    final results = ProgressStore.m(quiz?['results']);
    final answers = ProgressStore.m(quiz?['answers']);
    final checked = results.length;
    final correct = results.values.where((v) => v == true).length;
    final finished = qs.isNotEmpty && checked >= qs.length;
    final score = finished ? correct / qs.length : 0.0;
    final passed = finished && score >= lessonPass;
    final need = (lessonPass * qs.length - 1e-9).ceil();
    final allDone = course.lessons.every((l) => progress.lessonDone(l.id));
    final next = Content.I.neighbours(course.id, lesson.id).next;

    // Confetti only when the quiz is passed right now, not when reopening a passed quiz.
    if (_wasPassed == false && passed) {
      WidgetsBinding.instance.addPostFrameCallback((_) => showConfetti(context, origin: const Offset(0.5, 0.75)));
    }
    _wasPassed = passed;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Check your understanding'),
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(28),
          child: Padding(
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 10),
            child: Row(children: [
              Expanded(child: Bar(value: qs.isEmpty ? 0 : checked / qs.length, height: 7)),
              const SizedBox(width: 10),
              Text('$checked/${qs.length}', style: t.labelLarge),
            ]),
          ),
        ),
      ),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(16, 12, 16, 40),
        children: [
          Text(lesson.title, style: t.titleLarge),
          const SizedBox(height: 4),
          Text('${qs.length} questions. Get $need or more right to complete this lesson. You can retry as often as you like.', style: t.bodyMedium?.copyWith(color: p.muted)),
          if (((quiz?['best'] as num?) ?? 0) > 0) Padding(padding: const EdgeInsets.only(top: 4), child: Text('Best score ${pct(((quiz!['best'] as num?) ?? 0).toDouble())}', style: t.bodySmall)),
          const SizedBox(height: 16),
          for (var i = 0; i < qs.length; i++)
            FadeIn(
              index: i,
              child: Padding(
                padding: const EdgeInsets.only(bottom: 14),
                child: QuestionCard(
                  key: ValueKey(qs[i].id),
                  q: qs[i],
                  n: i + 1,
                  value: answers[qs[i].id],
                  result: results[qs[i].id] as bool?,
                  onChange: (a) => progress.answer(lesson.id, qs[i].id, a),
                  onCheck: () => progress.check(lesson.id, qs[i].id, grade(qs[i], answers[qs[i].id]), qs.length),
                ),
              ),
            ),
          if (finished)
            FadeIn(
              child: Container(
                padding: const EdgeInsets.all(18),
                decoration: BoxDecoration(
                  color: passed ? p.okSoft : p.warnSoft,
                  borderRadius: BorderRadius.circular(18),
                  border: Border.all(color: passed ? p.ok : p.warn, width: 2),
                ),
                child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
                  Row(children: [
                    Ring(value: score, size: 56, stroke: 6, color: passed ? p.ok : p.warn, child: Text(pct(score), style: t.labelLarge)),
                    const SizedBox(width: 14),
                    Expanded(child: Text('$correct of ${qs.length} correct', style: t.titleLarge)),
                  ]),
                  const SizedBox(height: 10),
                  Text(
                    passed
                        ? (allDone ? 'Lesson complete. You have finished every lesson in this course, so the final exam is open.' : 'Lesson complete. Nice work. Keep the momentum going.')
                        : 'You need $need correct answers to complete the lesson. Read the explanations above, revisit the sections they point to, then try again.',
                    style: t.bodyMedium,
                  ),
                  const SizedBox(height: 14),
                  if (passed && allDone)
                    GradientButton(
                      label: 'Take the final exam',
                      icon: Icons.emoji_events_rounded,
                      expand: true,
                      onPressed: () => Navigator.of(context).pushReplacement(MaterialPageRoute(builder: (_) => ExamScreen(course: course))),
                    )
                  else if (passed && next != null)
                    GradientButton(
                      label: 'Next lesson',
                      icon: Icons.arrow_forward_rounded,
                      expand: true,
                      onPressed: () {
                        final nav = Navigator.of(context);
                        nav.pop();
                        nav.pushReplacement(MaterialPageRoute(builder: (_) => LessonScreen(course: course, lesson: next)));
                      },
                    ),
                  const SizedBox(height: 8),
                  OutlinedButton.icon(onPressed: () => progress.retryQuiz(lesson.id), icon: const Icon(Icons.refresh_rounded), label: const Text('Retry quiz')),
                ]),
              ),
            ),
        ],
      ),
    );
  }
}
