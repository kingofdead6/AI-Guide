import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { IconCheck, IconClock } from '../components/icons';
import { cx, PageHeader, ProgressBar, Rich, useTitle } from '../components/ui';
import raw from '../generated/projects.json';
import { getCourse } from '../lib/catalog';
import { useProgress } from '../lib/store';
import type { Project } from '../lib/types';

const projects = raw as Project[];

export default function ProjectsPage() {
  useTitle('Guided projects');
  const done = useProgress((s) => s.projects);
  const toggle = useProgress((s) => s.toggleMilestone);
  const loc = useLocation();
  useEffect(() => {
    const id = loc.hash.replace('#', '');
    if (id) setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }), 50);
  }, [loc.hash]);

  return (
    <div className="mx-auto max-w-[960px] px-4 sm:px-6">
      <PageHeader
        title="Guided projects"
        sub="Courses teach the ideas; projects prove you can use them. Each project is a portfolio piece with milestones you can tick off as you go."
      />
      <div className="flex flex-col gap-8">
        {projects.map((p, idx) => {
          const state = done[p.id] || {};
          const n = p.milestones.filter((m) => state[m.id]).length;
          return (
            <article key={p.id} id={p.id} className="rounded-3xl border border-line bg-surface p-6 sm:p-8 scroll-mt-24">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-[14px] text-muted">
                    Project {idx + 1}, {p.level}
                  </p>
                  <h2 className="mt-1 font-wide text-[26px] sm:text-[30px] font-[760] tracking-tight leading-tight">{p.title}</h2>
                </div>
                <span className="inline-flex items-center gap-1.5 text-[14px] text-muted">
                  <IconClock size={15} /> {p.hours}
                </span>
              </div>
              <Rich html={p.summary} className="mt-3 text-[17px]" />
              <Rich html={p.brief} className="mt-3 font-serif text-[17px] leading-relaxed text-ink/90" />
              <div className="mt-4 flex flex-wrap gap-2 text-[13.5px]">
                {p.courses.map((c) => (
                  <Link key={c} to={`/course/${c}`} className="rounded-full border border-line px-3 py-1 hover:border-accent hover:text-accent">
                    {getCourse(c)?.title}
                  </Link>
                ))}
              </div>
              <div className="mt-6">
                <div className="flex justify-between text-[14px] mb-1.5">
                  <span className="font-bold">Milestones</span>
                  <span className="text-muted">
                    {n} of {p.milestones.length}
                  </span>
                </div>
                <ProgressBar value={n / p.milestones.length} color="var(--ok)" />
                <ul className="mt-4 flex flex-col gap-1">
                  {p.milestones.map((m) => (
                    <li key={m.id}>
                      <label className="flex gap-3 items-start rounded-xl px-2 py-2.5 hover:bg-sunk cursor-pointer">
                        <input type="checkbox" className="sr-only peer" checked={!!state[m.id]} onChange={() => toggle(p.id, m.id)} />
                        <span
                          className={cx(
                            'mt-0.5 h-5 w-5 shrink-0 rounded-[6px] border-2 flex items-center justify-center peer-focus-visible:outline-2 peer-focus-visible:outline-accent',
                            state[m.id] ? 'bg-ok border-ok text-white dark:text-[#0a0a12]' : 'border-line-strong',
                          )}
                          aria-hidden
                        >
                          {state[m.id] && <IconCheck size={13} strokeWidth={3.5} />}
                        </span>
                        <span className={cx('text-[16px]', state[m.id] && 'text-muted line-through decoration-1')}>
                          <Rich html={m.text} as="span" />
                          {m.detail && <Rich html={m.detail} className="text-[14px] text-muted mt-0.5 no-underline" />}
                        </span>
                      </label>
                    </li>
                  ))}
                </ul>
              </div>
              {(p.stretch.length > 0 || p.rubric.length > 0) && (
                <div className="mt-6 grid md:grid-cols-2 gap-6 text-[15px]">
                  {p.rubric.length > 0 && (
                    <div>
                      <h3 className="font-bold mb-2">What good looks like</h3>
                      <ul className="list-disc pl-5 flex flex-col gap-1.5 text-ink/90">
                        {p.rubric.map((r, i) => (
                          <li key={i}>
                            <Rich html={r} as="span" />
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {p.stretch.length > 0 && (
                    <div>
                      <h3 className="font-bold mb-2">Stretch goals</h3>
                      <ul className="list-disc pl-5 flex flex-col gap-1.5 text-ink/90">
                        {p.stretch.map((r, i) => (
                          <li key={i}>
                            <Rich html={r} as="span" />
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}
