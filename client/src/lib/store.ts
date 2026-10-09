import { create } from 'zustand';
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware';
import { EXAM_PASS, LESSON_PASS } from './grade';
import type { Answer } from './types';

export type QuizState = {
  answers: Record<string, Answer>;
  results: Record<string, boolean>;
  attempts: number;
  best: number;
  last?: number;
  passedAt?: number;
};

export type ExamState = {
  attempts: number;
  best: number;
  passedAt?: number;
  current?: { qids: string[]; answers: Record<string, Answer>; startedAt: number };
  last?: { qids: string[]; answers: Record<string, Answer>; results: Record<string, boolean>; score: number; finishedAt: number };
};

export type Theme = 'light' | 'dark' | 'system';

export type ProgressData = {
  version: 1;
  name: string;
  theme: Theme;
  lessons: Record<string, { visitedAt?: number; completedAt?: number }>;
  quizzes: Record<string, QuizState>;
  exams: Record<string, ExamState>;
  code: Record<string, { code?: string; passedAt?: number }>;
  projects: Record<string, Record<string, boolean>>;
  certificates: Record<string, { issuedAt: number }>;
  activity: Record<string, number>;
  last?: { courseId: string; lessonId: string; at: number };
};

type Actions = {
  setName: (name: string) => void;
  setTheme: (t: Theme) => void;
  visit: (courseId: string, lessonId: string) => void;
  answer: (lessonId: string, qid: string, a: Answer) => void;
  check: (lessonId: string, qid: string, correct: boolean, total: number) => void;
  retryQuiz: (lessonId: string) => void;
  startExam: (courseId: string, qids: string[]) => void;
  examAnswer: (courseId: string, qid: string, a: Answer) => void;
  submitExam: (courseId: string, results: Record<string, boolean>) => void;
  abandonExam: (courseId: string) => void;
  saveCode: (exerciseId: string, code: string) => void;
  codePassed: (exerciseId: string) => void;
  toggleMilestone: (projectId: string, milestoneId: string) => void;
  issueCertificate: (key: string) => void;
  importData: (data: ProgressData) => void;
  reset: () => void;
};

export const STORAGE_KEY = 'aiguide-progress';

const empty = (): ProgressData => ({
  version: 1,
  name: '',
  theme: 'system',
  lessons: {},
  quizzes: {},
  exams: {},
  code: {},
  projects: {},
  certificates: {},
  activity: {},
});

