import type { Answer, Question } from './types';

/** Share of correct answers needed to complete a lesson quiz and to pass a final exam. */
export const LESSON_PASS = 0.6;
export const EXAM_PASS = 0.7;
export const EXAM_SIZE = 20;

/** Parses "0.25", "1/4", "25%", "2.5e-3", "1,200" (thousands) or "0,5" (decimal comma). */
export function parseNumber(input: string): number | null {
  let s = input.trim().replace(/\s+/g, '').replace(/−/g, '-');
  if (!s) return null;
  let scale = 1;
  if (s.endsWith('%')) {
    scale = 0.01;
    s = s.slice(0, -1);
  }
  if (/^-?\d{1,3}(,\d{3})+(\.\d+)?$/.test(s)) s = s.replace(/,/g, '');
  else s = s.replace(',', '.');
  const frac = s.match(/^(-?[\d.]+)\/([\d.]+)$/);
  if (frac) {
    const v = Number(frac[1]) / Number(frac[2]);
    return Number.isFinite(v) ? v * scale : null;
  }
  const v = Number(s);
  return Number.isFinite(v) ? v * scale : null;
}

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9+#.\- ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

export function isAnswered(q: Question, a: Answer | undefined): boolean {
  if (a === undefined || a === null) return false;
  if (q.type === 'multi') return Array.isArray(a) && a.length > 0;
  if (q.type === 'num' || q.type === 'text') return typeof a === 'string' && a.trim().length > 0;
  return true;
}

export function grade(q: Question, a: Answer | undefined): boolean {
  if (!isAnswered(q, a)) return false;
  switch (q.type) {
    case 'single':
      return a === q.answer;
    case 'tf':
      return a === q.answer;
    case 'multi': {
      const got = [...(a as number[])].sort();
      const want = [...q.answer].sort();
      return got.length === want.length && got.every((v, i) => v === want[i]);
    }
    case 'num': {
      const v = parseNumber(a as string);
      if (v === null) return false;
      const tol = q.tol + 1e-9 * Math.max(1, Math.abs(q.answer));
      return Math.abs(v - q.answer) <= tol;
    }
    case 'text': {
      const got = norm(a as string);
      return q.answer.some((acc) => norm(acc) === got);
    }
  }
}

/** Human-readable correct answer for numeric / text / true-false questions. */
export function correctLabel(q: Question): string {
  if (q.type === 'num') return q.tol > 0 ? `${q.answer} (±${+q.tol.toPrecision(2)})` : String(q.answer);
  if (q.type === 'text') return q.display;
  if (q.type === 'tf') return q.answer ? 'True' : 'False';
  return '';
}

export const typeHint: Record<Question['type'], string> = {
  single: 'Choose one answer',
  multi: 'Select all that apply',
  tf: 'True or false',
  num: 'Enter a number',
  text: 'Type a short answer',
};

/** Small seeded PRNG so an exam draw stays the same after a reload. */
export function seeded(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}
export function shuffle<T>(arr: T[], rand: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
