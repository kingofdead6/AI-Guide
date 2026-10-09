import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { loadQuizzes } from '../lib/catalog';
import { grade, LESSON_PASS } from '../lib/grade';
import { pct } from '../lib/progress';
import { useProgress } from '../lib/store';
import type { Course, Lesson, Question } from '../lib/types';
import { IconAward, IconCheck, IconRefresh } from './icons';
import { fireConfetti } from './motion';
import { QuestionCard } from './QuestionCard';
import { btn, ProgressBar } from './ui';

export function LessonQuiz({ course, lesson, nextHref }: { course: Course; lesson: Lesson; nextHref?: string }) {
  const [questions, setQuestions] = useState<Question[] | null>(null);
  const quiz = useProgress((s) => s.quizzes[lesson.id]);
  const completed = useProgress((s) => !!s.lessons[lesson.id]?.completedAt);
  const allDone = useProgress((s) => course.lessons.every((l) => s.lessons[l.id]?.completedAt));
  const { answer, check, retryQuiz } = useProgress.getState();

  useEffect(() => {
    let alive = true;
    setQuestions(null);
    loadQuizzes(course.id).then((qz) => alive && setQuestions(qz[lesson.id] ?? []));
    return () => {
      alive = false;
    };
  }, [course.id, lesson.id]);

  // Confetti only when the quiz is passed right now, not when revisiting a finished lesson.
  const passedNow = !!questions?.length && Object.keys(quiz?.results ?? {}).length >= questions.length && Object.values(quiz?.results ?? {}).filter(Boolean).length / questions.length >= LESSON_PASS;
  const wasPassed = useRef<boolean | null>(null);
  useEffect(() => {
    if (!questions) return;
    if (passedNow && wasPassed.current === false) fireConfetti({ origin: { x: 0.5, y: 0.7 } });
    wasPassed.current = passedNow;
  }, [passedNow, questions]);

  if (!questions) return <div className="h-40 rounded-2xl skeleton" aria-label="Loading quiz" />;
  if (!questions.length) return null;

  const results = quiz?.results ?? {};
  const answers = quiz?.answers ?? {};
  const checkedCount = Object.keys(results).length;
  const correctCount = Object.values(results).filter(Boolean).length;
  const finished = checkedCount >= questions.length;
  const score = finished ? correctCount / questions.length : 0;
  const passed = finished && score >= LESSON_PASS;
  const need = Math.ceil(LESSON_PASS * questions.length - 1e-9);

  return (
    <div id="quiz" className="scroll-mt-24">
      <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
        <div>
          <h2 className="font-wide text-[26px] font-[750] tracking-tight">Check your understanding</h2>
          <p className="text-muted mt-1">
            {questions.length} questions. Get {need} or more right to complete this lesson. You can retry as often as you like.
          </p>
        </div>
        {quiz?.best ? <span className="text-sm text-muted">Best score {pct(quiz.best)}</span> : null}
      </div>
      <ProgressBar value={checkedCount / questions.length} className="mb-5" label="Quiz progress" />

      <div className="flex flex-col gap-4">
        {questions.map((q, i) => (
          <QuestionCard
            key={q.id}
            q={q}
            n={i + 1}
            value={answers[q.id]}
            result={results[q.id]}
            onChange={(a) => answer(lesson.id, q.id, a)}
            onCheck={() => check(lesson.id, q.id, grade(q, answers[q.id]), questions.length)}
          />
        ))}
      </div>

      {finished && (
        <div
          role="status"
          className={`mt-6 rounded-2xl border-2 p-5 sm:p-6 animate-pop ${passed ? 'border-ok bg-ok-soft' : 'border-warn bg-warn-soft'}`}
        >
          <p className="text-[22px] font-bold">
            {correctCount} of {questions.length} correct ({pct(score)})
          </p>
          {passed ? (
            <p className="mt-1">
              {completed ? 'Lesson complete.' : ''} {allDone ? 'You have finished every lesson in this course, so the final exam is open.' : 'Nice work. Keep the momentum going.'}
            </p>
          ) : (
            <p className="mt-1">
              You need {need} correct answers to complete the lesson. Read the explanations above, revisit the sections they point to, then try again.
            </p>
          )}
          <div className="mt-4 flex flex-wrap gap-2">
            {passed && allDone && (
              <Link to={`/course/${course.id}/exam`} className={btn.primary}>
                <IconAward size={18} /> Take the final exam
              </Link>
            )}
            {passed && nextHref && !allDone && (
              <Link to={nextHref} className={btn.primary}>
                <IconCheck size={18} /> Next lesson
              </Link>
            )}
            <button type="button" className={btn.secondary} onClick={() => retryQuiz(lesson.id)}>
              <IconRefresh size={17} /> Retry quiz
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
