/// Content types, mirroring client/src/lib/types.ts.
library;

class TocItem {
  final String id;
  final String text;
  TocItem(this.id, this.text);
  factory TocItem.fromJson(Map<String, dynamic> j) => TocItem(j['id'] as String, j['text'] as String);
}

class Lesson {
  final String id;
  final String title;
  final String lead;
  final int minutes;
  final int questions;
  final List<String> exercises;
  final List<String> widgets;
  final List<TocItem> toc;

  Lesson.fromJson(Map<String, dynamic> j)
      : id = j['id'] as String,
        title = j['title'] as String,
        lead = j['lead'] as String? ?? '',
        minutes = (j['minutes'] as num?)?.toInt() ?? 0,
        questions = (j['questions'] as num?)?.toInt() ?? 0,
        exercises = List<String>.from(j['exercises'] as List? ?? const []),
        widgets = List<String>.from(j['widgets'] as List? ?? const []),
        toc = (j['toc'] as List? ?? const []).map((e) => TocItem.fromJson(e as Map<String, dynamic>)).toList();
}

class Course {
  final String id;
  final String short;
  final String title;
  final String track;
  final String level;
  final String color;
  final List<String> prereqs;
  final String tagline;
  final String description;
  final List<String> outcomes;
  final List<Lesson> lessons;
  final int minutes;
  final int questions;
  final int examQuestions;
  final int exercises;

  Course.fromJson(Map<String, dynamic> j)
      : id = j['id'] as String,
        short = j['short'] as String? ?? j['title'] as String,
        title = j['title'] as String,
        track = j['track'] as String,
        level = j['level'] as String? ?? '',
        color = j['color'] as String? ?? 'c1',
        prereqs = List<String>.from(j['prereqs'] as List? ?? const []),
        tagline = j['tagline'] as String? ?? '',
        description = j['description'] as String? ?? '',
        outcomes = List<String>.from(j['outcomes'] as List? ?? const []),
        lessons = (j['lessons'] as List).map((e) => Lesson.fromJson(e as Map<String, dynamic>)).toList(),
        minutes = (j['minutes'] as num?)?.toInt() ?? 0,
        questions = (j['questions'] as num?)?.toInt() ?? 0,
        examQuestions = (j['examQuestions'] as num?)?.toInt() ?? 0,
        exercises = (j['exercises'] as num?)?.toInt() ?? 0;

  int get hours => (minutes / 60).round().clamp(1, 1000);
}

class Track {
  final String id;
  final String title;
  final String blurb;
  Track.fromJson(Map<String, dynamic> j)
      : id = j['id'] as String,
        title = j['title'] as String,
        blurb = j['blurb'] as String? ?? '';
}

enum QType { single, multi, tf, num, text }

/// What the learner entered: an option index (int), a list of indexes, a bool, or free text (String).
typedef Answer = Object;

class Question {
  final String id;
  final QType type;
  final String prompt;
  final String explanation;
  final List<String> options;

  /// `int` for single, `List<int>` for multi, `bool` for tf, `num` for num, `List<String>` for text.
  final Object answer;
  final double tol;
  final String display;

  Question.fromJson(Map<String, dynamic> j)
      : id = j['id'] as String,
        type = QType.values.byName(j['type'] as String),
        prompt = j['prompt'] as String? ?? '',
        explanation = j['explanation'] as String? ?? '',
        options = List<String>.from(j['options'] as List? ?? const []),
        answer = _answer(j),
        tol = (j['tol'] as num?)?.toDouble() ?? 0,
        display = j['display'] as String? ?? '';

  static Object _answer(Map<String, dynamic> j) {
    final a = j['answer'];
    switch (j['type']) {
      case 'multi':
        return List<int>.from((a as List).map((e) => (e as num).toInt()));
      case 'text':
        return List<String>.from(a as List);
      case 'single':
        return (a as num).toInt();
      default:
        return a as Object;
    }
  }
}

class Exercise {
  final String id;
  final String lesson;
  final String title;
  final List<String> packages;
  final String prompt;
  final String starter;
  final String solution;
  final String tests;

  Exercise.fromJson(Map<String, dynamic> j)
      : id = j['id'] as String,
        lesson = j['lesson'] as String,
        title = j['title'] as String,
        packages = List<String>.from(j['packages'] as List? ?? const []),
        prompt = j['prompt'] as String? ?? '',
        starter = j['starter'] as String? ?? '',
        solution = j['solution'] as String? ?? '',
        tests = j['tests'] as String? ?? '';
}

class GlossaryEntry {
  final String term;
  final String def;
  final String? lesson;
  final String? course;
  GlossaryEntry.fromJson(Map<String, dynamic> j)
      : term = j['term'] as String,
        def = j['def'] as String,
        lesson = j['lesson'] as String?,
        course = j['course'] as String?;
}

class Milestone {
  final String id;
  final String text;
  final String detail;
  Milestone.fromJson(Map<String, dynamic> j)
      : id = j['id'] as String,
        text = j['text'] as String,
        detail = j['detail'] as String? ?? '';
}

class Project {
  final String id;
  final String title;
  final String level;
  final String hours;
  final List<String> courses;
  final String summary;
  final String brief;
  final List<String> skills;
  final List<Milestone> milestones;
  final List<String> stretch;
  final List<String> rubric;

  Project.fromJson(Map<String, dynamic> j)
      : id = j['id'] as String,
        title = j['title'] as String,
        level = j['level'] as String? ?? '',
        hours = j['hours'] as String? ?? '',
        courses = List<String>.from(j['courses'] as List? ?? const []),
        summary = j['summary'] as String? ?? '',
        brief = j['brief'] as String? ?? '',
        skills = List<String>.from(j['skills'] as List? ?? const []),
        milestones = (j['milestones'] as List? ?? const []).map((e) => Milestone.fromJson(e as Map<String, dynamic>)).toList(),
        stretch = List<String>.from(j['stretch'] as List? ?? const []),
        rubric = List<String>.from(j['rubric'] as List? ?? const []);
}
