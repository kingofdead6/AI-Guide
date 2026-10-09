import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../core/api.dart';
import '../state/auth_store.dart';
import '../state/progress_store.dart';
import '../theme/app_theme.dart';
import '../widgets/ui.dart';

/// Name, password and account deletion (same as the website's Account settings).
class AccountScreen extends StatefulWidget {
  const AccountScreen({super.key});

  @override
  State<AccountScreen> createState() => _AccountScreenState();
}

class _AccountScreenState extends State<AccountScreen> {
  late final _name = TextEditingController(text: context.read<AuthStore>().user?.name ?? '');
  late final _certName = TextEditingController(text: context.read<ProgressStore>().name);
  final _cur = TextEditingController();
  final _next = TextEditingController();
  final _confirm = TextEditingController();
  final _reason = TextEditingController();
  bool _show = false;
  String _busy = '';
  final Map<String, (bool, String)> _msg = {};

  @override
  void dispose() {
    for (final c in [_name, _certName, _cur, _next, _confirm, _reason]) {
      c.dispose();
    }
    super.dispose();
  }

  Future<void> _run(String key, Future<void> Function() fn, String ok) async {
    setState(() {
      _busy = key;
      _msg.remove(key);
    });
    try {
      await fn();
      setState(() => _msg[key] = (true, ok));
    } on ApiError catch (e) {
      setState(() => _msg[key] = (false, e.message));
    } finally {
      if (mounted) setState(() => _busy = '');
    }
  }

  Widget _status(String key) {
    final m = _msg[key];
    if (m == null) return const SizedBox();
    return Padding(padding: const EdgeInsets.only(top: 12), child: Notice(m.$2, ok: m.$1));
  }

