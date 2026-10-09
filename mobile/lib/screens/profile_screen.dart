import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';

import '../core/api.dart';
import '../state/auth_store.dart';
import '../theme/app_theme.dart';
import '../widgets/ui.dart';
import 'account_screen.dart';
import 'appearance_screen.dart';
import 'auth_screen.dart';
import 'nav.dart';

/// The "Me" tab (and the admin's Settings tab): account, appearance, server, policies, sign out.
class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final p = context.pal;
    final t = Theme.of(context).textTheme;
    final auth = context.watch<AuthStore>();
    final api = context.read<Api>();
    final user = auth.user;

    void open(String route) => launchUrl(Uri.parse(api.siteUrl(route)), mode: LaunchMode.externalApplication);

    return SafeArea(
      bottom: false,
      child: ListView(
        padding: const EdgeInsets.fromLTRB(20, 18, 20, 28),
        children: [
          FadeIn(child: Text(user?.isAdmin == true ? 'Settings' : 'Me', style: t.headlineMedium)),
          const SizedBox(height: 16),
          FadeIn(
            index: 1,
            child: user == null
                ? AppCard(
                    padding: EdgeInsets.zero,
                    child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
                      Container(height: 5, decoration: BoxDecoration(gradient: p.gradient)),
                      Padding(
                        padding: const EdgeInsets.all(18),
                        child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
                          Text('You are learning as a guest', style: t.titleMedium),
                          const SizedBox(height: 4),
                          Text('Progress is saved on this phone only. Create a free account to keep it safe and continue on the website.', style: t.bodyMedium?.copyWith(color: p.muted)),
                          const SizedBox(height: 14),
                          GradientButton(label: 'Create account', icon: Icons.person_add_alt_1_rounded, expand: true, onPressed: () => push(context, const AuthScreen(register: true))),
                          const SizedBox(height: 8),
                          OutlinedButton(onPressed: () => push(context, const AuthScreen(register: false)), child: const Text('Sign in')),
                        ]),
                      ),
                    ]),
                  )
                : AppCard(
                    child: Row(children: [
                      Avatar(user.name, size: 54),
                      const SizedBox(width: 14),
                      Expanded(
                        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                          Row(children: [
                            Flexible(child: Text(user.name, style: t.titleMedium, overflow: TextOverflow.ellipsis)),
                            if (user.isAdmin) ...[const SizedBox(width: 6), Pill('ADMIN', icon: Icons.shield_rounded, color: p.accentInk, background: p.accentSoft)],
                          ]),
                          Text(user.email, style: t.bodySmall, overflow: TextOverflow.ellipsis),
                          if (!user.isAdmin) ...[const SizedBox(height: 6), _SyncLine(auth: auth)],
                        ]),
                      ),
                    ]),
                  ),
          ),
          const SizedBox(height: 18),
          FadeIn(
            index: 2,
            child: _Group(children: [
              if (user != null) _Item(icon: Icons.key_rounded, title: 'Account settings', sub: 'Name, password and account deletion', onTap: () => push(context, const AccountScreen())),
              _Item(icon: Icons.palette_rounded, title: 'Appearance', sub: 'Themes, fonts, reading size and motion', onTap: () => push(context, const AppearanceScreen())),
              _Item(icon: Icons.dns_rounded, title: 'Server', sub: api.serverUrl, onTap: () => _editServer(context)),
            ]),
          ),
          const SizedBox(height: 14),
          FadeIn(
            index: 3,
            child: _Group(children: [
              _Item(icon: Icons.language_rounded, title: 'Open the website', onTap: () => open('/'), external: true),
              _Item(icon: Icons.privacy_tip_rounded, title: 'Privacy policy', onTap: () => open('/privacy'), external: true),
              _Item(icon: Icons.gavel_rounded, title: 'Terms of use', onTap: () => open('/terms'), external: true),
              _Item(icon: Icons.cookie_rounded, title: 'Cookies and storage', onTap: () => open('/cookies'), external: true),
            ]),
          ),
          if (user != null) ...[
            const SizedBox(height: 14),
            FadeIn(
              index: 4,
              child: _Group(children: [
                _Item(
                  icon: Icons.logout_rounded,
                  title: 'Sign out',
                  danger: true,
                  onTap: () async {
                    final ok = await showDialog<bool>(
                      context: context,
                      builder: (c) => AlertDialog(
                        title: const Text('Sign out?'),
                        content: const Text('Your progress stays in your account. It will be removed from this phone.'),
                        actions: [
                          TextButton(onPressed: () => Navigator.pop(c, false), child: const Text('Cancel')),
                          FilledButton(onPressed: () => Navigator.pop(c, true), child: const Text('Sign out')),
                        ],
                      ),
                    );
                    if (ok == true && context.mounted) await context.read<AuthStore>().logout();
                  },
                ),
              ]),
            ),
          ],
          const SizedBox(height: 24),
          Center(child: Text('The AI Guide Academy · mobile 1.0', style: t.bodySmall)),
        ],
      ),
    );
  }

  Future<void> _editServer(BuildContext context) async {
    final api = context.read<Api>();
    final ctl = TextEditingController(text: api.serverUrl);
    final url = await showDialog<String>(
      context: context,
      builder: (c) => AlertDialog(
        title: const Text('Server address'),
        content: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.start, children: [
          const Text('The address of the academy server (it serves both the website and the API).'),
          const SizedBox(height: 12),
          TextField(controller: ctl, keyboardType: TextInputType.url, decoration: const InputDecoration(hintText: 'https://academy.example.com')),
        ]),
        actions: [
          TextButton(onPressed: () => Navigator.pop(c), child: const Text('Cancel')),
          FilledButton(onPressed: () => Navigator.pop(c, ctl.text), child: const Text('Save')),
        ],
      ),
    );
    if (url != null && url.trim().isNotEmpty) {
      await api.setServerUrl(url);
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Server address saved.')));
        context.read<AuthStore>().start();
      }
    }
  }
}

