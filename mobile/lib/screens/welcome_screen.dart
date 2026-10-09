import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../app.dart';
import '../data/content.dart';
import '../state/auth_store.dart';
import '../theme/app_theme.dart';
import '../widgets/ui.dart';
import 'auth_screen.dart';
import 'nav.dart';

/// First launch: what the academy is, then sign in, register, or start as a guest.
class WelcomeScreen extends StatelessWidget {
  const WelcomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final p = context.pal;
    final t = Theme.of(context).textTheme;
    final c = Content.I;
    final words = ['From', 'vectors', 'to'];
    return Scaffold(
      body: GlowBackground(
        child: SafeArea(
          child: LayoutBuilder(
            builder: (context, box) => SingleChildScrollView(
              padding: const EdgeInsets.fromLTRB(24, 20, 24, 24),
              child: ConstrainedBox(
                constraints: BoxConstraints(minHeight: box.maxHeight - 44),
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  FadeIn(child: Row(children: [const AppLogo(), const SizedBox(width: 10), Text('The AI Guide Academy', style: t.titleMedium)])),
                  const SizedBox(height: 56),
                  Wrap(children: [
                    for (var i = 0; i < words.length; i++) FadeIn(index: i + 1, dy: 28, child: Text('${words[i]} ', style: t.displaySmall?.copyWith(fontSize: 50))),
                    FadeIn(index: 4, dy: 28, child: GradientText('agents.', style: t.displaySmall?.copyWith(fontSize: 50))),
                  ]),
                  const SizedBox(height: 18),
                  FadeIn(
                    index: 5,
                    child: Text(
                      'A self-paced academy for becoming an AI engineer. ${c.courses.length} courses with derivations, diagrams and live demos, then graded quizzes, Python exercises and a certificate for every course you finish.',
                      style: t.bodyLarge?.copyWith(color: p.muted, height: 1.5),
                    ),
                  ),
                  const SizedBox(height: 28),
                  FadeIn(
                    index: 6,
                    child: Wrap(spacing: 8, runSpacing: 8, children: [
                      _stat(context, Icons.menu_book_rounded, '${c.totalLessons} lessons'),
                      _stat(context, Icons.quiz_rounded, '${c.totalQuestions} questions'),
                      _stat(context, Icons.code_rounded, '${c.totalExercises} exercises'),
                      _stat(context, Icons.schedule_rounded, '~${c.totalHours} hours'),
                    ]),
                  ),
                  const SizedBox(height: 40),
                  FadeIn(
                    index: 7,
                    child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
                      GradientButton(label: 'Create a free account', icon: Icons.person_add_alt_1_rounded, expand: true, onPressed: () => push(context, const AuthScreen(register: true))),
                      const SizedBox(height: 10),
                      OutlinedButton(onPressed: () => push(context, const AuthScreen(register: false)), child: const Text('I already have an account')),
                      const SizedBox(height: 6),
                      TextButton(
                        onPressed: () => context.read<AuthStore>().setOnboarded(),
                        child: Text('Continue without an account', style: TextStyle(color: p.muted)),
                      ),
                    ]),
                  ),
                ]),
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _stat(BuildContext context, IconData icon, String text) {
    final p = context.pal;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(color: p.surface.withValues(alpha: 0.8), borderRadius: BorderRadius.circular(99), border: Border.all(color: p.border)),
      child: Row(mainAxisSize: MainAxisSize.min, children: [
        Icon(icon, size: 16, color: p.accent),
        const SizedBox(width: 6),
        Text(text, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13.5)),
      ]),
    );
  }
}
