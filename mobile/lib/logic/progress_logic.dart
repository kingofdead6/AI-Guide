/// Port of client/src/lib/progress.ts.
library;

import '../data/content.dart';
import '../data/models.dart';
import '../state/progress_store.dart';
import 'grade.dart';

class CourseStatus {
  final int done;
  final int total;
  final bool started;
  final bool examPassed;
  final double examBest;
  CourseStatus(this.done, this.total, this.started, this.examPassed, this.examBest);
  double get pct => total == 0 ? 0 : done / total;
  bool get lessonsComplete => done == total;
  bool get certified => lessonsComplete && examPassed;
}

typedef P = Map<String, dynamic>;
P _m(Object? x) => ProgressStore.m(x);

CourseStatus courseStatus(P p, Course c) {
  final lessons = _m(p['lessons']);
  final done = c.lessons.where((l) => _m(lessons[l.id])['completedAt'] != null).length;
  final started = done > 0 || c.lessons.any((l) => _m(lessons[l.id])['visitedAt'] != null);
  final exam = _m(_m(p['exams'])[c.id]);
  return CourseStatus(done, c.lessons.length, started, exam['passedAt'] != null, ((exam['best'] as num?) ?? 0).toDouble());
}

bool programComplete(P p) => Content.I.courses.every((c) => courseStatus(p, c).certified);

class Overall {
  final int lessonsTotal, lessonsDone, answered, correct, certified, codePassed, streak;
  Overall(this.lessonsTotal, this.lessonsDone, this.answered, this.correct, this.certified, this.codePassed, this.streak);
  double get accuracy => answered == 0 ? 0 : correct / answered;
}

Overall overall(P p) {
  final courses = Content.I.courses;
  final lessons = _m(p['lessons']);
  final total = courses.fold<int>(0, (n, c) => n + c.lessons.length);
  final done = courses.fold<int>(0, (n, c) => n + c.lessons.where((l) => _m(lessons[l.id])['completedAt'] != null).length);
  var answered = 0, correct = 0;
  for (final q in _m(p['quizzes']).values) {
    for (final ok in _m(_m(q)['results']).values) {
      answered++;
      if (ok == true) correct++;
    }
  }
  for (final e in _m(p['exams']).values) {
    final last = _m(e)['last'];
    if (last == null) continue;
    for (final ok in _m(_m(last)['results']).values) {
      answered++;
      if (ok == true) correct++;
    }
  }
  final certified = courses.where((c) => courseStatus(p, c).certified).length;
  final codePassed = _m(p['code']).values.where((c) => _m(c)['passedAt'] != null).length;
  return Overall(total, done, answered, correct, certified, codePassed, streak(_m(p['activity'])));
}

/// Consecutive days with activity, ending today (or yesterday, so a streak survives until midnight).
int streak(Map<String, dynamic> activity) {
  var n = 0;
  var t = DateTime.now();
  if (activity[ProgressStore.dayKey(t.millisecondsSinceEpoch)] == null) t = t.subtract(const Duration(days: 1));
  while (activity[ProgressStore.dayKey(t.millisecondsSinceEpoch)] != null) {
    n++;
    t = t.subtract(const Duration(days: 1));
  }
  return n;
}

/// Same deterministic ID as the website: AIG-XXXX-XXXX.
String certificateId(String key, int issuedAt, String name) {
  var h1 = 0x811c9dc5;
  var h2 = 0x01000193;
  final s = '$key|$issuedAt|${name.trim().toLowerCase()}';
  for (var i = 0; i < s.length; i++) {
    h1 = ((h1 ^ s.codeUnitAt(i)) * 16777619) & 0xFFFFFFFF;
    h2 = ((h2 ^ s.codeUnitAt(i)) * 2246822519) & 0xFFFFFFFF;
  }
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  String enc(int n, int len) {
    final b = StringBuffer();
    for (var i = 0; i < len; i++) {
      b.write(alphabet[n % 32]);
      n = n ~/ 32;
    }
    return b.toString();
  }

  return 'AIG-${enc(h1, 4)}-${enc(h2, 4)}';
}

class NextUp {
  final Course course;
  final Lesson lesson;
  final bool resume;
  NextUp(this.course, this.lesson, this.resume);
}

NextUp? nextUp(P p) {
  final lessons = _m(p['lessons']);
  bool done(Lesson l) => _m(lessons[l.id])['completedAt'] != null;
  final last = p['last'] == null ? null : _m(p['last']);
  if (last != null) {
    final c = Content.I.course(last['courseId'] as String?);
    final l = c?.lessons.where((x) => x.id == last['lessonId']).firstOrNull;
    if (c != null && l != null) {
      if (!done(l)) return NextUp(c, l, true);
      final n = c.lessons.where((x) => !done(x)).firstOrNull;
      if (n != null) return NextUp(c, n, false);
    }
  }
  for (final c in Content.I.courses) {
    final l = c.lessons.where((x) => !done(x)).firstOrNull;
    if (l != null) return NextUp(c, l, false);
  }
  return null;
}

String pct(double x) => '${(x * 100).round()}%';
final examPassPct = pct(examPass);
