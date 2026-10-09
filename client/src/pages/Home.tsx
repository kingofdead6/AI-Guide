import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { LearningMap } from '../components/LearningMap';
import { IconAward, IconBook, IconChevronRight, IconCode, IconSpark, IconTarget } from '../components/icons';
import { CountUp } from '../components/motion';
import { btn, cx, ProgressBar, tone, useTitle } from '../components/ui';
import { catalog, courses, totalExercises, totalHours, totalLessons, totalQuestions } from '../lib/catalog';
import { courseStatus, nextUp, overall } from '../lib/progress';
import { useProgress } from '../lib/store';

export default function Home() {
  useTitle('');
  const p = useProgress();
  const o = overall(p);
  const up = nextUp(p);
  const fresh = o.lessonsDone === 0 && !p.last;
  const examQ = courses.reduce((n, c) => n + c.examQuestions, 0);

  return (
    <>
      <section className="mx-auto max-w-[1280px] px-4 sm:px-6 pt-10 sm:pt-16">
        <div className="grid lg:grid-cols-[1.05fr_1fr] gap-6 lg:gap-14 items-end">
          <h1 className="font-wide text-[46px] sm:text-[72px] lg:text-[84px] leading-[0.95] font-[800] tracking-[-0.04em] text-balance">
            {['From', 'vectors', 'to'].map((w, i) => (
              <span key={w}>
                <span className="word-in" style={{ ['--w' as string]: i }}>
                  {w}
                </span>{' '}
              </span>
            ))}
            <span className="word-in" style={{ ['--w' as string]: 3 }}>
              <span className="text-gradient pr-1">agents.</span>
            </span>
          </h1>
          <div>
            <p className="animate-fade-up text-lg sm:text-xl text-muted text-pretty" style={{ ['--d' as string]: 3 }}>
              A self-paced academy for becoming an AI engineer. {courses.length} courses with derivations, diagrams and live demos, then graded quizzes, Python exercises and a
              certificate for every course you finish.
            </p>
            <div className="animate-fade-up mt-6 flex flex-wrap gap-3" style={{ ['--d' as string]: 4 }}>
              {up ? (
                <Link to={`/course/${up.course.id}/${up.lesson.id}`} className={btn.primary}>
                  {fresh ? `Start with ${up.course.title}` : up.resume ? 'Resume lesson' : 'Continue learning'}
                  <IconChevronRight size={18} />
                </Link>
              ) : (
                <Link to="/certificate/program" className={btn.primary}>
                  <IconAward size={18} /> View your certificate
                </Link>
              )}
              <Link to={fresh ? '/start' : '/courses'} className={btn.secondary}>
                {fresh ? 'How it works' : 'All courses'}
              </Link>
            </div>
          </div>
        </div>
        <div className="animate-fade-up mt-10 rounded-3xl border border-line bg-surface graph-paper p-3 sm:p-6 shadow-[var(--shadow-lift)]" style={{ ['--d' as string]: 5 }}>
          <LearningMap />
          <div className="px-2 pt-3 flex flex-wrap justify-between gap-x-6 gap-y-1 text-[14px] text-muted">
            <span>The curriculum as a network. Arrows point from a course to the ones that build on it; rings fill as you finish lessons.</span>
            <span>
              {totalLessons} lessons, {totalQuestions + examQ} graded questions, {totalExercises} code exercises, about {totalHours} hours
            </span>
          </div>
        </div>
      </section>

      {!fresh && up && (
        <section className="mx-auto max-w-[1280px] px-4 sm:px-6 mt-12">
          <div data-reveal className="card-lift glow-border rounded-2xl border border-line bg-surface p-5 sm:p-6 grid sm:grid-cols-[1fr_auto] gap-5 items-center">
            <div className="min-w-0">
              <p className="text-[14px] text-muted">{up.resume ? 'Pick up where you left off' : 'Up next'}</p>
              <p className="mt-1 text-[22px] font-bold leading-tight">{up.lesson.title}</p>
              <p className="text-muted mt-1 truncate">{up.course.title}</p>
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-[14px]">
                <Stat label="Lessons done" value={<><CountUp value={o.lessonsDone} /> / {o.lessonsTotal}</>} />
                <Stat label="Quiz accuracy" value={o.answered ? <CountUp value={o.accuracy * 100} format={(n) => `${Math.round(n)}%`} /> : '—'} />
                <Stat label="Day streak" value={<CountUp value={o.streak} />} />
                <Stat label="Certificates" value={<CountUp value={o.certified} />} />
              </div>
            </div>
            <Link to={`/course/${up.course.id}/${up.lesson.id}`} className={btn.primary}>
              {up.resume ? 'Resume' : 'Start lesson'} <IconChevronRight size={18} />
            </Link>
          </div>
        </section>
      )}

      <section className="mx-auto max-w-[1280px] px-4 sm:px-6 mt-16">
        <h2 data-reveal className="font-wide text-[30px] sm:text-[36px] font-[750] tracking-tight">The path</h2>
        <p data-reveal style={{ ['--d' as string]: 1 }} className="text-muted mt-1 max-w-2xl">Courses in recommended order. Each one ends with a final exam and a certificate.</p>
        <div className="mt-8 flex flex-col gap-10">
          {catalog.tracks.map((t) => {
            const list = courses.filter((c) => c.track === t.id);
            return (
              <div key={t.id} className="grid md:grid-cols-[220px_1fr] gap-4 md:gap-8">
                <div data-reveal="left" className="md:sticky md:top-24 self-start">
                  <h3 className="text-[19px] font-bold">{t.title}</h3>
                  <p className="text-[14.5px] text-muted mt-1">{t.blurb}</p>
                </div>
                <ol className="divide-y divide-line border-y border-line">
                  {list.map((c, j) => {
                    const s = courseStatus(p, c);
                    const n = courses.indexOf(c) + 1;
                    return (
                      <li key={c.id} data-reveal style={{ ['--d' as string]: j }}>
                        <Link
                          to={`/course/${c.id}`}
                          className="group grid grid-cols-[40px_1fr_auto] sm:grid-cols-[48px_1fr_160px_24px] items-center gap-3 py-4 px-2 -mx-2 rounded-xl transition-[background-color,transform] duration-300 hover:bg-surface/80 hover:translate-x-1"
                        >
                          <span
                            className={cx(
                              'h-9 w-9 sm:h-10 sm:w-10 rounded-full flex items-center justify-center font-bold text-[15px] border-2 transition-transform duration-300 group-hover:scale-110',
                              s.certified ? `${tone[c.color].bg} border-transparent text-white dark:text-[#0d1120]` : `${tone[c.color].border} ${tone[c.color].text}`,
                            )}
                          >
                            {n}
                          </span>
                          <span className="min-w-0">
                            <span className="block font-semibold text-[17px] group-hover:text-accent">{c.title}</span>
                            <span className="block text-[14.5px] text-muted truncate">{c.tagline}</span>
                          </span>
                          <span className="hidden sm:block">
                            <span className="flex justify-between text-[13px] text-muted mb-1">
                              <span>{s.certified ? 'Certified' : s.started ? `${s.done}/${s.total} lessons` : `${c.lessons.length} lessons`}</span>
                              <span>{Math.round(c.minutes / 60)} h</span>
                            </span>
                            <ProgressBar value={s.pct} color={tone[c.color].stroke} label={`${c.title} progress`} />
                          </span>
                          <IconChevronRight className="text-muted group-hover:text-accent transition-transform duration-300 group-hover:translate-x-1" />
                        </Link>
                      </li>
                    );
                  })}
                </ol>
              </div>
            );
          })}
        </div>
      </section>

      <section className="mx-auto max-w-[1280px] px-4 sm:px-6 mt-16 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { to: '/projects', icon: IconTarget, title: 'Guided projects', text: 'Six portfolio projects with milestones you can tick off.' },
          { to: '/playground', icon: IconSpark, title: 'Playground', text: 'Train a network, race optimizers and explore attention.' },
          { to: '/glossary', icon: IconBook, title: 'Glossary', text: 'Every key term in one place, with flashcards.' },
          { to: '/cheatsheet', icon: IconCode, title: 'Cheat sheet', text: 'The equations worth knowing by heart.' },
        ].map(({ to, icon: Icon, title, text }, i) => (
          <Link key={to} to={to} data-reveal style={{ ['--d' as string]: i }} className="group card-lift glow-border rounded-2xl border border-line bg-surface p-5">
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-accent-soft">
              <Icon className="text-accent icon-bounce" size={22} />
            </span>
            <p className="mt-3 font-bold text-[17px] group-hover:text-accent">{title}</p>
            <p className="text-muted text-[14.5px] mt-1">{text}</p>
          </Link>
        ))}
      </section>
    </>
  );
}

function Stat({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <div className="text-[20px] font-bold">{value}</div>
      <div className="text-muted text-[13px]">{label}</div>
    </div>
  );
}
