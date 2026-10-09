import { Link, useParams } from 'react-router-dom';
import { IconAward, IconCheck, IconChevronRight, IconClock, IconCode, IconLock } from '../components/icons';
import { btn, cx, ProgressBar, Ring, tone, useTitle } from '../components/ui';
import { courses, getCourse } from '../lib/catalog';
import { courseStatus, EXAM_PASS_PCT, pct } from '../lib/progress';
import { useProgress } from '../lib/store';
import NotFound from './NotFound';

export default function CoursePage() {
  const { courseId } = useParams();
  const c = getCourse(courseId);
  const p = useProgress();
  useTitle(c?.title ?? 'Course');
  if (!c) return <NotFound />;
  const s = courseStatus(p, c);
  const t = tone[c.color];
  const n = courses.indexOf(c) + 1;
  const next = c.lessons.find((l) => !p.lessons[l.id]?.completedAt);
  const exam = p.exams[c.id];

  return (
    <div className="mx-auto max-w-[1100px] px-4 sm:px-6">
      <nav className="pt-6 text-[14px] text-muted" aria-label="Breadcrumb">
        <Link to="/courses" className="hover:text-ink">
          Courses
        </Link>{' '}
        / <span className="text-ink">{c.title}</span>
      </nav>
      <header className="pt-6 pb-8 grid md:grid-cols-[1fr_auto] gap-8 items-end border-b border-line">
        <div>
          <p className="flex flex-wrap gap-x-4 font-semibold">
            <span className={t.text}>
              Course {n} of {courses.length}
            </span>
            <span className="text-muted font-medium">{c.level}</span>
          </p>
          <h1 className="animate-fade-up mt-2 font-wide text-[38px] sm:text-[54px] leading-[1.02] font-[780] tracking-[-0.03em] text-balance">{c.title}</h1>
          <p className="animate-fade-up mt-4 text-lg text-muted max-w-2xl" style={{ ['--d' as string]: 1 }}>
            {c.description}
          </p>
          <div className="animate-fade-up mt-6 flex flex-wrap gap-3" style={{ ['--d' as string]: 2 }}>
            {next ? (
              <Link to={`/course/${c.id}/${next.id}`} className={btn.primary}>
                {s.started ? 'Continue' : 'Start the course'} <IconChevronRight size={18} />
              </Link>
            ) : (
              <Link to={s.examPassed ? `/certificate/${c.id}` : `/course/${c.id}/exam`} className={btn.primary}>
                <IconAward size={18} /> {s.examPassed ? 'View certificate' : 'Take the final exam'}
              </Link>
            )}
          </div>
        </div>
        <div className="animate-fade-up flex md:flex-col items-center gap-4 md:gap-2" style={{ ['--d' as string]: 2 }}>
          <Ring value={s.pct} size={112} stroke={10} color={t.stroke}>
            <span className="text-[26px] font-bold">{pct(s.pct)}</span>
          </Ring>
          <span className="text-[14px] text-muted">
            {s.done} of {s.total} lessons
          </span>
        </div>
      </header>

      <div className="grid lg:grid-cols-[1fr_300px] gap-10 pt-8">
        <div>
          <h2 className="text-[20px] font-bold mb-3">Lessons</h2>
          <ol className="border-y border-line divide-y divide-line">
            {c.lessons.map((l, i) => {
              const done = !!p.lessons[l.id]?.completedAt;
              const q = p.quizzes[l.id];
              const visited = !!p.lessons[l.id]?.visitedAt;
              return (
                <li key={l.id} data-reveal style={{ ['--d' as string]: Math.min(i, 6) }}>
                  <Link
                    to={`/course/${c.id}/${l.id}`}
                    className="group grid grid-cols-[36px_1fr_auto] gap-3 py-4 px-2 -mx-2 rounded-xl items-start transition-[background-color,transform] duration-300 hover:bg-surface/80 hover:translate-x-1"
                  >
                    <span
                      className={cx(
                        'mt-0.5 h-8 w-8 rounded-full flex items-center justify-center text-[14px] font-bold border-2 transition-transform duration-300 group-hover:scale-110',
                        done ? 'bg-ok border-ok text-white dark:text-[#0d1120]' : visited ? 'border-accent text-accent' : 'border-line-strong text-muted',
                      )}
                      aria-label={done ? 'Completed' : visited ? 'In progress' : 'Not started'}
                    >
                      {done ? <IconCheck size={16} strokeWidth={3} /> : i + 1}
                    </span>
                    <span className="min-w-0">
                      <span className="block font-semibold text-[17px] leading-snug group-hover:text-accent">{l.title}</span>
                      <span className="block text-[14.5px] text-muted mt-1 line-clamp-2">{l.lead}</span>
                      <span className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-muted">
                        <span className="inline-flex items-center gap-1">
                          <IconClock size={14} /> {l.minutes} min
                        </span>
                        <span>{l.questions} quiz questions</span>
                        {l.exercises.length > 0 && (
                          <span className="inline-flex items-center gap-1">
                            <IconCode size={14} /> {l.exercises.length} code {l.exercises.length > 1 ? 'exercises' : 'exercise'}
                          </span>
                        )}
                        {q?.best ? <span className={done ? 'text-ok' : ''}>Best {pct(q.best)}</span> : null}
                      </span>
                    </span>
                    <IconChevronRight className="mt-1 text-muted group-hover:text-accent" />
                  </Link>
                </li>
              );
            })}
            <li>
              <Link to={`/course/${c.id}/exam`} className={cx('group grid grid-cols-[36px_1fr_auto] gap-3 py-4 items-start', !s.lessonsComplete && 'opacity-80')}>
                <span
                  className={cx(
                    'mt-0.5 h-8 w-8 rounded-full flex items-center justify-center border-2',
                    s.examPassed ? 'bg-ok border-ok text-white dark:text-[#0d1120]' : s.lessonsComplete ? 'border-accent text-accent' : 'border-line-strong text-muted',
                  )}
                >
                  {s.examPassed ? <IconCheck size={16} strokeWidth={3} /> : s.lessonsComplete ? <IconAward size={16} /> : <IconLock size={15} />}
                </span>
                <span>
                  <span className="block font-semibold text-[17px] group-hover:text-accent">Final exam</span>
                  <span className="block text-[14.5px] text-muted mt-1">
                    {s.lessonsComplete
                      ? exam?.attempts
                        ? `Best score ${pct(exam.best)}. Pass mark ${EXAM_PASS_PCT}.`
                        : `Questions drawn from the whole course. Pass mark ${EXAM_PASS_PCT}.`
                      : `Opens when all ${s.total} lessons are complete.`}
                  </span>
                </span>
                <IconChevronRight className="mt-1 text-muted group-hover:text-accent" />
              </Link>
            </li>
            <li>
              <Link to={`/certificate/${c.id}`} className="group grid grid-cols-[36px_1fr_auto] gap-3 py-4 items-start">
                <span className={cx('mt-0.5 h-8 w-8 rounded-full flex items-center justify-center border-2', s.certified ? 'bg-warn border-warn text-white' : 'border-line-strong text-muted')}>
                  <IconAward size={16} />
                </span>
                <span>
                  <span className="block font-semibold text-[17px] group-hover:text-accent">Certificate</span>
                  <span className="block text-[14.5px] text-muted mt-1">{s.certified ? 'Earned. Download it or print it.' : 'Earned by completing every lesson and passing the final exam.'}</span>
                </span>
                <IconChevronRight className="mt-1 text-muted group-hover:text-accent" />
              </Link>
            </li>
          </ol>
        </div>
        <aside data-reveal className="flex flex-col gap-8">
          <div>
            <h2 className="text-[17px] font-bold mb-3">What you will learn</h2>
            <ul className="flex flex-col gap-2.5">
              {c.outcomes.map((o) => (
                <li key={o} className="flex gap-2.5 text-[15px]">
                  <IconCheck size={18} className={cx('mt-0.5 shrink-0', t.text)} strokeWidth={2.5} />
                  {o}
                </li>
              ))}
            </ul>
          </div>
          <div className="text-[15px] flex flex-col gap-1.5">
            <h2 className="text-[17px] font-bold mb-1">At a glance</h2>
            <p>{c.lessons.length} lessons, about {Math.max(1, Math.round(c.minutes / 60))} hours</p>
            <p>
              {c.questions} quiz questions and a {Math.min(c.questions + c.examQuestions, 20)}-question final exam
            </p>
            {c.exercises > 0 && <p>{c.exercises} Python exercises that run in your browser</p>}
          </div>
          {c.prereqs.length > 0 && (
            <div>
              <h2 className="text-[17px] font-bold mb-2">Before you start</h2>
              <p className="text-[15px] text-muted mb-3">This course builds on:</p>
              {c.prereqs.map((id) => {
                const pc = getCourse(id)!;
                const ps = courseStatus(p, pc);
                return (
                  <Link key={id} to={`/course/${id}`} className="block mb-3 group">
                    <span className="flex justify-between text-[15px] font-semibold group-hover:text-accent">
                      {pc.title}
                      <span className="text-muted font-normal text-[13px]">{pct(ps.pct)}</span>
                    </span>
                    <ProgressBar value={ps.pct} color={tone[pc.color].stroke} className="mt-1.5 h-1.5" />
                  </Link>
                );
              })}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
