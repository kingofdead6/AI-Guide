export type TocItem = { id: string; text: string };

export type Lesson = {
  id: string;
  title: string;
  lead: string;
  minutes: number;
  toc: TocItem[];
  questions: number;
  exercises: string[];
  figures: number;
  widgets: string[];
};

export type Course = {
  id: string;
  short: string;
  title: string;
  track: string;
  level: string;
  color: 'c1' | 'c2' | 'c3' | 'c4' | 'c5';
  prereqs: string[];
  tagline: string;
  description: string;
  outcomes: string[];
  lessons: Lesson[];
  minutes: number;
  questions: number;
  examQuestions: number;
  exercises: number;
};

export type Track = { id: string; title: string; blurb: string };
export type Catalog = { tracks: Track[]; courses: Course[]; generatedAt: string };

type Base = { id: string; prompt: string; explanation: string };
export type Question =
  | (Base & { type: 'single'; options: string[]; answer: number })
  | (Base & { type: 'multi'; options: string[]; answer: number[] })
  | (Base & { type: 'tf'; answer: boolean })
  | (Base & { type: 'num'; answer: number; tol: number })
  | (Base & { type: 'text'; answer: string[]; display: string });

/** What the learner entered: an option index, a set of indexes, a boolean, or free text. */
export type Answer = number | number[] | boolean | string;

export type CourseQuizzes = Record<string, Question[]> & { __exam: Question[] };

export type Exercise = {
  id: string;
  lesson: string;
  title: string;
  packages: string[];
  prompt: string;
  starter: string;
  solution: string;
  tests: string;
};

export type GlossaryEntry = { term: string; def: string; lesson: string | null; course: string | null };

export type Project = {
  id: string;
  title: string;
  level: string;
  hours: string;
  courses: string[];
  summary: string;
  brief: string;
  skills: string[];
  milestones: { id: string; text: string; detail: string }[];
  stretch: string[];
  rubric: string[];
};

export type SearchEntry = {
  t: 'lesson' | 'term' | 'project';
  id: string;
  course: string;
  title: string;
  lead: string;
  head?: string;
  text?: string;
};
