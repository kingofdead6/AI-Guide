import 'dart:math' as math;

import 'package:ai_guide_academy/data/models.dart';
import 'package:ai_guide_academy/logic/grade.dart';
import 'package:ai_guide_academy/logic/progress_logic.dart';
import 'package:ai_guide_academy/state/auth_store.dart';
import 'package:ai_guide_academy/theme/palettes.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

/// The expected values were produced by the website's TypeScript (client/src/lib), so these tests
/// prove the app grades, shuffles and issues certificate IDs exactly like the site.
void main() {
  test('certificate IDs match the website', () {
    expect(certificateId('ml', 1760000000000, 'Ada Lovelace'), 'AIG-TKEA-D5HD');
    expect(certificateId('program', 1712345678901, '  Nour Kahlouche '), 'AIG-HYM5-KXUF');
    expect(certificateId('python', 1, ''), 'AIG-WVX7-8QJ2');
  });

  test('numbers parse like the website', () {
    expect(['0.25', '1/4', '25%', '2.5e-3', '1,200', '0,5', '−3', 'abc'].map(parseNumber).toList(), [0.25, 0.25, 0.25, 0.0025, 1200, 0.5, -3, null]);
  });

  test('seeded shuffle matches the website', () {
    expect(shuffle(List.generate(10, (i) => i), seeded(42)), [5, 3, 7, 6, 8, 9, 1, 4, 0, 2]);
  });

  test('grading', () {
    Question q(Map<String, dynamic> j) => Question.fromJson({'id': 'x', 'prompt': '', 'explanation': '', ...j});
    expect(grade(q({'type': 'single', 'options': ['a', 'b'], 'answer': 1}), 1), isTrue);
    expect(grade(q({'type': 'single', 'options': ['a', 'b'], 'answer': 1}), 0), isFalse);
    expect(grade(q({'type': 'multi', 'options': ['a', 'b', 'c'], 'answer': [0, 2]}), [2, 0]), isTrue);
    expect(grade(q({'type': 'multi', 'options': ['a', 'b', 'c'], 'answer': [0, 2]}), [0]), isFalse);
    expect(grade(q({'type': 'tf', 'answer': false}), false), isTrue);
    expect(grade(q({'type': 'num', 'answer': 2.71, 'tol': 0.005}), '2.712'), isTrue);
    expect(grade(q({'type': 'num', 'answer': 0.75, 'tol': 0}), '3/4'), isTrue);
    expect(grade(q({'type': 'num', 'answer': 0.75, 'tol': 0}), '0.7'), isFalse);
    expect(grade(q({'type': 'text', 'answer': ['ReLU', 'rectified linear unit'], 'display': 'ReLU'}), '  relu '), isTrue);
    expect(grade(q({'type': 'text', 'answer': ['café'], 'display': 'café'}), 'Cafe'), isTrue);
    expect(isAnswered(q({'type': 'text', 'answer': ['a'], 'display': 'a'}), '   '), isFalse);
  });

  test('merge keeps the best of both devices', () {
    final a = {
      'version': 1,
      'name': '',
      'lessons': {'l1': {'visitedAt': 5, 'completedAt': 9}},
      'quizzes': {'l1': {'answers': {}, 'results': {'q1': true}, 'attempts': 1, 'best': 0.5}},
      'exams': <String, dynamic>{},
      'code': <String, dynamic>{},
      'projects': {'p': {'m1': true}},
      'certificates': <String, dynamic>{},
      'activity': {'2026-10-01': 2},
    };
    final b = {
      'version': 1,
      'name': 'Ada',
      'lessons': {'l1': {'visitedAt': 3}, 'l2': {'visitedAt': 7}},
      'quizzes': {'l1': {'answers': {}, 'results': {'q1': true, 'q2': true}, 'attempts': 2, 'best': 1.0, 'passedAt': 8}},
      'exams': <String, dynamic>{},
      'code': <String, dynamic>{},
      'projects': {'p': {'m2': true}},
      'certificates': {'ml': {'issuedAt': 4}},
      'activity': {'2026-10-01': 5, '2026-10-02': 1},
    };
    final m = AuthStore.merge(a, b);
    expect(m['name'], 'Ada');
    expect(m['lessons'], {'l1': {'visitedAt': 3, 'completedAt': 9}, 'l2': {'visitedAt': 7}});
    expect((m['quizzes'] as Map)['l1']['best'], 1.0);
    expect((m['quizzes'] as Map)['l1']['attempts'], 2);
    expect(((m['quizzes'] as Map)['l1']['results'] as Map).length, 2);
    expect(m['projects'], {'p': {'m1': true, 'm2': true}});
    expect(m['certificates'], {'ml': {'issuedAt': 4}});
    expect(m['activity'], {'2026-10-01': 5, '2026-10-02': 1});
  });

  test('every theme gives readable text in both modes', () {
    double lum(Color c) {
      double lin(double v) => v <= 0.04045 ? v / 12.92 : math.pow((v + 0.055) / 1.055, 2.4).toDouble();
      return 0.2126 * lin(c.r) + 0.7152 * lin(c.g) + 0.0722 * lin(c.b);
    }

    double contrast(Color a, Color b) {
      final x = lum(a), y = lum(b);
      return (x > y ? x + 0.05 : y + 0.05) / (x > y ? y + 0.05 : x + 0.05);
    }

    for (final t in themes) {
      for (final dark in [false, true]) {
        final p = buildPalette(t.id, dark);
        expect(contrast(p.text, p.bg), greaterThan(7), reason: '${t.id} ${dark ? 'dark' : 'light'} text');
        expect(contrast(p.muted, p.surface), greaterThan(4.5), reason: '${t.id} ${dark ? 'dark' : 'light'} muted');
        expect(contrast(p.onAccent, p.accent), greaterThan(4.5), reason: '${t.id} ${dark ? 'dark' : 'light'} button');
      }
    }
  });
}
