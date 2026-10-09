/// Port of client/src/lib/grade.ts. Keep the two in step so a question graded on the phone
/// and on the website always gets the same result.
library;

import '../data/models.dart';

const lessonPass = 0.6;
const examPass = 0.7;
const examSize = 20;

/// Parses "0.25", "1/4", "25%", "2.5e-3", "1,200" (thousands) or "0,5" (decimal comma).
double? parseNumber(String input) {
  var s = input.trim().replaceAll(RegExp(r'\s+'), '').replaceAll('−', '-');
  if (s.isEmpty) return null;
  var scale = 1.0;
  if (s.endsWith('%')) {
    scale = 0.01;
    s = s.substring(0, s.length - 1);
  }
  if (RegExp(r'^-?\d{1,3}(,\d{3})+(\.\d+)?$').hasMatch(s)) {
    s = s.replaceAll(',', '');
  } else {
    s = s.replaceFirst(',', '.');
  }
  final frac = RegExp(r'^(-?[\d.]+)/([\d.]+)$').firstMatch(s);
  if (frac != null) {
    final a = double.tryParse(frac.group(1)!);
    final b = double.tryParse(frac.group(2)!);
    if (a == null || b == null) return null;
    final v = a / b;
    return v.isFinite ? v * scale : null;
  }
  final v = double.tryParse(s);
  return v != null && v.isFinite ? v * scale : null;
}

String _norm(String s) {
  const accents = {'à': 'a', 'á': 'a', 'â': 'a', 'ä': 'a', 'ã': 'a', 'è': 'e', 'é': 'e', 'ê': 'e', 'ë': 'e', 'ì': 'i', 'í': 'i', 'î': 'i', 'ï': 'i', 'ò': 'o', 'ó': 'o', 'ô': 'o', 'ö': 'o', 'õ': 'o', 'ù': 'u', 'ú': 'u', 'û': 'u', 'ü': 'u', 'ç': 'c', 'ñ': 'n'};
  final lower = s.toLowerCase().split('').map((ch) => accents[ch] ?? ch).join();
  return lower.replaceAll(RegExp(r'[^a-z0-9+#.\- ]'), ' ').replaceAll(RegExp(r'\s+'), ' ').trim();
}

bool isAnswered(Question q, Object? a) {
  if (a == null) return false;
  switch (q.type) {
    case QType.multi:
      return a is List && a.isNotEmpty;
    case QType.num:
    case QType.text:
      return a is String && a.trim().isNotEmpty;
    default:
      return true;
  }
}

bool grade(Question q, Object? a) {
  if (!isAnswered(q, a)) return false;
  switch (q.type) {
    case QType.single:
      return a is num && a.toInt() == q.answer;
    case QType.tf:
      return a == q.answer;
    case QType.multi:
      final got = (a as List).map((e) => (e as num).toInt()).toList()..sort();
      final want = [...(q.answer as List<int>)]..sort();
      if (got.length != want.length) return false;
      for (var i = 0; i < got.length; i++) {
        if (got[i] != want[i]) return false;
      }
      return true;
    case QType.num:
      final v = parseNumber(a as String);
      if (v == null) return false;
      final ans = (q.answer as num).toDouble();
      final tol = q.tol + 1e-9 * (ans.abs() < 1 ? 1 : ans.abs());
      return (v - ans).abs() <= tol;
    case QType.text:
      final got = _norm(a as String);
      return (q.answer as List<String>).any((acc) => _norm(acc) == got);
  }
}

String _fmtNum(num n) {
  if (n == n.roundToDouble() && n.abs() < 1e15) return n.toInt().toString();
  return n.toString();
}

/// Human-readable correct answer for numeric / text / true-false questions.
String correctLabel(Question q) {
  switch (q.type) {
    case QType.num:
      return q.tol > 0 ? '${_fmtNum(q.answer as num)} (±${double.parse(q.tol.toStringAsPrecision(2))})' : _fmtNum(q.answer as num);
    case QType.text:
      return q.display;
    case QType.tf:
      return q.answer == true ? 'True' : 'False';
    default:
      return '';
  }
}

const typeHint = {
  QType.single: 'Choose one answer',
  QType.multi: 'Select all that apply',
  QType.tf: 'True or false',
  QType.num: 'Enter a number',
  QType.text: 'Type a short answer',
};

/// Small seeded PRNG (same as the website) so an exam draw is reproducible.
double Function() seeded(int seed) {
  var s = seed & 0xFFFFFFFF;
  return () {
    s = (s * 1664525 + 1013904223) & 0xFFFFFFFF;
    return s / 4294967296;
  };
}

List<T> shuffle<T>(List<T> arr, double Function() rand) {
  final a = [...arr];
  for (var i = a.length - 1; i > 0; i--) {
    final j = (rand() * (i + 1)).floor();
    final t = a[i];
    a[i] = a[j];
    a[j] = t;
  }
  return a;
}
