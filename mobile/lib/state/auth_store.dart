import 'dart:async';
import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../core/api.dart';
import 'progress_store.dart';

class AppUser {
  final String id;
  final String name;
  final String email;
  final String role;
  final String createdAt;
  final String? lastSeenAt;
  final String? deletionRequestedAt;

  AppUser.fromJson(Map<String, dynamic> j)
      : id = j['id'] as String,
        name = j['name'] as String,
        email = j['email'] as String,
        role = j['role'] as String? ?? 'user',
        createdAt = j['createdAt'] as String? ?? '',
        lastSeenAt = j['lastSeenAt'] as String?,
        deletionRequestedAt = j['deletionRequestedAt'] as String?;

  Map<String, dynamic> toJson() => {
        'id': id,
        'name': name,
        'email': email,
        'role': role,
        'createdAt': createdAt,
        'lastSeenAt': lastSeenAt,
        'deletionRequestedAt': deletionRequestedAt,
      };

  bool get isAdmin => role == 'admin';
}

enum SyncStatus { local, saving, saved, offline, error }

/// Sign-in plus progress sync. Mirrors client/src/lib/auth.ts so the app and the website agree
/// on whose progress is on the device and when to merge.
class AuthStore extends ChangeNotifier {
  static const _userKey = 'aiguide-user';
  static const _metaKey = 'aiguide-sync';
  static const _onboardKey = 'onboarded';

  final SharedPreferences prefs;
  final Api api;
  final ProgressStore progress;

  AppUser? user;
  bool ready = false;
  SyncStatus sync = SyncStatus.local;
  DateTime? syncedAt;
  Timer? _timer;
  Future<void>? _inflight;

  AuthStore(this.prefs, this.api, this.progress) {
    if (api.token != null) {
      final raw = prefs.getString(_userKey);
      if (raw != null) user = AppUser.fromJson(jsonDecode(raw) as Map<String, dynamic>);
    } else {
      ready = true;
    }
    progress.onLocalChange = _onLocalChange;
  }

  bool get onboarded => prefs.getBool(_onboardKey) ?? false;
  Future<void> setOnboarded() async {
    await prefs.setBool(_onboardKey, true);
    notifyListeners();
  }

  bool get _learner => user != null && !user!.isAdmin;

  // ------------------------------------------------------------------ meta
  Map<String, dynamic> _meta() {
    try {
      return jsonDecode(prefs.getString(_metaKey) ?? '') as Map<String, dynamic>;
    } catch (_) {
      return {'owner': null, 'dirty': false};
    }
  }

  void _setMeta({Object? owner = _keep, bool? dirty}) {
    final m = _meta();
    if (owner != _keep) m['owner'] = owner;
    if (dirty != null) m['dirty'] = dirty;
    prefs.setString(_metaKey, jsonEncode(m));
  }

  static const _keep = Object();

  void _setUser(AppUser? u) {
    user = u;
    if (u == null) {
      prefs.remove(_userKey);
    } else {
      prefs.setString(_userKey, jsonEncode(u.toJson()));
    }
    notifyListeners();
  }

  void _status(SyncStatus s) {
    sync = s;
    if (s == SyncStatus.saved) syncedAt = DateTime.now();
    notifyListeners();
  }

  // ------------------------------------------------------------------ merge
  static int? _minT(Object? a, Object? b) {
    final x = (a as num?)?.toInt(), y = (b as num?)?.toInt();
    if (x != null && y != null) return x < y ? x : y;
    return x ?? y;
  }

