import 'package:flutter/material.dart';

import '../data/content.dart';
import 'certificate_screen.dart';
import 'course_screen.dart';
import 'exam_screen.dart';
import 'lesson_screen.dart';

Future<T?> push<T>(BuildContext context, Widget screen) => Navigator.of(context).push<T>(MaterialPageRoute(builder: (_) => screen));

/// Opens a website-style route ("/course/ml", "/course/ml/linear-regression", "/course/ml/exam",
/// "/certificate/ml") as the matching native screen. Used for links inside lessons.
void openRoute(BuildContext context, String route) {
  final parts = route.split('#').first.split('/').where((s) => s.isNotEmpty).toList();
  if (parts.length >= 2 && parts[0] == 'course') {
    final c = Content.I.course(parts[1]);
    if (c == null) return;
    if (parts.length == 2) {
      push(context, CourseScreen(course: c));
    } else if (parts[2] == 'exam') {
      push(context, ExamScreen(course: c));
    } else {
      final l = Content.I.lesson(parts[2]);
      if (l != null) push(context, LessonScreen(course: l.course, lesson: l.lesson));
    }
  } else if (parts.length == 2 && parts[0] == 'certificate') {
    push(context, CertificateScreen(courseId: parts[1]));
  }
}
