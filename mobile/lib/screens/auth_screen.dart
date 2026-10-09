import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';

import '../core/api.dart';
import '../logic/progress_logic.dart';
import '../state/auth_store.dart';
import '../state/progress_store.dart';
import '../theme/app_theme.dart';
import '../widgets/ui.dart';

class AuthScreen extends StatefulWidget {
  final bool register;
  const AuthScreen({super.key, required this.register});

  @override
  State<AuthScreen> createState() => _AuthScreenState();
}

class _AuthScreenState extends State<AuthScreen> {
  late bool _register = widget.register;
  final _name = TextEditingController();
  final _email = TextEditingController();
  final _password = TextEditingController();
  bool _show = false;
  bool _busy = false;
  String _err = '';

  @override
  void dispose() {
    _name.dispose();
    _email.dispose();
    _password.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    setState(() {
      _busy = true;
      _err = '';
    });
    final auth = context.read<AuthStore>();
    try {
      if (_register) {
        await auth.register(_name.text.trim(), _email.text.trim(), _password.text);
      } else {
        await auth.login(_email.text.trim(), _password.text);
      }
      if (mounted) Navigator.of(context).popUntil((r) => r.isFirst);
    } on ApiError catch (e) {
      setState(() => _err = e.message);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final p = context.pal;
    final t = Theme.of(context).textTheme;
    final o = overall(context.watch<ProgressStore>().data);
    final hasGuestProgress = o.lessonsDone > 0 || o.answered > 0;
    final level = _password.text.length >= 12 ? 3 : _password.text.length >= 8 ? 2 : 1;

    return Scaffold(
      appBar: AppBar(backgroundColor: Colors.transparent),
      extendBodyBehindAppBar: true,
      body: GlowBackground(
        child: SafeArea(
          child: ListView(
            padding: const EdgeInsets.fromLTRB(22, 8, 22, 32),
            children: [
              FadeIn(
                child: Text.rich(
                  _register
                      ? TextSpan(children: [const TextSpan(text: 'Keep every '), WidgetSpan(child: GradientText('step', style: t.headlineMedium)), const TextSpan(text: ' you take.')])
                      : TextSpan(children: [const TextSpan(text: 'Welcome '), WidgetSpan(child: GradientText('back.', style: t.headlineMedium))]),
                  style: t.headlineMedium,
                ),
              ),
              const SizedBox(height: 8),
              FadeIn(
                index: 1,
                child: Text(
                  _register ? 'A free account saves your lessons, scores and certificates, and syncs them with the website.' : 'Sign in to pick up exactly where you left off, on any device.',
                  style: t.bodyLarge?.copyWith(color: p.muted),
                ),
              ),
              const SizedBox(height: 22),
              FadeIn(
                index: 2,
                child: AppCard(
                  padding: const EdgeInsets.all(18),
                  child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
                    SegmentedButton<bool>(
                      segments: const [ButtonSegment(value: false, label: Text('Sign in')), ButtonSegment(value: true, label: Text('Create account'))],
                      selected: {_register},
                      showSelectedIcon: false,
                      onSelectionChanged: (s) => setState(() {
                        _register = s.first;
                        _err = '';
                      }),
                    ),
                    if (hasGuestProgress) ...[
                      const SizedBox(height: 14),
                      Notice('The progress on this phone (${o.lessonsDone} lessons, ${o.answered} answers) will be added to your account.', ok: true),
                    ],
                    const SizedBox(height: 16),
                    AnimatedSize(
                      duration: context.look.d(250),
                      child: _register
                          ? Padding(
                              padding: const EdgeInsets.only(bottom: 12),
                              child: TextField(
                                controller: _name,
                                textCapitalization: TextCapitalization.words,
                                autofillHints: const [AutofillHints.name],
                                decoration: const InputDecoration(labelText: 'Full name', prefixIcon: Icon(Icons.person_outline_rounded)),
                              ),
                            )
                          : const SizedBox(width: double.infinity),
                    ),
                    TextField(
                      controller: _email,
                      keyboardType: TextInputType.emailAddress,
                      autofillHints: const [AutofillHints.email],
                      decoration: const InputDecoration(labelText: 'Email', prefixIcon: Icon(Icons.mail_outline_rounded)),
                    ),
                    const SizedBox(height: 12),
                    TextField(
                      controller: _password,
                      obscureText: !_show,
                      onChanged: (_) => setState(() {}),
                      onSubmitted: (_) => _submit(),
                      autofillHints: [_register ? AutofillHints.newPassword : AutofillHints.password],
                      decoration: InputDecoration(
                        labelText: 'Password',
                        hintText: _register ? 'At least 8 characters' : null,
                        prefixIcon: const Icon(Icons.key_rounded),
                        suffixIcon: IconButton(icon: Icon(_show ? Icons.visibility_off_rounded : Icons.visibility_rounded), onPressed: () => setState(() => _show = !_show)),
                      ),
                    ),
                    if (_register && _password.text.isNotEmpty)
                      Padding(
                        padding: const EdgeInsets.only(top: 8),
                        child: Row(children: [
                          for (var i = 0; i < 3; i++) ...[
                            Expanded(
                              child: AnimatedContainer(
                                duration: context.look.d(300),
                                height: 4,
                                decoration: BoxDecoration(borderRadius: BorderRadius.circular(4), color: i < level ? [p.bad, p.warn, p.ok][level - 1] : p.sunk),
                              ),
                            ),
                            if (i < 2) const SizedBox(width: 6),
                          ],
                        ]),
                      ),
                    if (_err.isNotEmpty) ...[const SizedBox(height: 12), Notice(_err)],
                    const SizedBox(height: 16),
                    GradientButton(label: _busy ? (_register ? 'Creating account…' : 'Signing in…') : (_register ? 'Create account' : 'Sign in'), busy: _busy, expand: true, onPressed: _submit),
                    if (_register) ...[
                      const SizedBox(height: 12),
                      Text.rich(
                        TextSpan(children: [
                          const TextSpan(text: 'By creating an account you agree to the '),
                          WidgetSpan(child: _link(context, 'terms of use', '/terms')),
                          const TextSpan(text: ' and '),
                          WidgetSpan(child: _link(context, 'privacy policy', '/privacy')),
                          const TextSpan(text: '.'),
                        ]),
                        textAlign: TextAlign.center,
                        style: t.bodySmall,
                      ),
                    ],
                  ]),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _link(BuildContext context, String text, String route) => GestureDetector(
        onTap: () => launchUrl(Uri.parse(context.read<Api>().siteUrl(route)), mode: LaunchMode.externalApplication),
        child: Text(text, style: Theme.of(context).textTheme.bodySmall?.copyWith(decoration: TextDecoration.underline, color: context.pal.accent)),
      );
}
