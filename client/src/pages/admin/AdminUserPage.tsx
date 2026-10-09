import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Heatmap } from '../../components/Heatmap';
import { IconArrowLeft, IconAward, IconCheck, IconChevronRight, IconClock, IconCode, IconFlame, IconShield, IconTarget, IconTrash } from '../../components/icons';
import { CountUp } from '../../components/motion';
import { btn, cx, Modal, ProgressBar, Ring, tone, useTitle } from '../../components/ui';
import { Avatar } from '../../components/UserMenu';
import { api } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { courses } from '../../lib/catalog';
import { courseStatus, overall, pct } from '../../lib/progress';
import { AdminGate, ago, fmtDate, normalize, RoleBadge, type AdminUser } from './shared';

export default function AdminUserPage() {
  return (
    <AdminGate>
      <Detail />
    </AdminGate>
  );
}

function Detail() {
  const { userId } = useParams();
  const nav = useNavigate();
  const me = useAuth((s) => s.user);
  const [u, setU] = useState<AdminUser | null>(null);
  const [err, setErr] = useState('');
  const [open, setOpen] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [busy, setBusy] = useState(false);
  useTitle(u ? `${u.name} · Admin` : 'Learner · Admin');

  useEffect(() => {
    let alive = true;
    api<{ user: AdminUser }>(`/admin/users/${userId}`)
      .then((r) => alive && setU(r.user))
      .catch((e: Error) => alive && setErr(e.message));
    return () => {
      alive = false;
    };
  }, [userId]);

  const p = useMemo(() => normalize(u?.progress), [u]);
  const o = useMemo(() => overall(p), [p]);

  if (err)
    return (
      <div className="mx-auto max-w-[900px] px-4 sm:px-6 pt-12">
        <BackLink />
        <p className="mt-6 rounded-xl border border-bad/40 bg-bad-soft px-4 py-3 text-bad font-medium">{err}</p>
      </div>
    );
  if (!u)
    return (
      <div className="mx-auto max-w-[1100px] px-4 sm:px-6 pt-12 flex flex-col gap-4">
        <div className="h-16 w-2/3 rounded-xl skeleton" />
        <div className="h-28 rounded-2xl skeleton" />
        <div className="h-64 rounded-2xl skeleton" />
      </div>
    );

  const isMe = me?.id === u.id;
  const setRole = async (role: 'user' | 'admin') => {
    setBusy(true);
    try {
      const r = await api<{ user: AdminUser }>(`/admin/users/${u.id}`, { method: 'PATCH', body: { role } });
      setU({ ...u, role: r.user.role });
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  const remove = async () => {
    setBusy(true);
    try {
      await api(`/admin/users/${u.id}`, { method: 'DELETE' });
      nav('/admin', { replace: true });
    } catch (e) {
      setErr((e as Error).message);
      setBusy(false);
    }
  };

  const projectsDone = Object.values(p.projects).reduce((n, ms) => n + Object.values(ms).filter(Boolean).length, 0);
  const lastLesson = p.last ? courses.find((c) => c.id === p.last!.courseId)?.lessons.find((l) => l.id === p.last!.lessonId) : undefined;

  return (
    <div className="mx-auto max-w-[1100px] px-4 sm:px-6">
      <div className="pt-6">
        <BackLink />
      </div>

      <header className="pt-6 pb-8 flex flex-wrap items-center gap-5 border-b border-line">
        <Avatar name={u.name} size={72} className="animate-spin-in text-[26px] shadow-lg" />
        <div className="min-w-0 flex-1 animate-fade-up">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="font-wide text-[30px] sm:text-[40px] leading-[1.05] font-[780] tracking-[-0.025em] truncate">{u.name}</h1>
            <RoleBadge role={u.role} />
          </div>
          <p className="text-muted mt-1">{u.email}</p>
          <p className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-[13.5px] text-muted">
            <span>Joined {fmtDate(u.createdAt)}</span>
            <span>Last active {ago(u.lastSeenAt)}</span>
            <span>Progress synced {ago(u.progressUpdatedAt)}</span>
            {p.name && p.name !== u.name && <span>Certificate name: {p.name}</span>}
          </p>
        </div>
        <div className="flex flex-wrap gap-2 animate-fade-up" style={{ ['--d' as string]: 1 }}>
          {u.role === 'admin' ? (
            <button type="button" className={btn.secondary} disabled={busy || isMe} onClick={() => setRole('user')} title={isMe ? 'You cannot remove your own admin access' : undefined}>
              <IconShield size={17} /> Remove admin
            </button>
          ) : (
            <button type="button" className={btn.secondary} disabled={busy} onClick={() => setRole('admin')}>
              <IconShield size={17} /> Make admin
            </button>
          )}
          {!isMe && (
            <button type="button" className={cx(btn.ghost, 'text-bad')} disabled={busy} onClick={() => setConfirmDelete(true)}>
              <IconTrash size={17} /> Delete
            </button>
          )}
        </div>
      </header>

      {u.deletionRequestedAt && (
        <div data-reveal className="mt-8 rounded-2xl border border-warn/40 bg-warn-soft p-5 flex flex-wrap items-start gap-4">
          <IconClock size={22} className="text-warn shrink-0 mt-0.5" />
          <div className="min-w-0 flex-1">
            <p className="font-bold">Deletion requested {ago(u.deletionRequestedAt)}</p>
            <p className={cx('mt-1 text-[14.5px]', !u.deletionReason && 'text-muted italic')}>{u.deletionReason || 'No reason given.'}</p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              className={btn.secondary}
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                try {
                  await api(`/admin/deletion-requests/${u.id}`, { method: 'DELETE' });
                  setU({ ...u, deletionRequestedAt: null, deletionReason: '' });
                } catch (e) {
                  setErr((e as Error).message);
                } finally {
                  setBusy(false);
                }
              }}
            >
              Keep account
            </button>
            <button type="button" className={btn.danger} disabled={busy} onClick={() => setConfirmDelete(true)}>
              <IconTrash size={16} /> Delete account
            </button>
          </div>
        </div>
      )}

      {!u.progress && (
        <p data-reveal className="mt-8 rounded-xl border border-line bg-sunk/60 px-4 py-3 text-muted">
          This learner has not saved any progress yet.
        </p>
      )}

      <section className="mt-8 grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div data-reveal className="card-lift col-span-2 lg:col-span-1 rounded-2xl border border-line bg-surface p-5 flex items-center gap-4">
          <Ring value={o.lessonsDone / o.lessonsTotal} size={68} stroke={7}>
            <span className="text-[13px] font-bold">{pct(o.lessonsDone / o.lessonsTotal)}</span>
          </Ring>
          <div>
            <div className="text-[22px] font-bold tabular-nums">
              <CountUp value={o.lessonsDone} />/{o.lessonsTotal}
            </div>
            <div className="text-muted text-[14px]">lessons complete</div>
          </div>
        </div>
        <Mini d={1} value={o.answered} label={`answers, ${o.answered ? pct(o.accuracy) : '0%'} correct`} icon={<IconCheck size={18} className="text-ok" strokeWidth={2.6} />} />
        <Mini d={2} value={o.certified} label={`certificates of ${courses.length}`} icon={<IconAward size={18} className="text-warn" />} />
        <Mini d={3} value={o.streak} label={`day streak, ${o.codePassed} exercises, ${projectsDone} milestones`} icon={<IconFlame size={18} className="text-c2" />} />
      </section>

      {lastLesson && (
        <p data-reveal className="mt-5 text-[14.5px] text-muted flex items-center gap-2">
          <IconClock size={16} /> Last opened <span className="text-ink font-medium">{lastLesson.title}</span> {ago(p.last!.at)}
        </p>
      )}

      <section data-reveal className="mt-10">
        <h2 className="text-[20px] font-bold mb-3">Activity</h2>
        <Heatmap activity={p.activity} caption={false} />
      </section>

      <section className="mt-10">
        <h2 data-reveal className="text-[20px] font-bold mb-1">
          Course progress
        </h2>
        <p data-reveal className="text-muted text-[14.5px] mb-4">
          Open a course to see each lesson, quiz score and exam attempt.
        </p>
        <div className="flex flex-col gap-3">
          {courses.map((c, i) => {
            const s = courseStatus(p, c);
            const exam = p.exams[c.id];
            const cert = p.certificates[c.id];
            const isOpen = open === c.id;
            return (
              <div key={c.id} data-reveal style={{ ['--d' as string]: i % 4 }} className={cx('rounded-2xl border bg-surface transition-[border-color,box-shadow] duration-300', isOpen ? 'border-accent/50 shadow-[var(--shadow-lift)]' : 'border-line shadow-[var(--shadow-card)]')}>
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : c.id)}
                  aria-expanded={isOpen}
                  className="group w-full grid grid-cols-[minmax(0,1fr)_auto] sm:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_120px_20px] gap-x-5 gap-y-2 items-center p-4 text-left"
                >
                  <span className="flex items-center gap-3 min-w-0">
                    <span className={cx('h-2.5 w-2.5 rounded-full shrink-0', tone[c.color].bg)} />
                    <span className="font-semibold truncate group-hover:text-accent">{c.title}</span>
                  </span>
                  <span className="text-[13.5px] text-right sm:order-3">
                    {s.certified ? (
                      <span className="text-ok font-semibold inline-flex items-center gap-1">
                        <IconAward size={15} /> Certified
                      </span>
                    ) : s.examPassed ? (
                      <span className="text-ok">Exam passed</span>
                    ) : exam?.attempts ? (
                      <span className="text-muted">Exam best {pct(exam.best)}</span>
                    ) : s.started ? (
                      <span className="text-muted">In progress</span>
                    ) : (
                      <span className="text-muted">Not started</span>
                    )}
                  </span>
                  <span className="col-span-2 sm:col-span-1 sm:order-2">
                    <span className="flex justify-between text-[12.5px] text-muted mb-1">
                      <span>
                        {s.done}/{s.total} lessons
                      </span>
                      <span>{pct(s.pct)}</span>
                    </span>
                    <ProgressBar value={s.pct} color={tone[c.color].stroke} className="h-1.5" />
                  </span>
                  <IconChevronRight size={18} className={cx('hidden sm:block order-4 text-muted transition-transform duration-300', isOpen && 'rotate-90 text-accent')} />
                </button>

                <div className={cx('grid transition-[grid-template-rows] duration-400 ease-out', isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]')}>
                  <div className="overflow-hidden">
                    <div className="px-4 pb-4">
                      <ol className="border-t border-line divide-y divide-line">
                        {c.lessons.map((l, j) => {
                          const ls = p.lessons[l.id];
                          const q = p.quizzes[l.id];
                          const done = !!ls?.completedAt;
                          const solved = l.exercises.filter((x) => p.code[x]?.passedAt).length;
                          return (
                            <li key={l.id} className="grid grid-cols-[28px_minmax(0,1fr)_auto] gap-3 py-2.5 items-center text-[14px]">
                              <span
                                className={cx(
                                  'h-6 w-6 rounded-full flex items-center justify-center text-[12px] font-bold border-2',
                                  done ? 'bg-ok border-ok text-white dark:text-[#0a0a12]' : ls?.visitedAt ? 'border-accent text-accent' : 'border-line-strong text-muted',
                                )}
                              >
                                {done ? <IconCheck size={13} strokeWidth={3} /> : j + 1}
                              </span>
                              <span className="min-w-0">
                                <span className="block truncate font-medium">{l.title}</span>
                                <span className="text-[12.5px] text-muted flex flex-wrap gap-x-3">
                                  {done ? <span>Completed {fmtDate(ls!.completedAt)}</span> : ls?.visitedAt ? <span>Opened {fmtDate(ls.visitedAt)}</span> : <span>Not opened</span>}
                                  {l.exercises.length > 0 && (
                                    <span className="inline-flex items-center gap-1">
                                      <IconCode size={12} /> {solved}/{l.exercises.length} exercises
                                    </span>
                                  )}
                                </span>
                              </span>
                              <span className="text-[13px] text-right tabular-nums">
                                {q?.attempts ? (
                                  <span className={done ? 'text-ok font-semibold' : 'text-warn font-semibold'}>
                                    {pct(q.best)}
                                    <span className="text-muted font-normal">
                                      {' '}
                                      · {q.attempts} {q.attempts === 1 ? 'try' : 'tries'}
                                    </span>
                                  </span>
                                ) : q && Object.keys(q.results).length ? (
                                  <span className="text-muted">
                                    {Object.keys(q.results).length}/{l.questions} answered
                                  </span>
                                ) : (
                                  <span className="text-muted">—</span>
                                )}
                              </span>
                            </li>
                          );
                        })}
                        <li className="grid grid-cols-[28px_minmax(0,1fr)_auto] gap-3 py-2.5 items-center text-[14px]">
                          <span className={cx('h-6 w-6 rounded-full flex items-center justify-center border-2', s.examPassed ? 'bg-ok border-ok text-white dark:text-[#0a0a12]' : 'border-line-strong text-muted')}>
                            <IconTarget size={13} />
                          </span>
                          <span>
                            <span className="block font-medium">Final exam</span>
                            <span className="text-[12.5px] text-muted">
                              {exam?.attempts
                                ? `${exam.attempts} ${exam.attempts === 1 ? 'attempt' : 'attempts'}${exam.passedAt ? `, passed ${fmtDate(exam.passedAt)}` : ''}${exam.last ? `, last ${pct(exam.last.score)} on ${fmtDate(exam.last.finishedAt)}` : ''}`
                                : exam?.current
                                  ? 'Exam in progress'
                                  : 'Not attempted'}
                            </span>
                          </span>
                          <span className={cx('text-[13px] font-semibold tabular-nums', s.examPassed ? 'text-ok' : 'text-muted')}>{exam?.attempts ? pct(exam.best) : '—'}</span>
                        </li>
                        {cert && (
                          <li className="py-2.5 text-[13.5px] text-ok font-medium flex items-center gap-2">
                            <IconAward size={16} /> Certificate issued {fmtDate(cert.issuedAt)}
                          </li>
                        )}
                      </ol>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        {p.certificates.program && (
          <p data-reveal className="mt-5 rounded-xl border border-warn/40 bg-warn-soft px-4 py-3 font-semibold flex items-center gap-2">
            <IconAward size={18} className="text-warn" /> Program certificate earned {fmtDate(p.certificates.program.issuedAt)}
          </p>
        )}
      </section>

      <Modal open={confirmDelete} onClose={() => setConfirmDelete(false)} title={`Delete ${u.name}?`}>
        <p className="text-muted">This permanently deletes the account and all of its saved progress. It cannot be undone.</p>
        <div className="mt-5 flex gap-2 justify-end">
          <button type="button" className={btn.ghost} onClick={() => setConfirmDelete(false)}>
            Cancel
          </button>
          <button type="button" className={btn.danger} disabled={busy} onClick={remove}>
            Delete account
          </button>
        </div>
      </Modal>
    </div>
  );
}

function BackLink() {
  return (
    <Link to="/admin" className="group inline-flex items-center gap-1.5 text-[14px] text-muted hover:text-ink">
      <IconArrowLeft size={16} className="transition-transform duration-300 group-hover:-translate-x-1" /> All learners
    </Link>
  );
}

function Mini({ value, label, icon, d }: { value: number; label: string; icon: ReactNode; d: number }) {
  return (
    <div data-reveal style={{ ['--d' as string]: d }} className="card-lift rounded-2xl border border-line bg-surface p-5">
      <div className="flex items-center gap-2 text-[26px] font-bold tabular-nums">
        {icon}
        <CountUp value={value} />
      </div>
      <div className="text-muted text-[14px] mt-0.5">{label}</div>
    </div>
  );
}
