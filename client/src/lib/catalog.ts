import raw from '../generated/catalog.json';
import type { Catalog, Course, CourseQuizzes, Exercise, Lesson } from './types';

export const catalog = raw as unknown as Catalog;
export const courses: Course[] = catalog.courses;

const byId = new Map(courses.map((c) => [c.id, c]));
const lessonMap = new Map<string, { course: Course; lesson: Lesson; index: number }>();
for (const c of courses) c.lessons.forEach((l, index) => lessonMap.set(l.id, { course: c, lesson: l, index }));

export const getCourse = (id: string | undefined) => (id ? byId.get(id) : undefined);
export const getLesson = (id: string | undefined) => (id ? lessonMap.get(id) : undefined);
export const totalLessons = courses.reduce((n, c) => n + c.lessons.length, 0);
export const totalQuestions = courses.reduce((n, c) => n + c.questions, 0);
export const totalExercises = courses.reduce((n, c) => n + c.exercises, 0);
export const totalHours = Math.round(courses.reduce((n, c) => n + c.minutes, 0) / 60);

export function neighbours(courseId: string, lessonId: string) {
  const c = byId.get(courseId);
  if (!c) return { prev: undefined, next: undefined };
  const i = c.lessons.findIndex((l) => l.id === lessonId);
  return { prev: c.lessons[i - 1], next: c.lessons[i + 1] };
}

export const lessonPath = (courseId: string, lessonId: string) => `/course/${courseId}/${lessonId}`;

/* ------------------------------------------------------------ lazy content */
const lessonFiles = import.meta.glob('../generated/lessons/*.html', { query: '?raw', import: 'default' }) as Record<
  string,
  () => Promise<string>
>;
const pageFiles = import.meta.glob('../generated/pages/*.html', { query: '?raw', import: 'default' }) as Record<string, () => Promise<string>>;
const quizFiles = import.meta.glob('../generated/quizzes/*.json', { import: 'default' }) as Record<string, () => Promise<CourseQuizzes>>;
const exerciseFiles = import.meta.glob('../generated/exercises/*.json', { import: 'default' }) as Record<string, () => Promise<Exercise[]>>;

export const loadLessonHtml = (id: string) => lessonFiles[`../generated/lessons/${id}.html`]?.() ?? Promise.resolve('');
export const loadPageHtml = (name: string) => pageFiles[`../generated/pages/${name}.html`]?.() ?? Promise.resolve('');

const quizCache = new Map<string, Promise<CourseQuizzes>>();
export function loadQuizzes(courseId: string) {
  if (!quizCache.has(courseId)) {
    const f = quizFiles[`../generated/quizzes/${courseId}.json`];
    quizCache.set(courseId, f ? f() : Promise.resolve({ __exam: [] } as unknown as CourseQuizzes));
  }
  return quizCache.get(courseId)!;
}
export function loadExercises(courseId: string) {
  const f = exerciseFiles[`../generated/exercises/${courseId}.json`];
  return f ? f() : Promise.resolve([] as Exercise[]);
}
