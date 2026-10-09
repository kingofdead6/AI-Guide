import 'dart:async';
import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../logic/grade.dart';

/// The learner's progress, stored as the exact JSON document the website uses
/// (client/src/lib/store.ts), so the two can share one account.
class ProgressStore extends ChangeNotifier {
  static const _key = 'aiguide-progress';
  final SharedPreferences prefs;
  Map<String, dynamic> _d;
  Timer? _saveTimer;

  /// Called after every change made by the learner (not by [importData] with silent: true).
  void Function()? onLocalChange;

  ProgressStore(this.prefs) : _d = empty() {
    final raw = prefs.getString(_key);
    if (raw != null) {
      try {
        _d = {...empty(), ...(jsonDecode(raw) as Map<String, dynamic>)};
      } catch (_) {}
    }
  }

  static Map<String, dynamic> empty() => {
        'version': 1,
        'name': '',
        'theme': 'system',
        'lessons': <String, dynamic>{},
        'quizzes': <String, dynamic>{},
        'exams': <String, dynamic>{},
        'code': <String, dynamic>{},
        'projects': <String, dynamic>{},
        'certificates': <String, dynamic>{},
        'activity': <String, dynamic>{},
      };

  static Map<String, dynamic> m(Object? x) => x is Map<String, dynamic> ? x : (x is Map ? Map<String, dynamic>.from(x) : <String, dynamic>{});

  // ------------------------------------------------------------------ read
  Map<String, dynamic> get data => _d;
  String get name => _d['name'] as String? ?? '';
  String get theme => _d['theme'] as String? ?? 'system';
  Map<String, dynamic> get lessons => m(_d['lessons']);
  Map<String, dynamic> get quizzes => m(_d['quizzes']);
  Map<String, dynamic> get exams => m(_d['exams']);
  Map<String, dynamic> get code => m(_d['code']);
  Map<String, dynamic> get projects => m(_d['projects']);
  Map<String, dynamic> get certificates => m(_d['certificates']);
  Map<String, dynamic> get activity => m(_d['activity']);
  Map<String, dynamic>? get last => _d['last'] == null ? null : m(_d['last']);

  bool lessonDone(String id) => m(lessons[id])['completedAt'] != null;
  bool lessonVisited(String id) => m(lessons[id])['visitedAt'] != null;
  Map<String, dynamic>? quiz(String lessonId) => quizzes[lessonId] == null ? null : m(quizzes[lessonId]);
  Map<String, dynamic>? exam(String courseId) => exams[courseId] == null ? null : m(exams[courseId]);

  /// A deep copy, safe to send to the server.
  Map<String, dynamic> snapshot() => jsonDecode(jsonEncode(_d)) as Map<String, dynamic>;

  // ------------------------------------------------------------------ write
  static int now() => DateTime.now().millisecondsSinceEpoch;

  static String dayKey([int? t]) {
    final d = DateTime.fromMillisecondsSinceEpoch(t ?? now());
    return '${d.year}-${d.month.toString().padLeft(2, '0')}-${d.day.toString().padLeft(2, '0')}';
  }

  void _bump() {
    final a = activity;
    final k = dayKey();
    a[k] = ((a[k] as num?) ?? 0) + 1;
    _d['activity'] = a;
  }

  void _changed({bool local = true}) {
    notifyListeners();
    _saveTimer?.cancel();
    _saveTimer = Timer(const Duration(milliseconds: 250), () => prefs.setString(_key, jsonEncode(_d)));
    if (local) onLocalChange?.call();
  }

  void setName(String name) {
    _d['name'] = name.length > 80 ? name.substring(0, 80) : name;
    _changed();
  }

  void setTheme(String t) {
    _d['theme'] = t;
    _changed();
  }

  void visit(String courseId, String lessonId) {
    final l = lessons;
    final cur = m(l[lessonId]);
    l[lessonId] = {...cur, 'visitedAt': cur['visitedAt'] ?? now()};
    _d['lessons'] = l;
    _d['last'] = {'courseId': courseId, 'lessonId': lessonId, 'at': now()};
    _changed();
  }

  Map<String, dynamic> _quizOrNew(String lessonId) => quiz(lessonId) ?? {'answers': <String, dynamic>{}, 'results': <String, dynamic>{}, 'attempts': 0, 'best': 0};

