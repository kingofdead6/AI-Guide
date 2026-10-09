import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/api.dart';
import '../../data/content.dart';
import '../../logic/progress_logic.dart';
import '../../state/progress_store.dart';
import '../../theme/app_theme.dart';
import '../../widgets/ui.dart';
import '../nav.dart';
import '../profile_screen.dart';

/// Admin accounts only see the admin area, like on the website.
class AdminShell extends StatefulWidget {
  const AdminShell({super.key});

  @override
  State<AdminShell> createState() => _AdminShellState();
}

class _AdminShellState extends State<AdminShell> {
  int _tab = 0;
  int _pending = 0;

  @override
  void initState() {
    super.initState();
    _refreshPending();
  }

  Future<void> _refreshPending() async {
    try {
      final s = await context.read<Api>().call('/admin/stats');
      if (mounted) setState(() => _pending = (s['deletionRequests'] as num?)?.toInt() ?? 0);
    } catch (_) {}
  }

  @override
  Widget build(BuildContext context) {
    final pages = [
      AdminUsersScreen(onChanged: _refreshPending),
      AdminRequestsScreen(onChanged: _refreshPending),
      const ProfileScreen(),
    ];
    return Scaffold(
      body: AnimatedSwitcher(duration: context.look.d(250), child: KeyedSubtree(key: ValueKey(_tab), child: pages[_tab])),
      bottomNavigationBar: DecoratedBox(
        decoration: BoxDecoration(border: Border(top: BorderSide(color: context.pal.border))),
        child: NavigationBar(
          selectedIndex: _tab,
          onDestinationSelected: (i) {
            setState(() => _tab = i);
            _refreshPending();
          },
          destinations: [
            const NavigationDestination(icon: Icon(Icons.group_outlined), selectedIcon: Icon(Icons.group_rounded), label: 'Learners'),
            NavigationDestination(
              icon: Badge(isLabelVisible: _pending > 0, label: Text('$_pending'), child: const Icon(Icons.person_remove_outlined)),
              selectedIcon: Badge(isLabelVisible: _pending > 0, label: Text('$_pending'), child: const Icon(Icons.person_remove_rounded)),
              label: 'Requests',
            ),
            const NavigationDestination(icon: Icon(Icons.settings_outlined), selectedIcon: Icon(Icons.settings_rounded), label: 'Settings'),
          ],
        ),
      ),
    );
  }
}

/// A learner as returned by the admin API, with progress normalised so the progress logic can run on it.
class AdminLearner {
  final Map<String, dynamic> raw;
  final Map<String, dynamic> progress;
  AdminLearner(this.raw) : progress = {...ProgressStore.empty(), ...ProgressStore.m(raw['progress'])};
  String get id => raw['id'] as String;
  String get name => raw['name'] as String? ?? '';
  String get email => raw['email'] as String? ?? '';
  bool get isAdmin => raw['role'] == 'admin';
  String? get deletionRequestedAt => raw['deletionRequestedAt'] as String?;
  late final Overall o = overall(progress);
  int get started => Content.I.courses.where((c) => courseStatus(progress, c).started).length;
}

// ------------------------------------------------------------------ learners
class AdminUsersScreen extends StatefulWidget {
  final VoidCallback onChanged;
  const AdminUsersScreen({super.key, required this.onChanged});

  @override
  State<AdminUsersScreen> createState() => _AdminUsersScreenState();
}

