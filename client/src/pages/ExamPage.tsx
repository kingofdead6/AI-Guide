import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { IconAward, IconLock, IconRefresh } from '../components/icons';
import { fireConfetti } from '../components/motion';
import { QuestionCard } from '../components/QuestionCard';
import { btn, cx, Modal, ProgressBar, useTitle } from '../components/ui';
import { getCourse, loadQuizzes } from '../lib/catalog';
import { EXAM_PASS, EXAM_SIZE, grade, isAnswered, seeded, shuffle } from '../lib/grade';
import { courseStatus, EXAM_PASS_PCT, pct } from '../lib/progress';
import { useProgress } from '../lib/store';
import type { Question } from '../lib/types';
import NotFound from './NotFound';

export default function ExamPage() {
  const { courseId } = useParams();
  const course = getCourse(courseId);
  const p = useProgress();
  const [bank, setBank] = useState<Map<string, Question> | null>(null);
  const [confirm, setConfirm] = useState(false);
  useTitle(course ? `${course.title}: final exam` : 'Final exam');

  useEffect(() => {
    if (!course) return;
    loadQuizzes(course.id).then((qz) => {
      const all = [...course.lessons.flatMap((l) => qz[l.id] ?? []), ...(qz.__exam ?? [])];
      setBank(new Map(all.map((q) => [q.id, q])));
    });
  }, [course]);

  const exam = course ? p.exams[course.id] : undefined;
  const current = exam?.current;
  const questions = useMemo(() => (bank && current ? current.qids.map((id) => bank.get(id)).filter((q): q is Question => !!q) : []), [bank, current]);

  if (!course) return <NotFound />;
  const s = courseStatus(p, course);
  const { startExam, examAnswer, submitExam, abandonExam } = useProgress.getState();

  const begin = () => {
    if (!bank) return;
    const examOnly = [...bank.values()].filter((q) => q.id.includes('-exam-'));
    const rest = [...bank.values()].filter((q) => !q.id.includes('-exam-'));
    const rand = seeded(Date.now());
    // Always include the integrative exam-only questions, then fill up from lesson quizzes.
    const pick = [...shuffle(examOnly, rand).slice(0, Math.min(8, examOnly.length))];
    pick.push(...shuffle(rest, rand).slice(0, Math.max(0, EXAM_SIZE - pick.length)));
    startExam(course.id, shuffle(pick, rand).map((q) => q.id));
    window.scrollTo(0, 0);
  };

  const submit = () => {
    if (!current) return;
    const results: Record<string, boolean> = {};
    for (const q of questions) results[q.id] = grade(q, current.answers[q.id]);
    submitExam(course.id, results);
    setConfirm(false);
    if (questions.length && Object.values(results).filter(Boolean).length / questions.length >= EXAM_PASS) setTimeout(() => fireConfetti({ count: 220 }), 250);
    window.scrollTo(0, 0);
  };

  const answered = current ? questions.filter((q) => isAnswered(q, current.answers[q.id])).length : 0;
  const last = exam?.last;

  return (
    <div className="mx-auto max-w-[820px] px-4 sm:px-6">
      <nav className="pt-6 text-[14px] text-muted" aria-label="Breadcrumb">
        <Link to="/courses" className="hover:text-ink">
          Courses
        </Link>{' '}
        /{' '}
        <Link to={`/course/${course.id}`} className="hover:text-ink">
          {course.title}
        </Link>
      </nav>
      <header className="pt-6 pb-6">
        <h1 className="animate-fade-up font-wide text-[36px] sm:text-[48px] leading-[1.04] font-[780] tracking-[-0.03em]">Final exam</h1>
        <p className="mt-2 text-lg text-muted">{course.title}</p>
      </header>

      {!s.lessonsComplete && !current && (
        <div className="rounded-2xl border border-line bg-surface p-6">
          <p className="font-bold text-[18px] flex items-center gap-2">
            <IconLock size={18} /> The exam opens when every lesson is complete
          </p>
          <p className="text-muted mt-2">
            You have completed {s.done} of {s.total} lessons. Pass each lesson's quiz to unlock the exam.
          </p>
          <ProgressBar value={s.pct} className="mt-4" />
          <Link to={`/course/${course.id}`} className={cx(btn.secondary, 'mt-5')}>
            Back to the course
          </Link>
        </div>
      )}

      {s.lessonsComplete && !current && (
        <>
          {last && (
            <div className={cx('rounded-2xl border-2 p-6 mb-6', last.score >= EXAM_PASS ? 'border-ok bg-ok-soft' : 'border-warn bg-warn-soft')} role="status">
              <p className="text-[24px] font-bold">
                {Object.values(last.results).filter(Boolean).length} of {last.qids.length} correct ({pct(last.score)})
              </p>
              <p className="mt-1">
                {last.score >= EXAM_PASS
                  ? 'You passed. Your certificate is ready.'
                  : `The pass mark is ${EXAM_PASS_PCT}. Review the answers below, revisit the lessons they come from, and try again with a fresh set of questions.`}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {s.certified && (
                  <Link to={`/certificate/${course.id}`} className={btn.primary}>
                    <IconAward size={18} /> Get your certificate
                  </Link>
                )}
                <button type="button" className={btn.secondary} onClick={begin} disabled={!bank}>
                  <IconRefresh size={17} /> {last.score >= EXAM_PASS ? 'Retake for a higher score' : 'Try again'}
                </button>
              </div>
            </div>
          )}
          {!last && (
            <div className="rounded-2xl border border-line bg-surface p-6">
              <h2 className="text-[20px] font-bold">Before you begin</h2>
              <ul className="mt-3 flex flex-col gap-2 text-[16px]">
                <li>{Math.min(EXAM_SIZE, bank?.size ?? EXAM_SIZE)} questions drawn from the whole course, including questions you have not seen.</li>
                <li>Answer them all, then submit once. You will see every correct answer and explanation afterwards.</li>
                <li>You need {EXAM_PASS_PCT} to pass. Retakes are unlimited and your best score counts.</li>
                <li>Your answers are saved as you go, so you can leave and come back.</li>
              </ul>
              <button type="button" className={cx(btn.primary, 'mt-6')} onClick={begin} disabled={!bank}>
                Start the exam
              </button>
            </div>
          )}
          {last && bank && (
            <div className="mt-8">
              <h2 className="text-[20px] font-bold mb-4">Review your answers</h2>
              <div className="flex flex-col gap-4">
                {last.qids.map((id, i) => {
                  const q = bank.get(id);
                  if (!q) return null;
                  return <QuestionCard key={id} q={q} n={i + 1} value={last.answers[id]} result={last.results[id]} onChange={() => {}} />;
                })}
              </div>
            </div>
          )}
        </>
      )}

      {current && (
        <>
          <div className="sticky top-16 z-30 bg-bg/95 backdrop-blur py-3 border-b border-line mb-5">
            <div className="flex justify-between text-[14px] mb-1.5">
              <span>
                {answered} of {questions.length} answered
              </span>
              <button type="button" className="text-muted hover:text-bad" onClick={() => abandonExam(course.id)}>
                Leave exam
              </button>
            </div>
            <ProgressBar value={questions.length ? answered / questions.length : 0} />
          </div>
          <div className="flex flex-col gap-4">
            {questions.map((q, i) => (
              <QuestionCard key={q.id} q={q} n={i + 1} value={current.answers[q.id]} onChange={(a) => examAnswer(course.id, q.id, a)} />
            ))}
          </div>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <button type="button" className={btn.primary} onClick={() => (answered < questions.length ? setConfirm(true) : submit())}>
              Submit exam
            </button>
            <span className="text-muted text-[14px]">{questions.length - answered > 0 ? `${questions.length - answered} unanswered` : 'All answered'}</span>
          </div>
          <Modal open={confirm} onClose={() => setConfirm(false)} title="Submit with unanswered questions?">
            <p className="text-muted">
              {questions.length - answered} questions are still empty and will be marked wrong.
            </p>
            <div className="mt-5 flex gap-2 justify-end">
              <button type="button" className={btn.ghost} onClick={() => setConfirm(false)}>
                Keep answering
              </button>
              <button type="button" className={btn.primary} onClick={submit}>
                Submit anyway
              </button>
            </div>
          </Modal>
        </>
      )}
    </div>
  );
}