  @override
  Widget build(BuildContext context) {
    final p = context.pal;
    final t = Theme.of(context).textTheme;
    final auth = context.watch<AuthStore>();
    final user = auth.user;
    if (user == null) return Scaffold(appBar: AppBar(), body: const Center(child: Text('Please sign in.')));

    return Scaffold(
      appBar: AppBar(title: const Text('Account settings')),
      body: ListView(padding: const EdgeInsets.fromLTRB(16, 8, 16, 32), children: [
        FadeIn(
          child: AppCard(
            child: Row(children: [
              Avatar(user.name, size: 52),
              const SizedBox(width: 14),
              Expanded(
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text(user.name, style: t.titleMedium),
                  Text(user.email, style: t.bodySmall),
                  Text('Member since ${fmtDate(user.createdAt)}', style: t.bodySmall),
                ]),
              ),
            ]),
          ),
        ),
        const SizedBox(height: 14),
        FadeIn(
          index: 1,
          child: _Section(
            icon: Icons.person_rounded,
            title: 'Profile',
            sub: 'Your name as it appears in the academy.',
            child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
              TextField(controller: _name, decoration: const InputDecoration(labelText: 'Name')),
              const SizedBox(height: 10),
              FilledButton(
                onPressed: _busy == 'name' ? null : () => _run('name', () => auth.updateName(_name.text.trim()), 'Name updated.'),
                child: const Text('Save name'),
              ),
              _status('name'),
              if (!user.isAdmin) ...[
                const SizedBox(height: 16),
                TextField(controller: _certName, maxLength: 60, decoration: const InputDecoration(labelText: 'Name on certificates', counterText: '')),
                const SizedBox(height: 10),
                OutlinedButton(
                  onPressed: () {
                    context.read<ProgressStore>().setName(_certName.text.trim());
                    setState(() => _msg['cert'] = (true, 'Certificate name saved.'));
                  },
                  child: const Text('Save certificate name'),
                ),
                _status('cert'),
              ],
            ]),
          ),
        ),
        const SizedBox(height: 14),
        FadeIn(
          index: 2,
          child: _Section(
            icon: Icons.key_rounded,
            title: 'Change password',
            sub: 'Changing it signs you out on every other device.',
            child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
              TextField(controller: _cur, obscureText: !_show, decoration: const InputDecoration(labelText: 'Current password')),
              const SizedBox(height: 10),
              TextField(controller: _next, obscureText: !_show, decoration: const InputDecoration(labelText: 'New password', hintText: 'At least 8 characters')),
              const SizedBox(height: 10),
              TextField(controller: _confirm, obscureText: !_show, decoration: const InputDecoration(labelText: 'Confirm new password')),
              Align(
                alignment: Alignment.centerLeft,
                child: TextButton.icon(
                  onPressed: () => setState(() => _show = !_show),
                  icon: Icon(_show ? Icons.visibility_off_rounded : Icons.visibility_rounded, size: 18),
                  label: Text(_show ? 'Hide passwords' : 'Show passwords'),
                ),
              ),
              FilledButton(
                onPressed: _busy == 'pw'
                    ? null
                    : () {
                        if (_next.text != _confirm.text) {
                          setState(() => _msg['pw'] = (false, 'The new passwords do not match.'));
                          return;
                        }
                        _run('pw', () async {
                          await auth.changePassword(_cur.text, _next.text);
                          _cur.clear();
                          _next.clear();
                          _confirm.clear();
                        }, 'Password changed. You have been signed out on your other devices.');
                      },
                child: Text(_busy == 'pw' ? 'Changing…' : 'Change password'),
              ),
              _status('pw'),
            ]),
          ),
        ),
        if (!user.isAdmin) ...[
          const SizedBox(height: 14),
          FadeIn(
            index: 3,
            child: _Section(
              icon: Icons.delete_outline_rounded,
              danger: true,
              title: 'Delete my account',
              sub: 'Ask an administrator to permanently delete your account and all saved progress.',
              child: user.deletionRequestedAt != null
                  ? Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(color: p.warnSoft, borderRadius: BorderRadius.circular(12)),
                        child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
                          Icon(Icons.schedule_rounded, color: p.warn),
                          const SizedBox(width: 10),
                          Expanded(
                            child: Text(
                              'Deletion requested on ${fmtDate(user.deletionRequestedAt)}. An administrator will review it. Until then you can keep learning, or change your mind.',
                              style: t.bodyMedium,
                            ),
                          ),
                        ]),
                      ),
                      const SizedBox(height: 10),
                      OutlinedButton(
                        onPressed: _busy == 'del' ? null : () => _run('del', auth.cancelDeletion, 'Request cancelled. Your account will be kept.'),
                        child: const Text('Cancel the request'),
                      ),
                      _status('del'),
                    ])
                  : Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
                      Text('Deleting removes your name, email and every lesson, quiz, exam and certificate saved to your account. It cannot be undone.', style: t.bodyMedium?.copyWith(color: p.muted)),
                      const SizedBox(height: 10),
                      TextField(controller: _reason, maxLines: 3, maxLength: 1000, decoration: const InputDecoration(labelText: 'Reason (optional)', counterText: '')),
                      const SizedBox(height: 10),
                      FilledButton.icon(
                        style: FilledButton.styleFrom(backgroundColor: p.bad),
                        onPressed: () async {
                          final ok = await showDialog<bool>(
                            context: context,
                            builder: (c) => AlertDialog(
                              title: const Text('Request account deletion?'),
                              content: const Text('An administrator will permanently delete your account and all of its progress. You can cancel the request until then.'),
                              actions: [
                                TextButton(onPressed: () => Navigator.pop(c, false), child: const Text('Keep my account')),
                                FilledButton(style: FilledButton.styleFrom(backgroundColor: p.bad), onPressed: () => Navigator.pop(c, true), child: const Text('Send request')),
                              ],
                            ),
                          );
                          if (ok == true) _run('del', () => auth.requestDeletion(_reason.text.trim()), 'Request sent. An administrator will review it.');
                        },
                        icon: const Icon(Icons.delete_outline_rounded),
                        label: const Text('Request account deletion'),
                      ),
                      _status('del'),
                    ]),
            ),
          ),
        ],
      ]),
    );
  }
}

class _Section extends StatelessWidget {
  final IconData icon;
  final String title, sub;
  final Widget child;
  final bool danger;
  const _Section({required this.icon, required this.title, required this.sub, required this.child, this.danger = false});

  @override
  Widget build(BuildContext context) {
    final p = context.pal;
    final t = Theme.of(context).textTheme;
    return AppCard(
      borderColor: danger ? p.bad.withValues(alpha: 0.35) : null,
      padding: const EdgeInsets.all(16),
      child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
        Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
          IconTile(icon, color: danger ? p.bad : p.accent, size: 38),
          const SizedBox(width: 12),
          Expanded(
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(title, style: t.titleMedium),
              Text(sub, style: t.bodySmall),
            ]),
          ),
        ]),
        const SizedBox(height: 14),
        child,
      ]),
    );
  }
}