  void answer(String lessonId, String qid, Object a) {
    final q = _quizOrNew(lessonId);
    if (m(q['results']).containsKey(qid)) return;
    q['answers'] = {...m(q['answers']), qid: a};
    _d['quizzes'] = {...quizzes, lessonId: q};
    _changed();
  }

  void check(String lessonId, String qid, bool correct, int total) {
    final q = _quizOrNew(lessonId);
    final results = m(q['results']);
    if (results.containsKey(qid)) return;
    results[qid] = correct;
    q['results'] = results;
    _bump();
    if (results.length >= total) {
      final score = results.values.where((v) => v == true).length / total;
      q['attempts'] = ((q['attempts'] as num?) ?? 0) + 1;
      q['last'] = score;
      q['best'] = score > ((q['best'] as num?) ?? 0) ? score : q['best'];
      if (score >= lessonPass) {
        q['passedAt'] ??= now();
        final l = lessons;
        final cur = m(l[lessonId]);
        l[lessonId] = {...cur, 'completedAt': cur['completedAt'] ?? now()};
        _d['lessons'] = l;
      }
    }
    _d['quizzes'] = {...quizzes, lessonId: q};
    _changed();
  }

  void retryQuiz(String lessonId) {
    final q = quiz(lessonId);
    if (q == null) return;
    q['answers'] = <String, dynamic>{};
    q['results'] = <String, dynamic>{};
    _d['quizzes'] = {...quizzes, lessonId: q};
    _changed();
  }

  void startExam(String courseId, List<String> qids) {
    final e = exam(courseId) ?? {'attempts': 0, 'best': 0};
    e['current'] = {'qids': qids, 'answers': <String, dynamic>{}, 'startedAt': now()};
    _d['exams'] = {...exams, courseId: e};
    _changed();
  }

  void examAnswer(String courseId, String qid, Object a) {
    final e = exam(courseId);
    if (e == null || e['current'] == null) return;
    final cur = m(e['current']);
    cur['answers'] = {...m(cur['answers']), qid: a};
    e['current'] = cur;
    _d['exams'] = {...exams, courseId: e};
    _changed();
  }

  /// Returns the score.
  double submitExam(String courseId, Map<String, bool> results) {
    final e = exam(courseId);
    if (e == null || e['current'] == null) return 0;
    final cur = m(e['current']);
    final n = (cur['qids'] as List).length;
    final score = n == 0 ? 0.0 : results.values.where((v) => v).length / n;
    final best = (e['best'] as num?) ?? 0;
    _bump();
    _d['exams'] = {
      ...exams,
      courseId: {
        'attempts': ((e['attempts'] as num?) ?? 0) + 1,
        'best': score > best ? score : best,
        'passedAt': score >= examPass ? (e['passedAt'] ?? now()) : e['passedAt'],
        'last': {'qids': cur['qids'], 'answers': cur['answers'], 'results': results, 'score': score, 'finishedAt': now()},
      }..removeWhere((_, v) => v == null),
    };
    _changed();
    return score;
  }

  void abandonExam(String courseId) {
    final e = exam(courseId);
    if (e == null) return;
    e.remove('current');
    _d['exams'] = {...exams, courseId: e};
    _changed();
  }

  void saveCode(String id, String src) {
    _d['code'] = {...code, id: {...m(code[id]), 'code': src}};
    _changed();
  }

  void codePassed(String id) {
    final c = m(code[id]);
    if (c['passedAt'] == null) _bump();
    _d['code'] = {...code, id: {...c, 'passedAt': c['passedAt'] ?? now()}};
    _changed();
  }

  void toggleMilestone(String projectId, String milestoneId) {
    final p = m(projects[projectId]);
    p[milestoneId] = !(p[milestoneId] == true);
    if (p[milestoneId] == true) _bump();
    _d['projects'] = {...projects, projectId: p};
    _changed();
  }

  void issueCertificate(String key) {
    if (certificates[key] != null) return;
    _d['certificates'] = {...certificates, key: {'issuedAt': now()}};
    _changed();
  }

  /// Replaces everything except the theme. [silent] = true when the change came from the server.
  void importData(Map<String, dynamic> data, {bool silent = false}) {
    final theme = this.theme;
    _d = {...empty(), ...jsonDecode(jsonEncode(data)) as Map<String, dynamic>, 'version': 1, 'theme': theme};
    _changed(local: !silent);
  }

  void reset({bool silent = false}) {
    final theme = this.theme;
    _d = {...empty(), 'theme': theme};
    _changed(local: !silent);
  }
}