class _AdminUsersScreenState extends State<AdminUsersScreen> {
  Map<String, dynamic>? _stats;
  List<AdminLearner>? _users;
  String _err = '';
  String _q = '';
  String _sort = 'active';

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final api = context.read<Api>();
    try {
      final r = await Future.wait([api.call('/admin/stats'), api.call('/admin/users')]);
      if (!mounted) return;
      setState(() {
        _err = '';
        _stats = r[0];
        _users = (r[1]['users'] as List).map((u) => AdminLearner(ProgressStore.m(u))).toList();
      });
    } on ApiError catch (e) {
      if (mounted) setState(() => _err = e.message);
    }
  }

  @override
  Widget build(BuildContext context) {
    final p = context.pal;
    final t = Theme.of(context).textTheme;
    final users = _users;
    var list = users ?? <AdminLearner>[];
    if (_q.isNotEmpty) {
      final q = _q.toLowerCase();
      list = list.where((u) => u.name.toLowerCase().contains(q) || u.email.toLowerCase().contains(q)).toList();
    }
    list = [...list]..sort(switch (_sort) {
        'progress' => (a, b) => b.o.lessonsDone - a.o.lessonsDone,
        'certs' => (a, b) => b.o.certified - a.o.certified,
        'name' => (a, b) => a.name.compareTo(b.name),
        _ => (a, b) => (b.raw['lastSeenAt'] as String? ?? '').compareTo(a.raw['lastSeenAt'] as String? ?? ''),
      });
    final certs = (users ?? []).fold<int>(0, (n, u) => n + u.o.certified);

    return SafeArea(
      bottom: false,
      child: RefreshIndicator(
        onRefresh: () async {
          await _load();
          widget.onChanged();
        },
        child: CustomScrollView(slivers: [
          SliverPadding(
            padding: const EdgeInsets.fromLTRB(20, 18, 20, 8),
            sliver: SliverList.list(children: [
              Row(children: [
                Expanded(child: FadeIn(child: Text('Admin panel', style: t.headlineMedium))),
                Pill('ADMIN', icon: Icons.shield_rounded, color: p.accentInk, background: p.accentSoft),
              ]),
              const SizedBox(height: 4),
              Text('Every learner, their activity and their progress in each course.', style: t.bodyMedium?.copyWith(color: p.muted)),
              const SizedBox(height: 16),
              if (_err.isNotEmpty) Padding(padding: const EdgeInsets.only(bottom: 12), child: Notice(_err)),
              GridView.count(
                crossAxisCount: 2,
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                mainAxisSpacing: 10,
                crossAxisSpacing: 10,
                childAspectRatio: 1.55,
                children: [
                  _StatCard(i: 0, icon: Icons.group_rounded, color: p.course[0], value: _stats?['users'] as num?, label: 'Learners'),
                  _StatCard(i: 1, icon: Icons.local_fire_department_rounded, color: p.course[1], value: _stats?['active7'] as num?, label: 'Active this week'),
                  _StatCard(i: 2, icon: Icons.person_add_alt_1_rounded, color: p.course[2], value: _stats?['new7'] as num?, label: 'New this week'),
                  _StatCard(i: 3, icon: Icons.workspace_premium_rounded, color: p.course[3], value: users == null ? null : certs, label: 'Certificates'),
                ],
              ),
              const SizedBox(height: 18),
              TextField(onChanged: (v) => setState(() => _q = v), decoration: const InputDecoration(hintText: 'Search name or email', prefixIcon: Icon(Icons.search_rounded))),
              const SizedBox(height: 10),
              SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                child: Row(children: [
                  for (final s in [('active', 'Last active'), ('progress', 'Most progress'), ('certs', 'Certificates'), ('name', 'Name')])
                    Padding(
                      padding: const EdgeInsets.only(right: 8),
                      child: ChoiceChip(
                        label: Text(s.$2),
                        selected: _sort == s.$1,
                        showCheckmark: false,
                        labelStyle: TextStyle(color: _sort == s.$1 ? p.bg : p.text, fontWeight: FontWeight.w600),
                        onSelected: (_) => setState(() => _sort = s.$1),
                      ),
                    ),
                ]),
              ),
              const SizedBox(height: 10),
            ]),
          ),
          if (users == null && _err.isEmpty)
            const SliverFillRemaining(hasScrollBody: false, child: Center(child: CircularProgressIndicator()))
          else if (list.isEmpty)
            SliverToBoxAdapter(child: EmptyState(icon: Icons.group_outlined, title: _q.isEmpty ? 'No learners yet' : 'No matches', text: _q.isEmpty ? 'Learners appear here once they create an account.' : 'Try another name or email.'))
          else
            SliverPadding(
              padding: const EdgeInsets.fromLTRB(20, 0, 20, 24),
              sliver: SliverList.builder(
                itemCount: list.length,
                itemBuilder: (context, i) {
                  final u = list[i];
                  return FadeIn(
                    index: i,
                    child: Padding(
                      padding: const EdgeInsets.only(bottom: 10),
                      child: AppCard(
                        padding: const EdgeInsets.all(14),
                        onTap: () async {
                          await push(context, AdminUserScreen(id: u.id));
                          _load();
                          widget.onChanged();
                        },
                        child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
                          Row(children: [
                            Avatar(u.name, size: 42),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                                Row(children: [
                                  Flexible(child: Text(u.name, style: t.titleSmall, overflow: TextOverflow.ellipsis)),
                                  if (u.isAdmin) ...[const SizedBox(width: 6), Pill('ADMIN', color: p.accentInk, background: p.accentSoft)],
                                ]),
                                Text(u.email, style: t.bodySmall, overflow: TextOverflow.ellipsis),
                              ]),
                            ),
                            Text(ago(u.raw['lastSeenAt']), style: t.bodySmall),
                          ]),
                          if (u.deletionRequestedAt != null) Padding(padding: const EdgeInsets.only(top: 8), child: Align(alignment: Alignment.centerLeft, child: Pill('DELETION REQUESTED', color: p.bad, background: p.badSoft))),
                          const SizedBox(height: 10),
                          Row(children: [
                            Expanded(child: Bar(value: u.o.lessonsTotal == 0 ? 0 : u.o.lessonsDone / u.o.lessonsTotal, height: 6)),
                            const SizedBox(width: 10),
                            Text('${u.o.lessonsDone}/${u.o.lessonsTotal}', style: t.bodySmall?.copyWith(fontWeight: FontWeight.w600)),
                          ]),
                          const SizedBox(height: 6),
                          Text(
                            '${u.started} courses started · ${u.o.answered == 0 ? 'no answers' : '${pct(u.o.accuracy)} accuracy'} · ${u.o.certified} certificates',
                            style: t.bodySmall,
                          ),
                        ]),
                      ),
                    ),
                  );
                },
              ),
            ),
        ]),
      ),
    );
  }
}

