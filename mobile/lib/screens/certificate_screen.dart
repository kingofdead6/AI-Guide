import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../data/content.dart';
import '../logic/progress_logic.dart';
import '../state/progress_store.dart';
import '../theme/app_theme.dart';
import '../widgets/confetti.dart';
import '../widgets/ui.dart';
import 'course_screen.dart';
import 'exam_screen.dart';
import 'nav.dart';

class CertificateScreen extends StatefulWidget {
  /// A course id, or "program" for the program certificate.
  final String courseId;
  const CertificateScreen({super.key, required this.courseId});

  @override
  State<CertificateScreen> createState() => _CertificateScreenState();
}

class _CertificateScreenState extends State<CertificateScreen> {
  late final TextEditingController _name = TextEditingController(text: context.read<ProgressStore>().name);
  bool _celebrated = false;

  @override
  void dispose() {
    _name.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final p = context.pal;
    final t = Theme.of(context).textTheme;
    final progress = context.watch<ProgressStore>();
    final isProgram = widget.courseId == 'program';
    final course = isProgram ? null : Content.I.course(widget.courseId);
    if (!isProgram && course == null) return Scaffold(appBar: AppBar(), body: const Center(child: Text('Certificate not found')));

    final eligible = isProgram ? programComplete(progress.data) : courseStatus(progress.data, course!).certified;
    final title = isProgram ? 'AI Engineer Track' : course!.title;
    final cert = progress.certificates[widget.courseId];

    if (eligible && cert == null) WidgetsBinding.instance.addPostFrameCallback((_) => progress.issueCertificate(widget.courseId));
    if (eligible && !_celebrated) {
      _celebrated = true;
      WidgetsBinding.instance.addPostFrameCallback((_) => showConfetti(context, count: 180, origin: const Offset(0.5, 0.25)));
    }

    if (!eligible) {
      return Scaffold(
        appBar: AppBar(title: Text('$title certificate')),
        body: ListView(padding: const EdgeInsets.all(20), children: [
          FadeIn(
            child: Row(children: [
              IconTile(Icons.lock_outline_rounded, color: p.muted),
              const SizedBox(width: 12),
              Text('Not earned yet', style: t.titleLarge),
            ]),
          ),
          const SizedBox(height: 18),
          if (isProgram) ...[
            Text('The program certificate is awarded when you hold a certificate for every course.', style: t.bodyLarge),
            const SizedBox(height: 14),
            for (final (i, c) in Content.I.courses.indexed)
              FadeIn(
                index: i,
                child: Padding(
                  padding: const EdgeInsets.only(bottom: 10),
                  child: AppCard(
                    padding: const EdgeInsets.all(12),
                    onTap: () => push(context, CourseScreen(course: c)),
                    child: Row(children: [
                      Icon(courseStatus(progress.data, c).certified ? Icons.check_circle_rounded : Icons.radio_button_unchecked_rounded,
                          color: courseStatus(progress.data, c).certified ? p.ok : p.borderStrong),
                      const SizedBox(width: 10),
                      Expanded(child: Text(c.title, style: t.titleSmall)),
                      SizedBox(width: 80, child: Bar(value: courseStatus(progress.data, c).pct, color: p.courseColor(c.color), height: 6)),
                    ]),
                  ),
                ),
              ),
          ] else
            () {
              final s = courseStatus(progress.data, course!);
              return AppCard(
                padding: const EdgeInsets.all(18),
                child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
                  _req(context, s.lessonsComplete, 'Complete all ${s.total} lessons (${s.done} done)'),
                  const SizedBox(height: 8),
                  Bar(value: s.pct, color: p.courseColor(course.color)),
                  const SizedBox(height: 14),
                  _req(context, s.examPassed, 'Pass the final exam with $examPassPct or more${s.examBest > 0 ? ' (best so far ${pct(s.examBest)})' : ''}'),
                  const SizedBox(height: 18),
                  GradientButton(
                    label: s.lessonsComplete ? 'Take the exam' : 'Go to the course',
                    expand: true,
                    onPressed: () => push(context, s.lessonsComplete ? ExamScreen(course: course) : CourseScreen(course: course)),
                  ),
                ]),
              );
            }(),
        ]),
      );
    }

    final issuedAt = ((cert?['issuedAt'] as num?) ?? ProgressStore.now()).toInt();
    final name = progress.name.trim();
    final id = certificateId(widget.courseId, issuedAt, name);
    final details = isProgram
        ? '${Content.I.totalLessons} lessons and ${Content.I.courses.length} final exams passed'
        : '${course!.lessons.length} lessons and ${course.questions} quiz questions completed, final exam score ${pct(((progress.exam(course.id)?['best'] as num?) ?? 0).toDouble())}';

    return Scaffold(
      appBar: AppBar(title: const Text('Certificate')),
      body: ListView(padding: const EdgeInsets.all(20), children: [
        FadeIn(child: Row(children: [Icon(Icons.workspace_premium_rounded, color: p.ok), const SizedBox(width: 6), Text('Earned on ${fmtDate(issuedAt)}', style: TextStyle(color: p.ok, fontWeight: FontWeight.w700))])),
        const SizedBox(height: 6),
        FadeIn(index: 1, child: Text(name.isEmpty ? 'Congratulations.' : 'Congratulations, ${name.split(' ').first}.', style: t.headlineMedium)),
        const SizedBox(height: 18),
        FadeIn(index: 2, child: _Certificate(name: name, title: title, details: details, date: fmtDate(issuedAt), certId: id, program: isProgram)),
        const SizedBox(height: 20),
        FadeIn(
          index: 3,
          child: AppCard(
            child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
              Text('Name on certificate', style: t.titleSmall),
              const SizedBox(height: 8),
              TextField(controller: _name, maxLength: 60, decoration: const InputDecoration(hintText: 'Your full name', counterText: '')),
              const SizedBox(height: 10),
              FilledButton(
                onPressed: () {
                  progress.setName(_name.text.trim());
                  FocusScope.of(context).unfocus();
                },
                child: const Text('Save name'),
              ),
            ]),
          ),
        ),
        const SizedBox(height: 12),
        Text('Certificate ID $id. It is generated from your name, the course and the completion date. Download or print it from the website.', style: t.bodySmall),
      ]),
    );
  }

  Widget _req(BuildContext context, bool done, String text) {
    final p = context.pal;
    return Row(children: [
      Icon(done ? Icons.check_circle_rounded : Icons.radio_button_unchecked_rounded, color: done ? p.ok : p.borderStrong),
      const SizedBox(width: 10),
      Expanded(child: Text(text, style: Theme.of(context).textTheme.bodyLarge)),
    ]);
  }
}

