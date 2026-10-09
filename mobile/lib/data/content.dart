import 'dart:convert';

import 'package:flutter/services.dart' show rootBundle;

import 'models.dart';

/// Loads the bundled academy content (copied from the website by tool/sync_content.mjs).
class Content {
  Content._();
  static final Content I = Content._();

  late final List<Track> tracks;
  late final List<Course> courses;
  final Map<String, Course> _courses = {};
  final Map<String, ({Course course, Lesson lesson, int index})> _lessons = {};
  final Map<String, Future<Map<String, List<Question>>>> _quizzes = {};
  final Map<String, Future<List<Exercise>>> _exercises = {};
  Future<List<GlossaryEntry>>? _glossary;
  Future<List<Project>>? _projects;

  Future<void> load() async {
    final raw = jsonDecode(await rootBundle.loadString('assets/content/catalog.json')) as Map<String, dynamic>;
    tracks = (raw['tracks'] as List).map((e) => Track.fromJson(e as Map<String, dynamic>)).toList();
    courses = (raw['courses'] as List).map((e) => Course.fromJson(e as Map<String, dynamic>)).toList();
    for (final c in courses) {
      _courses[c.id] = c;
      for (var i = 0; i < c.lessons.length; i++) {
        _lessons[c.lessons[i].id] = (course: c, lesson: c.lessons[i], index: i);
      }
    }
  }

  Course? course(String? id) => id == null ? null : _courses[id];
  ({Course course, Lesson lesson, int index})? lesson(String? id) => id == null ? null : _lessons[id];
  int courseNumber(Course c) => courses.indexOf(c) + 1;

  int get totalLessons => courses.fold(0, (n, c) => n + c.lessons.length);
  int get totalQuestions => courses.fold(0, (n, c) => n + c.questions + c.examQuestions);
  int get totalExercises => courses.fold(0, (n, c) => n + c.exercises);
  int get totalHours => (courses.fold(0, (n, c) => n + c.minutes) / 60).round();

  Future<String> lessonHtml(String id) => rootBundle.loadString('assets/content/lessons/$id.html');
  Future<String> pageHtml(String name) => rootBundle.loadString('assets/content/pages/$name.html');

  /// Lesson quizzes keyed by lesson id, plus `__exam` for exam-only questions.
  Future<Map<String, List<Question>>> quizzes(String courseId) => _quizzes.putIfAbsent(courseId, () async {
        try {
          final raw = jsonDecode(await rootBundle.loadString('assets/content/quizzes/$courseId.json')) as Map<String, dynamic>;
          return raw.map((k, v) => MapEntry(k, (v as List).map((e) => Question.fromJson(e as Map<String, dynamic>)).toList()));
        } catch (_) {
          return <String, List<Question>>{};
        }
      });

  Future<List<Exercise>> exercises(String courseId) => _exercises.putIfAbsent(courseId, () async {
        try {
          final raw = jsonDecode(await rootBundle.loadString('assets/content/exercises/$courseId.json')) as List;
          return raw.map((e) => Exercise.fromJson(e as Map<String, dynamic>)).toList();
        } catch (_) {
          return <Exercise>[];
        }
      });

  Future<List<GlossaryEntry>> glossary() => _glossary ??= rootBundle
      .loadString('assets/content/glossary.json')
      .then((s) => (jsonDecode(s) as List).map((e) => GlossaryEntry.fromJson(e as Map<String, dynamic>)).toList());

  Future<List<Project>> projects() => _projects ??= rootBundle
      .loadString('assets/content/projects.json')
      .then((s) => (jsonDecode(s) as List).map((e) => Project.fromJson(e as Map<String, dynamic>)).toList());

  ({Lesson? prev, Lesson? next}) neighbours(String courseId, String lessonId) {
    final c = _courses[courseId];
    if (c == null) return (prev: null, next: null);
    final i = c.lessons.indexWhere((l) => l.id == lessonId);
    return (prev: i > 0 ? c.lessons[i - 1] : null, next: i >= 0 && i < c.lessons.length - 1 ? c.lessons[i + 1] : null);
  }
}
