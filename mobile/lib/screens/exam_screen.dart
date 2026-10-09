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
import 'certificate_screen.dart';
import 'course_screen.dart';

class ExamScreen extends StatefulWidget {
  final Course course;
  const ExamScreen({super.key, required this.course});

  @override
  State<ExamScreen> createState() => _ExamScreenState();
}

class _ExamScreenState extends State<ExamScreen> {
  Map<String, Question>? _bank;
  bool _review = false;

  @override
  void initState() {
    super.initState();
    Content.I.quizzes(widget.course.id).then((qz) {
      final all = [...widget.course.lessons.expand((l) => qz[l.id] ?? const <Question>[]), ...(qz['__exam'] ?? const <Question>[])];
      if (mounted) setState(() => _bank = {for (final q in all) q.id: q});
    });
  }

  void _begin(ProgressStore progress) {
    final bank = _bank!;
    final examOnly = bank.values.where((q) => q.id.contains('-exam-')).toList();
    final rest = bank.values.where((q) => !q.id.contains('-exam-')).toList();
    final rand = seeded(DateTime.now().millisecondsSinceEpoch);
    // Always include the integrative exam-only questions, then fill up from lesson quizzes.
    final pick = shuffle(examOnly, rand).take(examOnly.length < 8 ? examOnly.length : 8).toList();
    pick.addAll(shuffle(rest, rand).take((examSize - pick.length).clamp(0, examSize)));
    progress.startExam(widget.course.id, shuffle(pick, rand).map((q) => q.id).toList());
    setState(() => _review = false);
  }

  Future<void> _submit(ProgressStore progress, List<Question> qs, Map<String, dynamic> answers) async {
    final unanswered = qs.where((q) => !isAnswered(q, answers[q.id])).length;
    final ok = await showDialog<bool>(
      context: context,
      builder: (c) => AlertDialog(
        title: const Text('Submit the exam?'),
        content: Text(unanswered > 0 ? '$unanswered ${unanswered == 1 ? 'question is' : 'questions are'} unanswered and will count as wrong.' : 'You answered every question. Your score is final once you submit.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(c, false), child: const Text('Keep going')),
          FilledButton(onPressed: () => Navigator.pop(c, true), child: const Text('Submit')),
        ],
      ),
    );
    if (ok != true || !mounted) return;
    final results = {for (final q in qs) q.id: grade(q, answers[q.id])};
    final score = progress.submitExam(widget.course.id, results);
    if (score >= examPass && mounted) Future.delayed(const Duration(milliseconds: 300), () => mounted ? showConfetti(context, count: 220) : null);
  }