/// The certificate itself, printed on "paper" in both light and dark mode.
class _Certificate extends StatelessWidget {
  final String name, title, details, date, certId;
  final bool program;
  const _Certificate({required this.name, required this.title, required this.details, required this.date, required this.certId, required this.program});

  @override
  Widget build(BuildContext context) {
    final look = context.look;
    const ink = Color(0xFF14141F);
    const muted = Color(0xFF5C5F72);
    const accent = Color(0xFF5145E5);
    const amber = Color(0xFFE07612);
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [BoxShadow(color: accent.withValues(alpha: 0.25), blurRadius: 40, offset: const Offset(0, 18), spreadRadius: -16)],
      ),
      padding: const EdgeInsets.all(10),
      child: Container(
        decoration: BoxDecoration(border: Border.all(color: accent.withValues(alpha: 0.35), width: 1.5), borderRadius: BorderRadius.circular(10)),
        padding: const EdgeInsets.fromLTRB(20, 22, 20, 20),
        child: Column(children: [
          Container(height: 4, width: 70, decoration: BoxDecoration(gradient: const LinearGradient(colors: [accent, Color(0xFFA23FD9), Color(0xFFEC4F6F)]), borderRadius: BorderRadius.circular(4))),
          const SizedBox(height: 14),
          Text(program ? 'PROGRAM CERTIFICATE' : 'CERTIFICATE OF COMPLETION', style: TextStyle(color: accent, fontWeight: FontWeight.w800, letterSpacing: 2, fontSize: 11.5, fontFamily: look.uiFamily)),
          const SizedBox(height: 14),
          Text('This certifies that', style: look.reading(const TextStyle(color: muted, fontSize: 14, fontStyle: FontStyle.italic))),
          const SizedBox(height: 6),
          Text(name.isEmpty ? 'Your name' : name, textAlign: TextAlign.center, style: look.reading(TextStyle(color: name.isEmpty ? muted : ink, fontSize: 28, fontWeight: FontWeight.w700))),
          Container(margin: const EdgeInsets.symmetric(vertical: 10), height: 1, width: 180, color: const Color(0xFFE3E3EE)),
          Text('has completed', style: look.reading(const TextStyle(color: muted, fontSize: 14, fontStyle: FontStyle.italic))),
          const SizedBox(height: 6),
          Text(title, textAlign: TextAlign.center, style: const TextStyle(color: ink, fontSize: 21, fontWeight: FontWeight.w800)),
          const SizedBox(height: 8),
          Text(details, textAlign: TextAlign.center, style: const TextStyle(color: muted, fontSize: 12.5, height: 1.4)),
          const SizedBox(height: 18),
          Row(crossAxisAlignment: CrossAxisAlignment.end, children: [
            Expanded(
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text(date, style: const TextStyle(color: ink, fontWeight: FontWeight.w700, fontSize: 12.5)),
                const Text('Date', style: TextStyle(color: muted, fontSize: 11)),
              ]),
            ),
            Container(
              width: 46,
              height: 46,
              decoration: const BoxDecoration(shape: BoxShape.circle, color: amber),
              child: const Icon(Icons.workspace_premium_rounded, color: Colors.white),
            ),
            Expanded(
              child: Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
                Text(certId, style: look.code(const TextStyle(color: ink, fontWeight: FontWeight.w600, fontSize: 12))),
                const Text('Certificate ID', style: TextStyle(color: muted, fontSize: 11)),
              ]),
            ),
          ]),
          const SizedBox(height: 12),
          const Text('The AI Guide Academy', style: TextStyle(color: muted, fontWeight: FontWeight.w700, fontSize: 12)),
        ]),
      ),
    );
  }
}