class _StatCard extends StatelessWidget {
  final int i;
  final IconData icon;
  final Color color;
  final num? value;
  final String label;
  const _StatCard({required this.i, required this.icon, required this.color, required this.value, required this.label});

  @override
  Widget build(BuildContext context) {
    final t = Theme.of(context).textTheme;
    return FadeIn(
      index: i,
      child: AppCard(
        padding: const EdgeInsets.all(12),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
          IconTile(icon, color: color, size: 32),
          value == null ? Container(height: 26, width: 40, decoration: BoxDecoration(color: context.pal.sunk, borderRadius: BorderRadius.circular(6))) : CountUp(value!, style: t.headlineSmall),
          Text(label, style: t.bodySmall, maxLines: 1, overflow: TextOverflow.ellipsis),
        ]),
      ),
    );
  }
}

// ------------------------------------------------------------------ learner detail
class AdminUserScreen extends StatefulWidget {
  final String id;
  const AdminUserScreen({super.key, required this.id});

  @override
  State<AdminUserScreen> createState() => _AdminUserScreenState();
}

class _AdminUserScreenState extends State<AdminUserScreen> {
  AdminLearner? _u;
  String _err = '';
  bool _busy = false;
  String? _open;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final r = await context.read<Api>().call('/admin/users/${widget.id}');
      if (mounted) setState(() => _u = AdminLearner(ProgressStore.m(r['user'])));
    } on ApiError catch (e) {
      if (mounted) setState(() => _err = e.message);
    }
  }

  Future<void> _act(Future<void> Function() fn) async {
    setState(() => _busy = true);
    try {
      await fn();
    } on ApiError catch (e) {
      if (mounted) setState(() => _err = e.message);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _delete() async {
    final u = _u!;
    final ok = await confirmDelete(context, u.name);
    if (ok != true || !mounted) return;
    await _act(() async {
      await context.read<Api>().call('/admin/users/${u.id}', method: 'DELETE');
      if (mounted) Navigator.of(context).pop();
    });
  }

  @override
  Widget build(BuildContext context) {
    final p = context.pal;
    final t = Theme.of(context).textTheme;
    final u = _u;
    final api = context.read<Api>();
    if (u == null) {
      return Scaffold(appBar: AppBar(), body: Center(child: _err.isNotEmpty ? Padding(padding: const EdgeInsets.all(20), child: Notice(_err)) : const CircularProgressIndicator()));
    }
    final o = u.o;
    final pr = u.progress;
    return Scaffold(
      appBar: AppBar(title: const Text('Learner')),
      body: ListView(padding: const EdgeInsets.fromLTRB(16, 8, 16, 32), children: [
        FadeIn(
          child: Row(children: [
            Avatar(u.name, size: 64),
            const SizedBox(width: 14),
            Expanded(
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text(u.name, style: t.headlineSmall),
                Text(u.email, style: t.bodySmall),
                const SizedBox(height: 4),
                Text('Joined ${fmtDate(u.raw['createdAt'])} · active ${ago(u.raw['lastSeenAt'])}', style: t.bodySmall),
              ]),
            ),
          ]),
        ),
        if (_err.isNotEmpty) Padding(padding: const EdgeInsets.only(top: 12), child: Notice(_err)),
        const SizedBox(height: 14),
        Wrap(spacing: 8, runSpacing: 8, children: [
          OutlinedButton.icon(
            onPressed: _busy
                ? null
                : () => _act(() async {
                      final r = await api.call('/admin/users/${u.id}', method: 'PATCH', body: {'role': u.isAdmin ? 'user' : 'admin'});
                      setState(() => _u = AdminLearner({...u.raw, 'role': ProgressStore.m(r['user'])['role']}));
                    }),
            icon: const Icon(Icons.shield_outlined),
            label: Text(u.isAdmin ? 'Remove admin' : 'Make admin'),
          ),
          OutlinedButton.icon(
            style: OutlinedButton.styleFrom(foregroundColor: p.bad, side: BorderSide(color: p.bad.withValues(alpha: 0.5))),
            onPressed: _busy ? null : _delete,
            icon: const Icon(Icons.delete_outline_rounded),
            label: const Text('Delete'),
          ),
        ]),
        if (u.deletionRequestedAt != null) ...[
          const SizedBox(height: 14),
          AppCard(
            color: p.warnSoft,
            borderColor: p.warn.withValues(alpha: 0.4),
            child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
              Text('Deletion requested ${ago(u.deletionRequestedAt)}', style: t.titleSmall),
              const SizedBox(height: 4),
              Text((u.raw['deletionReason'] as String?)?.isNotEmpty == true ? u.raw['deletionReason'] as String : 'No reason given.', style: t.bodyMedium),
              const SizedBox(height: 10),
              Row(children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: _busy
                        ? null
                        : () => _act(() async {
                              await api.call('/admin/deletion-requests/${u.id}', method: 'DELETE');
                              setState(() => _u = AdminLearner({...u.raw, 'deletionRequestedAt': null}));
                            }),
                    child: const Text('Keep account'),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(child: FilledButton(style: FilledButton.styleFrom(backgroundColor: p.bad), onPressed: _busy ? null : _delete, child: const Text('Delete'))),
              ]),
            ]),
          ),
        ],
        const SizedBox(height: 16),
        Row(children: [
          Expanded(child: _Mini(label: 'lessons', value: '${o.lessonsDone}/${o.lessonsTotal}')),
          const SizedBox(width: 8),
          Expanded(child: _Mini(label: 'accuracy', value: o.answered == 0 ? '—' : pct(o.accuracy))),
          const SizedBox(width: 8),
          Expanded(child: _Mini(label: 'certificates', value: '${o.certified}')),
          const SizedBox(width: 8),
          Expanded(child: _Mini(label: 'streak', value: '${o.streak}')),
        ]),
        const SizedBox(height: 18),
        const SectionTitle('Activity'),
        AppCard(child: Heatmap(activity: ProgressStore.m(pr['activity']))),
        const SizedBox(height: 18),
        const SectionTitle('Course progress', sub: 'Tap a course to see each lesson.'),
        for (final c in Content.I.courses)
          () {
            final s = courseStatus(pr, c);
            final exam = ProgressStore.m(ProgressStore.m(pr['exams'])[c.id]);
            final open = _open == c.id;
            return Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: AppCard(
                padding: EdgeInsets.zero,
                borderColor: open ? p.accent.withValues(alpha: 0.5) : null,
                child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
                  InkWell(
                    onTap: () => setState(() => _open = open ? null : c.id),
                    child: Padding(
                      padding: const EdgeInsets.all(14),
                      child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
                        Row(children: [
                          Container(width: 9, height: 9, decoration: BoxDecoration(color: p.courseColor(c.color), shape: BoxShape.circle)),
                          const SizedBox(width: 8),
                          Expanded(child: Text(c.title, style: t.titleSmall)),
                          Text(
                            s.certified ? 'Certified' : (s.examPassed ? 'Exam passed' : ((exam['attempts'] as num? ?? 0) > 0 ? 'Exam ${pct(s.examBest)}' : (s.started ? 'In progress' : 'Not started'))),
                            style: t.bodySmall?.copyWith(color: s.certified ? p.ok : p.muted, fontWeight: FontWeight.w600),
                          ),
                          AnimatedRotation(turns: open ? 0.25 : 0, duration: context.look.d(200), child: Icon(Icons.chevron_right_rounded, color: p.muted)),
                        ]),
                        const SizedBox(height: 8),
                        Bar(value: s.pct, color: p.courseColor(c.color), height: 5),
                      ]),
                    ),
                  ),
                  AnimatedSize(
                    duration: context.look.d(250),
                    child: !open
                        ? const SizedBox(width: double.infinity)
                        : Padding(
                            padding: const EdgeInsets.fromLTRB(14, 0, 14, 12),
                            child: Column(children: [
                              for (final l in c.lessons)
                                () {
                                  final ls = ProgressStore.m(ProgressStore.m(pr['lessons'])[l.id]);
                                  final q = ProgressStore.m(ProgressStore.m(pr['quizzes'])[l.id]);
                                  final done = ls['completedAt'] != null;
                                  return Padding(
                                    padding: const EdgeInsets.symmetric(vertical: 5),
                                    child: Row(children: [
                                      Icon(done ? Icons.check_circle_rounded : (ls['visitedAt'] != null ? Icons.timelapse_rounded : Icons.radio_button_unchecked_rounded),
                                          size: 18, color: done ? p.ok : (ls['visitedAt'] != null ? p.accent : p.borderStrong)),
                                      const SizedBox(width: 8),
                                      Expanded(child: Text(l.title, style: t.bodyMedium, maxLines: 1, overflow: TextOverflow.ellipsis)),
                                      Text(
                                        (q['attempts'] as num? ?? 0) > 0 ? '${pct(((q['best'] as num?) ?? 0).toDouble())} · ${q['attempts']}×' : (done ? fmtDate(ls['completedAt']) : '—'),
                                        style: t.bodySmall?.copyWith(fontWeight: FontWeight.w600),
                                      ),
                                    ]),
                                  );
                                }(),
                              const Divider(),
                              Row(children: [
                                Icon(Icons.emoji_events_outlined, size: 18, color: s.examPassed ? p.ok : p.muted),
                                const SizedBox(width: 8),
                                Expanded(child: Text('Final exam', style: t.bodyMedium)),
                                Text((exam['attempts'] as num? ?? 0) > 0 ? '${pct(s.examBest)} best · ${exam['attempts']} tries' : 'Not attempted', style: t.bodySmall),
                              ]),
                            ]),
                          ),
                  ),
                ]),
              ),
            );
          }(),
      ]),
    );
  }
}

