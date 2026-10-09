import { lazy, Suspense, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { HtmlContent } from '../components/HtmlContent';
import { IconCheck, IconChevronLeft, IconChevronRight, IconClock, IconList, IconX } from '../components/icons';
import { LessonQuiz } from '../components/LessonQuiz';
import { cx, ProgressBar, tone, useTitle } from '../components/ui';
import { getCourse, loadExercises, loadLessonHtml, neighbours } from '../lib/catalog';
import { courseStatus } from '../lib/progress';
import { useProgress } from '../lib/store';
import type { Course, Exercise } from '../lib/types';
import NotFound from './NotFound';

const CodeExercise = lazy(() => import('../components/CodeExercise'));

function Outline({ course, current, onPick }: { course: Course; current: string; onPick?: () => void }) {
  const p = useProgress();
  const s = courseStatus(p, course);
  return (
    <div>
      <Link to={`/course/${course.id}`} className="block font-bold text-[16px] leading-snug hover:text-accent" onClick={onPick}>
        {course.title}
      </Link>
      <div className="flex justify-between text-[13px] text-muted mt-2 mb-1.5">
        <span>
          {s.done} of {s.total} complete
        </span>
      </div>
      <ProgressBar value={s.pct} color={tone[course.color].stroke} className="h-1.5" />
      <ol className="mt-4 flex flex-col gap-0.5">
        {course.lessons.map((l, i) => {
          const done = !!p.lessons[l.id]?.completedAt;
          const active = l.id === current;
          return (
            <li key={l.id}>
              <Link
                to={`/course/${course.id}/${l.id}`}
                onClick={onPick}
                aria-current={active ? 'page' : undefined}
                className={cx('flex gap-2.5 rounded-lg px-2 py-2 text-[14px] leading-snug', active ? 'bg-accent-soft text-accent-ink font-semibold' : 'hover:bg-sunk')}
              >
                <span
                  className={cx(
                    'mt-px h-5 w-5 shrink-0 rounded-full flex items-center justify-center text-[11px] font-bold border',
                    done ? 'bg-ok border-ok text-white dark:text-[#0d1120]' : 'border-line-strong text-muted',
                  )}
                >
                  {done ? <IconCheck size={12} strokeWidth={3.5} /> : i + 1}
                </span>
                <span>{l.title}</span>
              </Link>
            </li>
          );
        })}
        <li>
          <Link to={`/course/${course.id}/exam`} onClick={onPick} className="flex gap-2.5 rounded-lg px-2 py-2 text-[14px] hover:bg-sunk">
            <span className={cx('mt-px h-5 w-5 shrink-0 rounded-full border', s.examPassed ? 'bg-ok border-ok' : 'border-dashed border-line-strong')} />
            <span>Final exam</span>
          </Link>
        </li>
      </ol>
    </div>
  );
}

function useScrollProgress() {
  const [v, setV] = useState(0);
  useEffect(() => {
    const on = () => {
      const h = document.documentElement;
      const max = h.scrollHeight - h.clientHeight;
      setV(max > 0 ? h.scrollTop / max : 0);
    };
    on();
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);
  return v;
}

export default function LessonPage() {
  const { courseId, lessonId } = useParams();
  const course = getCourse(courseId);
  const lesson = course?.lessons.find((l) => l.id === lessonId);
  const [html, setHtml] = useState<string | null>(null);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [outline, setOutline] = useState(false);
  const done = useProgress((s) => (lessonId ? !!s.lessons[lessonId]?.completedAt : false));
  const visit = useProgress((s) => s.visit);
  const progress = useScrollProgress();
  useTitle(lesson?.title ?? 'Lesson');

  useEffect(() => {
    if (!course || !lesson) return;
    let alive = true;
    setHtml(null);
    visit(course.id, lesson.id);
    loadLessonHtml(lesson.id).then((h) => alive && setHtml(h));
    loadExercises(course.id).then((ex) => alive && setExercises(ex.filter((e) => e.lesson === lesson.id)));
    return () => {
      alive = false;
    };
  }, [course, lesson, visit]);

  useEffect(() => setOutline(false), [lessonId]);

  if (!course || !lesson) return <NotFound />;
  const index = course.lessons.indexOf(lesson);
  const { prev, next } = neighbours(course.id, lesson.id);
  const nextHref = next ? `/course/${course.id}/${next.id}` : undefined;

  return (
    <>
      <div className="fixed top-16 left-0 right-0 z-40 h-[3px] bg-transparent no-print" aria-hidden>
        <div className="h-full bg-accent transition-[width] duration-150" style={{ width: `${progress * 100}%` }} />
      </div>
      <div className="mx-auto max-w-[1360px] px-4 sm:px-6 grid lg:grid-cols-[270px_minmax(0,1fr)] xl:grid-cols-[270px_minmax(0,1fr)_220px] gap-8 xl:gap-10">
        <aside className="hidden lg:block">
          <div className="sticky top-24 max-h-[calc(100dvh-7rem)] overflow-y-auto pr-2 pb-8">
            <Outline course={course} current={lesson.id} />
          </div>
        </aside>

        <article className="min-w-0 pt-6 pb-10 max-w-[780px]">
          <div className="flex items-center justify-between gap-3">
            <nav className="text-[14px] text-muted truncate" aria-label="Breadcrumb">
              <Link to="/courses" className="hover:text-ink">
                Courses
              </Link>{' '}
              /{' '}
              <Link to={`/course/${course.id}`} className="hover:text-ink">
                {course.title}
              </Link>
            </nav>
            <button type="button" onClick={() => setOutline(true)} className="lg:hidden shrink-0 inline-flex items-center gap-1.5 text-[14px] font-semibold rounded-lg border border-line px-3 py-1.5">
              <IconList size={16} /> Lessons
            </button>
          </div>

          <header className="mt-6 mb-8">
            <p className={cx('font-semibold text-[15px]', tone[course.color].text)}>
              Lesson {index + 1} of {course.lessons.length}
            </p>
            <h1 className="mt-2 font-wide text-[32px] sm:text-[44px] leading-[1.06] font-[760] tracking-[-0.025em] text-balance">{lesson.title}</h1>
            <p className="mt-4 font-serif text-[19px] sm:text-[21px] leading-relaxed text-muted text-pretty">{lesson.lead}</p>
            <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-[14px] text-muted">
              <span className="inline-flex items-center gap-1.5">
                <IconClock size={15} /> {lesson.minutes} min read
              </span>
              <a href="#quiz" onClick={(e) => (e.preventDefault(), document.getElementById('quiz')?.scrollIntoView({ behavior: 'smooth' }))} className="hover:text-ink underline-offset-2 hover:underline">
                {lesson.questions} quiz questions
              </a>
              {done && (
                <span className="inline-flex items-center gap-1 text-ok font-semibold">
                  <IconCheck size={16} strokeWidth={3} /> Completed
                </span>
              )}
            </div>
          </header>

          {html === null ? (
            <div className="flex flex-col gap-3" aria-label="Loading lesson">
              {[90, 100, 80, 95, 60].map((w, i) => (
                <div key={i} className="h-4 rounded bg-sunk animate-pulse" style={{ width: `${w}%` }} />
              ))}
            </div>
          ) : (
            <HtmlContent html={html} />
          )}

          {html !== null && (
            <div className="mt-14 pt-10 border-t-2 border-line">
              <LessonQuiz course={course} lesson={lesson} nextHref={nextHref} />
            </div>
          )}

          {html !== null && exercises.length > 0 && (
            <div className="mt-14">
              <h2 className="font-wide text-[26px] font-[750] tracking-tight">Code exercises</h2>
              <p className="text-muted mt-1 mb-5">
                Write Python in the editor and run the tests. The code runs in your browser, so the first run takes a few seconds to load Python. These exercises are optional
                practice and do not affect lesson completion.
              </p>
              <Suspense fallback={<div className="h-48 rounded-2xl bg-sunk animate-pulse" />}>
                <div className="flex flex-col gap-5">
                  {exercises.map((ex, i) => (
                    <CodeExercise key={ex.id} ex={ex} n={i + 1} />
                  ))}
                </div>
              </Suspense>
            </div>
          )}

          <nav className="mt-14 grid grid-cols-2 gap-3" aria-label="Lesson navigation">
            {prev ? (
              <Link to={`/course/${course.id}/${prev.id}`} className="group rounded-2xl border border-line p-4 hover:border-accent">
                <span className="text-[13px] text-muted inline-flex items-center gap-1">
                  <IconChevronLeft size={15} /> Previous
                </span>
                <span className="block font-semibold mt-1 leading-snug group-hover:text-accent">{prev.title}</span>
              </Link>
            ) : (
              <span />
            )}
            {next ? (
              <Link to={`/course/${course.id}/${next.id}`} className="group rounded-2xl border border-line p-4 text-right hover:border-accent">
                <span className="text-[13px] text-muted inline-flex items-center gap-1">
                  Next <IconChevronRight size={15} />
                </span>
                <span className="block font-semibold mt-1 leading-snug group-hover:text-accent">{next.title}</span>
              </Link>
            ) : (
              <Link to={`/course/${course.id}/exam`} className="group rounded-2xl border border-line p-4 text-right hover:border-accent">
                <span className="text-[13px] text-muted inline-flex items-center gap-1">
                  Finish <IconChevronRight size={15} />
                </span>
                <span className="block font-semibold mt-1 group-hover:text-accent">Final exam</span>
              </Link>
            )}
          </nav>
        </article>

        <aside className="hidden xl:block">
          {lesson.toc.length > 1 && (
            <div className="sticky top-24 pt-8">
              <p className="text-[14px] font-bold mb-2">On this page</p>
              <ul className="flex flex-col gap-1.5 text-[13.5px] border-l border-line">
                {lesson.toc.map((t) => (
                  <li key={t.id}>
                    <a
                      href={`#${t.id}`}
                      onClick={(e) => {
                        e.preventDefault();
                        document.getElementById(t.id)?.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="block pl-3 -ml-px border-l border-transparent text-muted hover:text-ink hover:border-ink leading-snug"
                    >
                      {t.text}
                    </a>
                  </li>
                ))}
                <li>
                  <a
                    href="#quiz"
                    onClick={(e) => {
                      e.preventDefault();
                      document.getElementById('quiz')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="block pl-3 -ml-px border-l border-transparent text-accent font-semibold hover:border-accent"
                  >
                    Quiz
                  </a>
                </li>
              </ul>
            </div>
          )}
        </aside>
      </div>

      {outline && (
        <div className="fixed inset-0 z-[70] bg-black/40 lg:hidden" onClick={() => setOutline(false)}>
          <div
            className="absolute right-0 top-0 bottom-0 w-[86%] max-w-[340px] bg-bg border-l border-line p-5 overflow-y-auto animate-pop"
            role="dialog"
            aria-modal="true"
            aria-label="Course lessons"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-end mb-2">
              <button type="button" onClick={() => setOutline(false)} className="h-9 w-9 inline-flex items-center justify-center rounded-lg hover:bg-sunk" aria-label="Close lessons">
                <IconX />
              </button>
            </div>
            <Outline course={course} current={lesson.id} onPick={() => setOutline(false)} />
          </div>
        </div>
      )}
    </>
  );
}
