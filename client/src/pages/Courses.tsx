import { useState } from 'react';
import { Link } from 'react-router-dom';
import { IconAward } from '../components/icons';
import { cx, PageHeader, ProgressBar, tone, useTitle } from '../components/ui';
import { catalog, courses, getCourse } from '../lib/catalog';
import { courseStatus } from '../lib/progress';
import { useProgress } from '../lib/store';

export default function Courses() {
  useTitle('Courses');
  const p = useProgress();
  const [track, setTrack] = useState('all');
  const list = courses.filter((c) => track === 'all' || c.track === track);

  return (
    <div className="mx-auto max-w-[1280px] px-4 sm:px-6">
      <PageHeader title="Courses" sub="Sixteen courses, from Python and linear algebra to agents and distributed training. Follow the order or jump to what you need." />
      <div className="animate-fade-up flex flex-wrap gap-2 mb-8" style={{ ['--d' as string]: 3 }} role="tablist" aria-label="Filter by track">
        {[{ id: 'all', title: 'All' }, ...catalog.tracks].map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={track === t.id}
            onClick={() => setTrack(t.id)}
            className={cx(
              'rounded-full px-4 py-1.5 text-[14.5px] font-medium border transition-all duration-300 active:scale-95',
              track === t.id ? 'bg-ink text-bg border-ink shadow-[0_6px_18px_-8px_var(--glow)] scale-[1.03]' : 'border-line bg-surface/60 hover:border-accent hover:text-accent',
            )}
          >
            {t.title}
          </button>
        ))}
      </div>
      <div className="grid md:grid-cols-2 gap-5">
        {list.map((c, i) => {
          const s = courseStatus(p, c);
          const n = courses.indexOf(c) + 1;
          const t = tone[c.color];
          return (
            <Link
              key={`${track}-${c.id}`}
              to={`/course/${c.id}`}
              data-reveal
              style={{ ['--d' as string]: i % 2 }}
              className="group relative card-lift glow-border rounded-2xl border border-line bg-surface p-6 pl-7 flex flex-col overflow-hidden"
            >
              <span className={cx('absolute left-0 top-6 bottom-6 w-1 rounded-r transition-all duration-500 group-hover:top-0 group-hover:bottom-0 group-hover:w-1.5', t.bg)} aria-hidden />
              <span
                aria-hidden
                className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-40"
                style={{ background: t.stroke }}
              />
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className={cx('text-[14px] font-semibold', t.text)}>
                    Course {n} of {courses.length}
                  </p>
                  <h2 className="mt-1 text-[23px] font-bold leading-tight group-hover:text-accent">{c.title}</h2>
                </div>
                {s.certified && (
                  <span className="inline-flex items-center gap-1 text-ok text-[13.5px] font-semibold shrink-0">
                    <IconAward size={17} /> Certified
                  </span>
                )}
              </div>
              <p className="mt-2 text-muted text-[15.5px]">{c.description}</p>
              <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-[14px]">
                <span>{c.level}</span>
                <span>{c.lessons.length} lessons</span>
                <span>About {Math.max(1, Math.round(c.minutes / 60))} hours</span>
                <span>{c.questions + c.examQuestions} questions</span>
                {c.exercises > 0 && <span>{c.exercises} code exercises</span>}
              </div>
              {c.prereqs.length > 0 && (
                <p className="mt-2 text-[14px] text-muted">
                  Builds on {c.prereqs.map((id) => getCourse(id)?.title).join(' and ')}
                </p>
              )}
              <div className="mt-auto pt-5">
                <div className="flex justify-between text-[13px] text-muted mb-1.5">
                  <span>{s.started ? `${s.done} of ${s.total} lessons complete` : 'Not started'}</span>
                  {s.examPassed && <span>Exam passed</span>}
                </div>
                <ProgressBar value={s.pct} color={t.stroke} label={`${c.title} progress`} />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