class _SyncLine extends StatelessWidget {
  final AuthStore auth;
  const _SyncLine({required this.auth});

  @override
  Widget build(BuildContext context) {
    final p = context.pal;
    final (IconData icon, Color color, String text) = switch (auth.sync) {
      SyncStatus.saving => (Icons.sync_rounded, p.accent, 'Saving…'),
      SyncStatus.saved => (Icons.cloud_done_rounded, p.ok, 'Synced with your account'),
      SyncStatus.offline => (Icons.cloud_off_rounded, p.warn, 'Offline, will sync later'),
      SyncStatus.error => (Icons.error_outline_rounded, p.bad, 'Could not sync, retrying'),
      SyncStatus.local => (Icons.cloud_queue_rounded, p.muted, 'Waiting to sync'),
    };
    return Row(children: [
      Icon(icon, size: 15, color: color),
      const SizedBox(width: 5),
      Flexible(child: Text(text, style: TextStyle(fontSize: 12.5, color: color, fontWeight: FontWeight.w600))),
    ]);
  }
}

class _Group extends StatelessWidget {
  final List<Widget> children;
  const _Group({required this.children});

  @override
  Widget build(BuildContext context) => AppCard(
        padding: EdgeInsets.zero,
        child: Column(children: [
          for (var i = 0; i < children.length; i++) ...[if (i > 0) const Divider(indent: 56), children[i]],
        ]),
      );
}

class _Item extends StatelessWidget {
  final IconData icon;
  final String title;
  final String? sub;
  final VoidCallback onTap;
  final bool danger;
  final bool external;
  const _Item({required this.icon, required this.title, this.sub, required this.onTap, this.danger = false, this.external = false});

  @override
  Widget build(BuildContext context) {
    final p = context.pal;
    final color = danger ? p.bad : p.text;
    return ListTile(
      onTap: onTap,
      leading: Icon(icon, color: danger ? p.bad : p.accent),
      title: Text(title, style: TextStyle(fontWeight: FontWeight.w600, color: color)),
      subtitle: sub == null ? null : Text(sub!, maxLines: 1, overflow: TextOverflow.ellipsis, style: TextStyle(color: p.muted, fontSize: 13)),
      trailing: danger ? null : Icon(external ? Icons.open_in_new_rounded : Icons.chevron_right_rounded, color: p.muted, size: external ? 18 : 24),
    );
  }
}
