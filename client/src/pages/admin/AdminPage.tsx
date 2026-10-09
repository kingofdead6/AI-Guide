import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { IconAward, IconChevronRight, IconFlame, IconRefresh, IconSearch, IconUser, IconUsers } from '../../components/icons';
import { CountUp } from '../../components/motion';
import { cx, PageHeader, ProgressBar, tone, useTitle } from '../../components/ui';
import { Avatar } from '../../components/UserMenu';
import { api } from '../../lib/api';
import { courses, totalLessons } from '../../lib/catalog';
import { courseStatus, overall, pct } from '../../lib/progress';
import { AdminGate, ago, fmtDate, normalize, RoleBadge, type AdminUser } from './shared';

type Stats = { users: number; admins: number; active7: number; active30: number; new7: number };
type Row = AdminUser & { o: ReturnType<typeof overall>; started: number };
type Sort = 'active' | 'progress' | 'name' | 'joined' | 'certs';

export default function AdminPage() {
  useTitle('Admin');
  return (
    <AdminGate>
      <Dashboard />
    </AdminGate>
  );
}

function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<AdminUser[] | null>(null);
  const [err, setErr] = useState('');
  const [q, setQ] = useState('');
  const [sort, setSort] = useState<Sort>('active');
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let alive = true;
    setErr('');
    Promise.all([api<Stats>('/admin/stats'), api<{ users: AdminUser[] }>('/admin/users')])
      .then(([s, u]) => {
        if (!alive) return;
        setStats(s);
        setUsers(u.users);
      })
      .catch((e: Error) => alive && setErr(e.message));
    return () => {
      alive = false;
    };
  }, [tick]);

  const rows: Row[] = useMemo(
    () =>
      (users ?? []).map((u) => {
        const p = normalize(u.progress);
        return { ...u, o: overall(p), started: courses.filter((c) => courseStatus(p, c).started).length };
      }),
    [users],
  );

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    const list = t ? rows.filter((r) => r.name.toLowerCase().includes(t) || r.email.toLowerCase().includes(t)) : rows.slice();
    const by: Record<Sort, (a: Row, b: Row) => number> = {
      active: (a, b) => +new Date(b.lastSeenAt) - +new Date(a.lastSeenAt),
      progress: (a, b) => b.o.lessonsDone - a.o.lessonsDone,
      name: (a, b) => a.name.localeCompare(b.name),
      joined: (a, b) => +new Date(b.createdAt) - +new Date(a.createdAt),
      certs: (a, b) => b.o.certified - a.o.certified || b.o.lessonsDone - a.o.lessonsDone,
    };
    return list.sort(by[sort]);
  }, [rows, q, sort]);

  const totals = useMemo(() => {
    const certs = rows.reduce((n, r) => n + r.o.certified, 0);
    const lessons = rows.reduce((n, r) => n + r.o.lessonsDone, 0);
    const avg = rows.length ? lessons / rows.length / totalLessons : 0;
    const perCourse = courses.map((c) => {
      let started = 0;
      let certified = 0;
      for (const u of users ?? []) {
        const s = courseStatus(normalize(u.progress), c);
        if (s.started) started++;
        if (s.certified) certified++;
      }
      return { c, started, certified };
    });
    return { certs, lessons, avg, perCourse };
  }, [rows, users]);

  return (
    <div className="mx-auto max-w-[1280px] px-4 sm:px-6">
      <PageHeader title="Admin panel" sub="Every learner, their activity and how far they have come in each course.">
        <button type="button" onClick={() => setTick((t) => t + 1)} className="animate-fade-up mt-5 inline-flex items-center gap-2 text-[14px] font-semibold text-accent hover:underline" style={{ ['--d' as string]: 3 }}>
          <IconRefresh size={16} /> Refresh
        </button>
      </PageHeader>

      {err && <p className="mb-6 rounded-xl border border-bad/40 bg-bad-soft px-4 py-3 text-bad font-medium animate-shake">{err}</p>}

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard d={0} label="Learners" value={stats?.users} sub={stats ? `${stats.admins} admin${stats.admins === 1 ? '' : 's'}` : ''} icon={<IconUsers size={20} />} color="var(--c1)" />
        <StatCard d={1} label="Active this week" value={stats?.active7} sub={stats ? `${stats.active30} in the last 30 days` : ''} icon={<IconFlame size={20} />} color="var(--c2)" />
        <StatCard d={2} label="New this week" value={stats?.new7} sub="sign-ups in the last 7 days" icon={<IconUser size={20} />} color="var(--c3)" />
        <StatCard d={3} label="Certificates earned" value={users ? totals.certs : undefined} sub={users ? `${pct(totals.avg)} average completion` : ''} icon={<IconAward size={20} />} color="var(--c4)" />
      </section>

      <section className="mt-10 grid lg:grid-cols-[1fr_340px] gap-8 items-start">
        <div data-reveal className="rounded-2xl border border-line bg-surface shadow-[var(--shadow-card)] overflow-hidden">
          <div className="flex flex-wrap items-center gap-3 p-4 border-b border-line">
            <h2 className="text-[18px] font-bold mr-auto">
              Learners {users && <span className="text-muted font-medium">({filtered.length})</span>}
            </h2>
            <label className="relative">
              <span className="sr-only">Search learners</span>
              <IconSearch size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search name or email"
                className="w-56 rounded-xl border border-line-strong bg-bg/60 pl-9 pr-3 py-2 text-[14.5px] outline-none transition-[border-color,box-shadow] focus:border-accent focus:shadow-[0_0_0_4px_var(--glow)]"
              />
            </label>
            <label className="text-[14px] text-muted flex items-center gap-2">
              Sort
              <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} className="rounded-xl border border-line-strong bg-bg/60 px-2.5 py-2 text-[14.5px] text-ink outline-none focus:border-accent">
                <option value="active">Last active</option>
                <option value="progress">Most progress</option>
                <option value="certs">Certificates</option>
                <option value="joined">Newest</option>
                <option value="name">Name</option>
              </select>
            </label>
          </div>

          <div className="hidden md:grid grid-cols-[minmax(0,1.6fr)_minmax(0,1.3fr)_90px_90px_110px_20px] gap-4 px-4 py-2.5 text-[12.5px] font-semibold uppercase tracking-wide text-muted border-b border-line bg-sunk/50">
            <span>Learner</span>
            <span>Lessons complete</span>
            <span>Accuracy</span>
            <span>Certs</span>
            <span>Last active</span>
            <span />
          </div>

          {!users && !err && (
            <div className="p-4 flex flex-col gap-3">
              {[0, 1, 2, 3, 4].map((i) => (
                <div key={i} className="h-12 rounded-xl skeleton" />
              ))}
            </div>
          )}
          {users && filtered.length === 0 && <p className="p-8 text-center text-muted">{q ? 'No learners match that search.' : 'No learners yet. Share the site and they will appear here.'}</p>}

          <ul className="divide-y divide-line">
            {filtered.map((r, i) => (
              <li key={r.id} className="animate-fade-up" style={{ ['--d' as string]: Math.min(i, 10) * 0.5 }}>
                <Link
                  to={`/admin/users/${r.id}`}
                  className="group grid grid-cols-[minmax(0,1fr)_auto] md:grid-cols-[minmax(0,1.6fr)_minmax(0,1.3fr)_90px_90px_110px_20px] gap-x-4 gap-y-2 items-center px-4 py-3.5 transition-colors hover:bg-accent-soft/50"
                >
                  <span className="flex items-center gap-3 min-w-0">
                    <Avatar name={r.name} size={38} className="transition-transform duration-300 group-hover:scale-110" />
                    <span className="min-w-0">
                      <span className="flex items-center gap-2">
                        <span className="font-semibold truncate group-hover:text-accent">{r.name}</span>
                        <RoleBadge role={r.role} />
                      </span>
                      <span className="block text-[13px] text-muted truncate">{r.email}</span>
                    </span>
                  </span>
                  <span className="md:hidden text-[13px] text-muted text-right">{ago(r.lastSeenAt)}</span>
                  <span className="col-span-2 md:col-span-1">
                    <span className="flex justify-between text-[12.5px] text-muted mb-1">
                      <span>
                        {r.o.lessonsDone} / {r.o.lessonsTotal}
                      </span>
                      <span>{r.started} courses started</span>
                    </span>
                    <ProgressBar value={r.o.lessonsDone / r.o.lessonsTotal} className="h-1.5" />
                  </span>
                  <span className="hidden md:block text-[14.5px]">{r.o.answered ? pct(r.o.accuracy) : '—'}</span>
                  <span className="hidden md:flex items-center gap-1 text-[14.5px]">
                    {r.o.certified > 0 && <IconAward size={15} className="text-warn" />}
                    {r.o.certified}
                  </span>
                  <span className="hidden md:block text-[13.5px] text-muted" title={fmtDate(r.lastSeenAt)}>
                    {ago(r.lastSeenAt)}
                  </span>
                  <IconChevronRight size={18} className="hidden md:block text-muted transition-transform duration-300 group-hover:translate-x-1 group-hover:text-accent" />
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <aside data-reveal style={{ ['--d' as string]: 1 }} className="rounded-2xl border border-line bg-surface p-5 shadow-[var(--shadow-card)]">
          <h2 className="text-[18px] font-bold">Courses</h2>
          <p className="text-[13.5px] text-muted mt-0.5">Learners who started each course, and how many earned its certificate.</p>
          <ul className="mt-4 flex flex-col gap-3.5">
            {totals.perCourse.map(({ c, started, certified }) => {
              const n = rows.length || 1;
              return (
                <li key={c.id}>
                  <div className="flex justify-between gap-3 text-[14px]">
                    <span className="font-medium truncate">{c.title}</span>
                    <span className="text-muted shrink-0 tabular-nums">
                      {started}
                      {certified > 0 && <span className="text-ok"> · {certified} ✓</span>}
                    </span>
                  </div>
                  <ProgressBar value={started / n} color={tone[c.color].stroke} className="mt-1.5 h-1.5" label={`${c.title}: ${started} learners started`} />
                </li>
              );
            })}
          </ul>
        </aside>
      </section>
    </div>
  );
}

function StatCard({ label, value, sub, icon, color, d }: { label: string; value?: number; sub: string; icon: ReactNode; color: string; d: number }) {
  return (
    <div data-reveal style={{ ['--d' as string]: d }} className="card-lift relative overflow-hidden rounded-2xl border border-line bg-surface p-5">
      <span aria-hidden className="absolute -right-8 -top-8 h-24 w-24 rounded-full opacity-20 blur-2xl" style={{ background: color }} />
      <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: `color-mix(in srgb, ${color} 16%, transparent)`, color }}>
        {icon}
      </span>
      <div className="mt-3 text-[30px] font-bold leading-none tabular-nums">{value === undefined ? <span className="inline-block h-7 w-12 rounded skeleton" /> : <CountUp value={value} />}</div>
      <div className="mt-1.5 font-semibold text-[14.5px]">{label}</div>
      <div className={cx('text-[13px] text-muted', !sub && 'invisible')}>{sub || '.'}</div>
    </div>
  );
}