  @override
  Widget build(BuildContext context) {
    final p = context.pal;
    final t = Theme.of(context).textTheme;
    final progress = context.watch<ProgressStore>();
    final course = widget.course;
    final s = courseStatus(progress.data, course);
    final exam = progress.exam(course.id);
    final current = exam?['current'] == null ? null : ProgressStore.m(exam!['current']);
    final last = exam?['last'] == null ? null : ProgressStore.m(exam!['last']);
    final bank = _bank;

    Widget body;
    if (bank == null) {
      body = const Center(child: CircularProgressIndicator());
    } else if (!s.lessonsComplete && current == null) {
      body = Center(
        child: EmptyState(
          icon: Icons.lock_outline_rounded,
          title: 'The exam opens when every lesson is complete',
          text: 'You have completed ${s.done} of ${s.total} lessons. Pass each lesson quiz to unlock the final exam.',
          action: OutlinedButton(onPressed: () => Navigator.of(context).pushReplacement(MaterialPageRoute(builder: (_) => CourseScreen(course: course))), child: const Text('Back to the course')),
        ),
      );
    } else if (current != null) {
      final qs = (current['qids'] as List).map((id) => bank[id]).whereType<Question>().toList();
      final answers = ProgressStore.m(current['answers']);
      final answered = qs.where((q) => isAnswered(q, answers[q.id])).length;
      body = Column(children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 4, 16, 10),
          child: Row(children: [
            Expanded(child: Bar(value: qs.isEmpty ? 0 : answered / qs.length, height: 7)),
            const SizedBox(width: 10),
            Text('$answered/${qs.length} answered', style: t.labelLarge),
          ]),
        ),
        Expanded(
          child: ListView.builder(
            padding: const EdgeInsets.fromLTRB(16, 4, 16, 24),
            itemCount: qs.length,
            itemBuilder: (_, i) => Padding(
              padding: const EdgeInsets.only(bottom: 14),
              child: QuestionCard(
                key: ValueKey(qs[i].id),
                q: qs[i],
                n: i + 1,
                value: answers[qs[i].id],
                result: null,
                onChange: (a) => progress.examAnswer(course.id, qs[i].id, a),
              ),
            ),
          ),
        ),
        Container(
          decoration: BoxDecoration(color: p.surface, border: Border(top: BorderSide(color: p.border))),
          padding: EdgeInsets.fromLTRB(16, 10, 16, 10 + MediaQuery.paddingOf(context).bottom),
          child: Row(children: [
            TextButton(
              onPressed: () => progress.abandonExam(course.id),
              child: Text('Abandon', style: TextStyle(color: p.muted)),
            ),
            const SizedBox(width: 8),
            Expanded(child: GradientButton(label: 'Submit exam', icon: Icons.send_rounded, expand: true, onPressed: () => _submit(progress, qs, answers))),
          ]),
        ),
      ]);
    } else {
      final score = ((last?['score'] as num?) ?? 0).toDouble();
      final passedLast = last != null && score >= examPass;
      final reviewQs = last == null ? <Question>[] : (last['qids'] as List).map((id) => bank[id]).whereType<Question>().toList();
      body = ListView(padding: const EdgeInsets.fromLTRB(16, 8, 16, 32), children: [
        FadeIn(child: Text(course.title, style: t.titleMedium?.copyWith(color: p.courseColor(course.color)))),
        const SizedBox(height: 4),
        FadeIn(index: 1, child: Text('Final exam', style: t.headlineMedium)),
        const SizedBox(height: 16),
        if (last != null)
          FadeIn(
            index: 2,
            child: Container(
              padding: const EdgeInsets.all(18),
              decoration: BoxDecoration(color: passedLast ? p.okSoft : p.warnSoft, borderRadius: BorderRadius.circular(18), border: Border.all(color: passedLast ? p.ok : p.warn, width: 2)),
              child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
                Row(children: [
                  Ring(value: score, size: 70, stroke: 8, color: passedLast ? p.ok : p.warn, child: Text(pct(score), style: t.titleSmall)),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      Text(passedLast ? 'You passed!' : 'Not passed yet', style: t.titleLarge),
                      Text('Last attempt ${fmtDate(last['finishedAt'])}. Best ${pct(s.examBest)}.', style: t.bodySmall),
                    ]),
                  ),
                ]),
                const SizedBox(height: 14),
                if (s.certified)
                  GradientButton(
                    label: 'View your certificate',
                    icon: Icons.workspace_premium_rounded,
                    expand: true,
                    onPressed: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => CertificateScreen(courseId: course.id))),
                  ),
                if (!passedLast) Text('You need $examPassPct to pass. Review your answers, revisit the lessons, then try again.', style: t.bodyMedium),
              ]),
            ),
          ),
        const SizedBox(height: 16),
        FadeIn(
          index: 3,
          child: AppCard(
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text('How it works', style: t.titleMedium),
              const SizedBox(height: 8),
              for (final line in [
                '$examSize questions drawn from the whole course, including exam-only questions.',
                'No feedback until you submit. Pass mark $examPassPct.',
                'Retake it as often as you like; your best score counts.',
              ])
                Padding(
                  padding: const EdgeInsets.only(bottom: 6),
                  child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Icon(Icons.check_rounded, size: 18, color: p.accent),
                    const SizedBox(width: 8),
                    Expanded(child: Text(line, style: t.bodyMedium)),
                  ]),
                ),
              const SizedBox(height: 10),
              GradientButton(label: last == null ? 'Start the exam' : 'Retake the exam', icon: Icons.play_arrow_rounded, expand: true, onPressed: () => _begin(progress)),
            ]),
          ),
        ),
        if (reviewQs.isNotEmpty) ...[
          const SizedBox(height: 16),
          OutlinedButton.icon(
            onPressed: () => setState(() => _review = !_review),
            icon: Icon(_review ? Icons.expand_less_rounded : Icons.expand_more_rounded),
            label: Text(_review ? 'Hide answers' : 'Review your last attempt'),
          ),
          if (_review)
            for (var i = 0; i < reviewQs.length; i++)
              Padding(
                padding: const EdgeInsets.only(top: 14),
                child: QuestionCard(
                  q: reviewQs[i],
                  n: i + 1,
                  value: ProgressStore.m(last!['answers'])[reviewQs[i].id],
                  result: ProgressStore.m(last['results'])[reviewQs[i].id] == true,
                  onChange: (_) {},
                ),
              ),
        ],
      ]);
    }

    return Scaffold(appBar: AppBar(title: Text(current != null ? 'Final exam' : course.title)), body: body);
  }
}