  /// Combines two progress documents without losing anything either side achieved.
  static Map<String, dynamic> merge(Map<String, dynamic> a, Map<String, dynamic> b) {
    final m = ProgressStore.m;
    final out = <String, dynamic>{...a, 'name': (a['name'] as String? ?? '').isNotEmpty ? a['name'] : b['name']};

    final lessons = {...m(a['lessons'])};
    m(b['lessons']).forEach((id, l) {
      final x = m(lessons[id]), y = m(l);
      lessons[id] = {'visitedAt': _minT(x['visitedAt'], y['visitedAt']), 'completedAt': _minT(x['completedAt'], y['completedAt'])}..removeWhere((_, v) => v == null);
    });
    out['lessons'] = lessons;

    final quizzes = {...m(a['quizzes'])};
    m(b['quizzes']).forEach((id, q) {
      final x = quizzes[id] == null ? null : m(quizzes[id]);
      final y = m(q);
      if (x == null) {
        quizzes[id] = y;
      } else {
        final keep = m(y['results']).length > m(x['results']).length ? y : x;
        quizzes[id] = {
          ...keep,
          'attempts': [((x['attempts'] as num?) ?? 0), ((y['attempts'] as num?) ?? 0)].reduce((p, n) => p > n ? p : n),
          'best': [((x['best'] as num?) ?? 0), ((y['best'] as num?) ?? 0)].reduce((p, n) => p > n ? p : n),
          'passedAt': _minT(x['passedAt'], y['passedAt']),
        }..removeWhere((_, v) => v == null);
      }
    });
    out['quizzes'] = quizzes;

    final exams = {...m(a['exams'])};
    m(b['exams']).forEach((id, e) {
      final x = exams[id] == null ? null : m(exams[id]);
      final y = m(e);
      if (x == null) {
        exams[id] = y;
      } else {
        final xl = m(x['last']), yl = m(y['last']);
        final last = ((xl['finishedAt'] as num?) ?? 0) >= ((yl['finishedAt'] as num?) ?? 0) ? x['last'] : y['last'];
        exams[id] = {
          'attempts': [((x['attempts'] as num?) ?? 0), ((y['attempts'] as num?) ?? 0)].reduce((p, n) => p > n ? p : n),
          'best': [((x['best'] as num?) ?? 0), ((y['best'] as num?) ?? 0)].reduce((p, n) => p > n ? p : n),
          'passedAt': _minT(x['passedAt'], y['passedAt']),
          'last': last,
          'current': x['current'] ?? y['current'],
        }..removeWhere((_, v) => v == null);
      }
    });
    out['exams'] = exams;

    final code = {...m(a['code'])};
    m(b['code']).forEach((id, c) {
      final x = m(code[id]), y = m(c);
      code[id] = {'code': x['code'] ?? y['code'], 'passedAt': _minT(x['passedAt'], y['passedAt'])}..removeWhere((_, v) => v == null);
    });
    out['code'] = code;

    final projects = {...m(a['projects'])};
    m(b['projects']).forEach((id, ms) {
      final x = {...m(projects[id])};
      m(ms).forEach((k, v) => x[k] = x[k] == true || v == true);
      projects[id] = x;
    });
    out['projects'] = projects;

    final certs = {...m(a['certificates'])};
    m(b['certificates']).forEach((k, c) => certs[k] = {'issuedAt': _minT(m(certs[k])['issuedAt'], m(c)['issuedAt'])});
    out['certificates'] = certs;

    final activity = {...m(a['activity'])};
    m(b['activity']).forEach((d, n) => activity[d] = [((activity[d] as num?) ?? 0), (n as num)].reduce((p, q) => p > q ? p : q));
    out['activity'] = activity;

    final al = a['last'] == null ? null : m(a['last']), bl = b['last'] == null ? null : m(b['last']);
    out['last'] = ((al?['at'] as num?) ?? 0) >= ((bl?['at'] as num?) ?? 0) ? al : bl;
    if (out['last'] == null) out.remove('last');
    return out;
  }

  static bool _hasAny(Map<String, dynamic> p) =>
      ['lessons', 'quizzes', 'exams', 'code', 'projects'].any((k) => ProgressStore.m(p[k]).isNotEmpty);

  // ------------------------------------------------------------------ sync
  void _onLocalChange() {
    if (!_learner) return;
    _setMeta(dirty: true);
    _timer?.cancel();
    _timer = Timer(const Duration(milliseconds: 1200), () => push());
  }

  Future<void> push() async {
    if (!_learner) return;
    _timer?.cancel();
    if (_inflight != null) await _inflight!.catchError((_) {});
    _status(SyncStatus.saving);
    final run = () async {
      try {
        await api.call('/progress', method: 'PUT', body: {'progress': progress.snapshot()});
        _setMeta(owner: user!.id, dirty: false);
        _status(SyncStatus.saved);
      } on ApiError catch (e) {
        if (e.status == 401) return _signOutLocal();
        _status(e.offline ? SyncStatus.offline : SyncStatus.error);
        _timer = Timer(const Duration(seconds: 15), () => push());
      }
    }();
    _inflight = run;
    await run;
  }