class _Mini extends StatelessWidget {
  final String label, value;
  const _Mini({required this.label, required this.value});

  @override
  Widget build(BuildContext context) => AppCard(
        padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 8),
        child: Column(children: [
          Text(value, style: Theme.of(context).textTheme.titleMedium),
          Text(label, style: Theme.of(context).textTheme.bodySmall?.copyWith(fontSize: 11.5)),
        ]),
      );
}

Future<bool?> confirmDelete(BuildContext context, String name) => showDialog<bool>(
      context: context,
      builder: (c) => AlertDialog(
        title: Text('Delete $name?'),
        content: const Text('This permanently deletes the account and all of its saved progress. It cannot be undone.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(c, false), child: const Text('Cancel')),
          FilledButton(style: FilledButton.styleFrom(backgroundColor: context.pal.bad), onPressed: () => Navigator.pop(c, true), child: const Text('Delete permanently')),
        ],
      ),
    );

// ------------------------------------------------------------------ deletion requests
class AdminRequestsScreen extends StatefulWidget {
  final VoidCallback onChanged;
  const AdminRequestsScreen({super.key, required this.onChanged});

  @override
  State<AdminRequestsScreen> createState() => _AdminRequestsScreenState();
}

class _AdminRequestsScreenState extends State<AdminRequestsScreen> {
  List<AdminLearner>? _list;
  String _err = '';
  String _done = '';
  String _busy = '';

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final r = await context.read<Api>().call('/admin/deletion-requests');
      if (mounted) setState(() => _list = (r['requests'] as List).map((u) => AdminLearner(ProgressStore.m(u))).toList());
    } on ApiError catch (e) {
      if (mounted) setState(() => _err = e.message);
    }
  }

  Future<void> _act(AdminLearner u, bool delete) async {
    if (delete && await confirmDelete(context, u.name) != true) return;
    if (!mounted) return;
    setState(() => _busy = u.id);
    try {
      await context.read<Api>().call(delete ? '/admin/users/${u.id}' : '/admin/deletion-requests/${u.id}', method: 'DELETE');
      setState(() {
        _list = _list?.where((x) => x.id != u.id).toList();
        _done = delete ? "${u.name}'s account was deleted." : "${u.name}'s request was dismissed; the account is kept.";
      });
      widget.onChanged();
    } on ApiError catch (e) {
      setState(() => _err = e.message);
    } finally {
      if (mounted) setState(() => _busy = '');
    }
  }

  @override
  Widget build(BuildContext context) {
    final p = context.pal;
    final t = Theme.of(context).textTheme;
    final list = _list;
    return SafeArea(
      bottom: false,
      child: RefreshIndicator(
        onRefresh: _load,
        child: ListView(padding: const EdgeInsets.fromLTRB(20, 18, 20, 24), children: [
          FadeIn(child: Text('Deletion requests', style: t.headlineMedium)),
          const SizedBox(height: 4),
          Text('Learners who asked for their account to be deleted.', style: t.bodyMedium?.copyWith(color: p.muted)),
          const SizedBox(height: 14),
          if (_err.isNotEmpty) Padding(padding: const EdgeInsets.only(bottom: 10), child: Notice(_err)),
          if (_done.isNotEmpty) Padding(padding: const EdgeInsets.only(bottom: 10), child: Notice(_done, ok: true)),
          if (list == null && _err.isEmpty)
            const Padding(padding: EdgeInsets.all(40), child: Center(child: CircularProgressIndicator()))
          else if (list != null && list.isEmpty)
            const EmptyState(icon: Icons.check_rounded, title: 'No pending requests', text: 'When a learner asks to delete their account, it shows up here.')
          else
            for (final (i, u) in (list ?? <AdminLearner>[]).indexed)
              FadeIn(
                index: i,
                child: Padding(
                  padding: const EdgeInsets.only(bottom: 12),
                  child: AppCard(
                    child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
                      Row(children: [
                        Avatar(u.name, size: 44),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                            Text(u.name, style: t.titleSmall),
                            Text(u.email, style: t.bodySmall),
                            Text('Requested ${ago(u.deletionRequestedAt)}', style: t.bodySmall?.copyWith(color: p.warn, fontWeight: FontWeight.w600)),
                          ]),
                        ),
                      ]),
                      const SizedBox(height: 10),
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(color: p.sunk, borderRadius: BorderRadius.circular(12), border: Border(left: BorderSide(color: p.accent, width: 3))),
                        child: Text((u.raw['deletionReason'] as String?)?.isNotEmpty == true ? u.raw['deletionReason'] as String : 'No reason given.', style: t.bodyMedium),
                      ),
                      const SizedBox(height: 8),
                      Text('${u.o.lessonsDone}/${u.o.lessonsTotal} lessons · ${u.o.certified} certificates · joined ${fmtDate(u.raw['createdAt'])}', style: t.bodySmall),
                      const SizedBox(height: 12),
                      Row(children: [
                        Expanded(child: OutlinedButton(onPressed: _busy == u.id ? null : () => _act(u, false), child: const Text('Keep account'))),
                        const SizedBox(width: 8),
                        Expanded(
                          child: FilledButton.icon(
                            style: FilledButton.styleFrom(backgroundColor: p.bad),
                            onPressed: _busy == u.id ? null : () => _act(u, true),
                            icon: const Icon(Icons.delete_outline_rounded, size: 18),
                            label: const Text('Delete'),
                          ),
                        ),
                      ]),
                    ]),
                  ),
                ),
              ),
        ]),
      ),
    );
  }
}