export const dayKey = (t = Date.now()) => {
  const d = new Date(t);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
const bump = (activity: Record<string, number>) => ({ ...activity, [dayKey()]: (activity[dayKey()] || 0) + 1 });

/** localStorage can throw (private mode, blocked storage); fall back to memory so the app still works. */
const memory = new Map<string, string>();
const safeStorage: StateStorage = {
  getItem: (k) => {
    try {
      return localStorage.getItem(k);
    } catch {
      return memory.get(k) ?? null;
    }
  },
  setItem: (k, v) => {
    try {
      localStorage.setItem(k, v);
    } catch {
      memory.set(k, v);
    }
  },
  removeItem: (k) => {
    try {
      localStorage.removeItem(k);
    } catch {
      memory.delete(k);
    }
  },
};

export const useProgress = create<ProgressData & Actions>()(
  persist(
    (set, get) => ({
      ...empty(),
      setName: (name) => set({ name: name.slice(0, 80) }),
      setTheme: (theme) => set({ theme }),
      visit: (courseId, lessonId) =>
        set((s) => ({
          last: { courseId, lessonId, at: Date.now() },
          lessons: { ...s.lessons, [lessonId]: { ...s.lessons[lessonId], visitedAt: s.lessons[lessonId]?.visitedAt ?? Date.now() } },
        })),
      answer: (lessonId, qid, a) =>
        set((s) => {
          const q = s.quizzes[lessonId] ?? { answers: {}, results: {}, attempts: 0, best: 0 };
          if (qid in q.results) return {};
          return { quizzes: { ...s.quizzes, [lessonId]: { ...q, answers: { ...q.answers, [qid]: a } } } };
        }),
      check: (lessonId, qid, correct, total) =>
        set((s) => {
          const q = s.quizzes[lessonId] ?? { answers: {}, results: {}, attempts: 0, best: 0 };
          if (qid in q.results) return {};
          const results = { ...q.results, [qid]: correct };
          const next: QuizState = { ...q, results };
          const patch: Partial<ProgressData> = { activity: bump(s.activity) };
          if (Object.keys(results).length >= total) {
            const score = Object.values(results).filter(Boolean).length / total;
            next.attempts = q.attempts + 1;
            next.last = score;
            next.best = Math.max(q.best, score);
            if (score >= LESSON_PASS) {
              next.passedAt = q.passedAt ?? Date.now();
              patch.lessons = { ...s.lessons, [lessonId]: { ...s.lessons[lessonId], completedAt: s.lessons[lessonId]?.completedAt ?? Date.now() } };
            }
          }
          return { ...patch, quizzes: { ...s.quizzes, [lessonId]: next } };
        }),
      retryQuiz: (lessonId) =>
        set((s) => {
          const q = s.quizzes[lessonId];
          if (!q) return {};
          return { quizzes: { ...s.quizzes, [lessonId]: { ...q, answers: {}, results: {} } } };
        }),
      startExam: (courseId, qids) =>
        set((s) => ({
          exams: { ...s.exams, [courseId]: { ...(s.exams[courseId] ?? { attempts: 0, best: 0 }), current: { qids, answers: {}, startedAt: Date.now() } } },
        })),
      examAnswer: (courseId, qid, a) =>
        set((s) => {
          const e = s.exams[courseId];
          if (!e?.current) return {};
          return { exams: { ...s.exams, [courseId]: { ...e, current: { ...e.current, answers: { ...e.current.answers, [qid]: a } } } } };
        }),
      submitExam: (courseId, results) =>
        set((s) => {
          const e = s.exams[courseId];
          if (!e?.current) return {};
          const n = e.current.qids.length;
          const score = n ? Object.values(results).filter(Boolean).length / n : 0;
          return {
            activity: bump(s.activity),
            exams: {
              ...s.exams,
              [courseId]: {
                attempts: e.attempts + 1,
                best: Math.max(e.best, score),
                passedAt: score >= EXAM_PASS ? e.passedAt ?? Date.now() : e.passedAt,
                last: { qids: e.current.qids, answers: e.current.answers, results, score, finishedAt: Date.now() },
                current: undefined,
              },
            },
          };
        }),
      abandonExam: (courseId) =>
        set((s) => (s.exams[courseId] ? { exams: { ...s.exams, [courseId]: { ...s.exams[courseId], current: undefined } } } : {})),
      saveCode: (id, code) => set((s) => ({ code: { ...s.code, [id]: { ...s.code[id], code } } })),
      codePassed: (id) =>
        set((s) => ({
          activity: s.code[id]?.passedAt ? s.activity : bump(s.activity),
          code: { ...s.code, [id]: { ...s.code[id], passedAt: s.code[id]?.passedAt ?? Date.now() } },
        })),
      toggleMilestone: (pid, mid) =>
        set((s) => {
          const p = { ...s.projects[pid] };
          p[mid] = !p[mid];
          return { projects: { ...s.projects, [pid]: p }, activity: p[mid] ? bump(s.activity) : s.activity };
        }),
      issueCertificate: (key) => {
        if (get().certificates[key]) return;
        set((s) => ({ certificates: { ...s.certificates, [key]: { issuedAt: Date.now() } } }));
      },
      importData: (data) => set({ ...empty(), ...data, version: 1 }),
      reset: () => set({ ...empty(), theme: get().theme }),
    }),
    {
      name: STORAGE_KEY,
      version: 1,
      storage: createJSONStorage(() => safeStorage),
      partialize: (s) => {
        // Persist data only, never the action functions.
        const { version, name, theme, lessons, quizzes, exams, code, projects, certificates, activity, last } = s;
        return { version, name, theme, lessons, quizzes, exams, code, projects, certificates, activity, last };
      },
    },
  ),
);

export function exportProgress(): ProgressData {
  const s = useProgress.getState();
  const { version, name, theme, lessons, quizzes, exams, code, projects, certificates, activity, last } = s;
  return { version, name, theme, lessons, quizzes, exams, code, projects, certificates, activity, last };
}

export function isProgressData(x: unknown): x is ProgressData {
  if (!x || typeof x !== 'object') return false;
  const o = x as Record<string, unknown>;
  return o.version === 1 && typeof o.lessons === 'object' && typeof o.quizzes === 'object' && typeof o.exams === 'object';
}