  /// Fetch the account's progress and reconcile it with what is on this device.
  Future<void> pull() async {
    final u = user;
    if (u == null) return;
    if (u.isAdmin) return _status(SyncStatus.local);
    _status(SyncStatus.saving);
    final res = await api.call('/progress');
    final remote = res['progress'] == null ? null : ProgressStore.m(res['progress']);
    final meta = _meta();
    final local = progress.snapshot();
    final mine = meta['owner'] == u.id;
    final guest = meta['owner'] == null;
    final dirty = meta['dirty'] == true;

    Map<String, dynamic> next;
    bool needsPush;
    if (remote == null) {
      next = mine || guest ? local : {...ProgressStore.empty(), 'theme': local['theme']};
      needsPush = true;
    } else if (mine && !dirty) {
      next = remote;
      needsPush = false;
    } else if ((mine && dirty) || (guest && _hasAny(local))) {
      next = merge(local, remote);
      needsPush = true;
    } else {
      next = remote;
      needsPush = false;
    }
    if ((next['name'] as String? ?? '').isEmpty) {
      next = {...next, 'name': u.name};
      needsPush = true;
    }
    progress.importData(next, silent: true);
    _setMeta(owner: u.id, dirty: needsPush);
    if (needsPush) {
      await push();
    } else {
      _status(SyncStatus.saved);
    }
  }

  void _signOutLocal() {
    _timer?.cancel();
    api.setToken(null);
    _setMeta(owner: null, dirty: false);
    progress.reset(silent: true);
    user = null;
    prefs.remove(_userKey);
    ready = true;
    sync = SyncStatus.local;
    notifyListeners();
  }

  // ------------------------------------------------------------------ public
  Future<void> start() async {
    if (api.token == null) return;
    try {
      final r = await api.call('/auth/me');
      _setUser(AppUser.fromJson(ProgressStore.m(r['user'])));
      ready = true;
      notifyListeners();
      await pull();
    } on ApiError catch (e) {
      if (e.status == 401) return _signOutLocal();
      ready = true;
      _status(SyncStatus.offline);
    }
  }

  Future<void> _signedIn(Map<String, dynamic> r) async {
    await api.setToken(r['token'] as String);
    _setUser(AppUser.fromJson(ProgressStore.m(r['user'])));
    ready = true;
    await setOnboarded();
    try {
      await pull();
    } catch (_) {
      _status(SyncStatus.offline);
    }
  }

  Future<void> login(String email, String password) async =>
      _signedIn(await api.call('/auth/login', body: {'email': email, 'password': password}));

  Future<void> register(String name, String email, String password) async =>
      _signedIn(await api.call('/auth/register', body: {'name': name, 'email': email, 'password': password}));

  Future<void> logout() async {
    if (_meta()['dirty'] == true) {
      try {
        await push();
      } catch (_) {}
    }
    _signOutLocal();
  }

  Future<void> updateName(String name) async {
    final r = await api.call('/auth/me', method: 'PATCH', body: {'name': name});
    _setUser(AppUser.fromJson(ProgressStore.m(r['user'])));
  }

  Future<void> changePassword(String current, String next) async {
    final r = await api.call('/auth/password', body: {'currentPassword': current, 'newPassword': next});
    await api.setToken(r['token'] as String);
    _setUser(AppUser.fromJson(ProgressStore.m(r['user'])));
  }

  Future<void> requestDeletion(String reason) async {
    final r = await api.call('/auth/deletion-request', body: {'reason': reason});
    _setUser(AppUser.fromJson(ProgressStore.m(r['user'])));
  }

  Future<void> cancelDeletion() async {
    final r = await api.call('/auth/deletion-request', method: 'DELETE');
    _setUser(AppUser.fromJson(ProgressStore.m(r['user'])));
  }

  /// Save anything pending, e.g. when the app goes to the background.
  void flush() {
    if (_learner && _meta()['dirty'] == true) push();
  }
}
