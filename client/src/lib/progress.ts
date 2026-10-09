import { courses, getCourse } from './catalog';
import { EXAM_PASS } from './grade';
import { dayKey, type ProgressData } from './store';
import type { Course } from './types';

export type CourseStatus = {
  done: number;
  total: number;
  pct: number;
  started: boolean;
  lessonsComplete: boolean;
  examPassed: boolean;
  examBest: number;
  certified: boolean;
};

export function courseStatus(p: ProgressData, c: Course): CourseStatus {
  const total = c.lessons.length;
  const done = c.lessons.filter((l) => p.lessons[l.id]?.completedAt).length;
  const started = done > 0 || c.lessons.some((l) => p.lessons[l.id]?.visitedAt);
  const exam = p.exams[c.id];
  const examPassed = !!exam?.passedAt;
  const lessonsComplete = done === total;
  return {
    done,
    total,
    pct: total ? done / total : 0,
    started,
    lessonsComplete,
    examPassed,
    examBest: exam?.best ?? 0,
    certified: lessonsComplete && examPassed,
  };
}

export const programComplete = (p: ProgressData) => courses.every((c) => courseStatus(p, c).certified);

export function overall(p: ProgressData) {
  const lessonsTotal = courses.reduce((n, c) => n + c.lessons.length, 0);
  const lessonsDone = courses.reduce((n, c) => n + c.lessons.filter((l) => p.lessons[l.id]?.completedAt).length, 0);
  let answered = 0;
  let correct = 0;
  for (const q of Object.values(p.quizzes)) {
    for (const ok of Object.values(q.results)) {
      answered++;
      if (ok) correct++;
    }
  }
  for (const e of Object.values(p.exams)) {
    if (!e.last) continue;
    for (const ok of Object.values(e.last.results)) {
      answered++;
      if (ok) correct++;
    }
  }
  const certified = courses.filter((c) => courseStatus(p, c).certified).length;
  const codePassed = Object.values(p.code).filter((c) => c.passedAt).length;
  return { lessonsTotal, lessonsDone, answered, correct, accuracy: answered ? correct / answered : 0, certified, codePassed, streak: streak(p.activity) };
}

/** Consecutive days with activity, ending today (or yesterday, so a streak survives until midnight). */
export function streak(activity: Record<string, number>) {
  let n = 0;
  let t = Date.now();
  if (!activity[dayKey(t)]) t -= 86_400_000;
  while (activity[dayKey(t)]) {
    n++;
    t -= 86_400_000;
  }
  return n;
}

/** Deterministic, human-friendly certificate ID derived from who, what and when. */
export function certificateId(key: string, issuedAt: number, name: string) {
  let h1 = 0x811c9dc5;
  let h2 = 0x01000193;
  const s = `${key}|${issuedAt}|${name.trim().toLowerCase()}`;
  for (let i = 0; i < s.length; i++) {
    h1 = Math.imul(h1 ^ s.charCodeAt(i), 16777619) >>> 0;
    h2 = Math.imul(h2 ^ s.charCodeAt(i), 2246822519) >>> 0;
  }
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const enc = (n: number, len: number) => {
    let out = '';
    for (let i = 0; i < len; i++) {
      out += alphabet[n % 32];
      n = Math.floor(n / 32);
    }
    return out;
  };
  return `AIG-${enc(h1, 4)}-${enc(h2, 4)}`;
}

export function nextUp(p: ProgressData) {
  if (p.last) {
    const c = getCourse(p.last.courseId);
    const l = c?.lessons.find((x) => x.id === p.last!.lessonId);
    if (c && l) {
      if (!p.lessons[l.id]?.completedAt) return { course: c, lesson: l, resume: true };
      const nextLesson = c.lessons.find((x) => !p.lessons[x.id]?.completedAt);
      if (nextLesson) return { course: c, lesson: nextLesson, resume: false };
    }
  }
  for (const c of courses) {
    const l = c.lessons.find((x) => !p.lessons[x.id]?.completedAt);
    if (l) return { course: c, lesson: l, resume: false };
  }
  return null;
}

export const pct = (x: number) => `${Math.round(x * 100)}%`;
export const EXAM_PASS_PCT = pct(EXAM_PASS);
