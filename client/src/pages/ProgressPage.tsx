import { useRef, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Heatmap } from '../components/Heatmap';
import { IconAward, IconCloudCheck, IconDownload, IconFlame, IconLogIn, IconTrash, IconUpload } from '../components/icons';
import { CountUp } from '../components/motion';
import { Avatar } from '../components/UserMenu';
import { btn, cx, Modal, PageHeader, ProgressBar, Ring, tone, useTitle } from '../components/ui';
import { courses } from '../lib/catalog';
import { courseStatus, overall, pct } from '../lib/progress';
import { useAuth } from '../lib/auth';
import { dayKey, exportProgress, isProgressData, useProgress, type Theme } from '../lib/store';

export default function ProgressPage() {
  useTitle('My progress');
  const p = useProgress();
  const o = overall(p);
  const { user, sync, syncedAt } = useAuth();
  const [name, setName] = useState(p.name);
  const [confirmReset, setConfirmReset] = useState(false);
  const [msg, setMsg] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const doExport = () => {
    const blob = new Blob([JSON.stringify(exportProgress(), null, 1)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `ai-guide-progress-${dayKey()}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setMsg('Backup downloaded.');
  };
  const doImport = async (f: File) => {
    try {
      const data = JSON.parse(await f.text());
      if (!isProgressData(data)) throw new Error('This file is not an AI Guide progress backup.');
      useProgress.getState().importData(data);
      setName(data.name || '');
      setMsg('Progress restored from backup.');
    } catch (e) {
      setMsg((e as Error).message || 'Could not read that file.');
    }
  };

  return (
    <div className="mx-auto max-w-[1100px] px-4 sm:px-6">
      <PageHeader
        title="My progress"
        sub={user ? 'Everything is saved to your account as you learn, so you can pick up on any device.' : 'Everything is saved in this browser as you learn. Download a backup to move it to another device.'}
      />

      {user ? (
        <section data-reveal className="mb-6 rounded-2xl border border-line bg-surface/80 p-4 sm:p-5 flex flex-wrap items-center gap-4">
          <Avatar name={user.name} size={44} />
          <div className="min-w-0 flex-1">
            <p className="font-semibold truncate">{user.name}</p>
            <p className="text-[14px] text-muted truncate">{user.email}</p>
          </div>
          <span className="inline-flex items-center gap-2 text-[14px] font-medium">
            {sync === 'saving' ? (
              <span className="h-2 w-2 rounded-full bg-accent animate-dot" />
            ) : (
              <IconCloudCheck size={18} className={sync === 'saved' ? 'text-ok' : 'text-warn'} />
            )}
            {sync === 'saving'
              ? 'Saving…'
              : sync === 'saved'
                ? `Saved to your account${syncedAt ? ` at ${new Date(syncedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : ''}`
                : sync === 'offline'
                  ? 'Offline. Changes will save when you reconnect.'
                  : sync === 'error'
                    ? 'Could not save. Retrying shortly.'
                    : 'Waiting to sync'}
          </span>
        </section>
      ) : (
        <section data-reveal className="glow-border mb-6 rounded-2xl border border-accent/30 bg-accent-soft/60 p-4 sm:p-5 flex flex-wrap items-center gap-4">
          <div className="min-w-0 flex-1">
            <p className="font-semibold">Save your progress to an account</p>
            <p className="text-[14.5px] text-muted">Create a free account and everything you have done here is kept safe and follows you to any device.</p>
          </div>
          <Link to="/register" className={btn.primary}>
            <IconLogIn size={17} /> Create account
          </Link>
          <Link to="/login" className={btn.secondary}>
            Sign in
          </Link>
        </section>
      )}

      <section className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div data-reveal className="card-lift rounded-2xl border border-line bg-surface p-5 flex items-center gap-4">
          <Ring value={o.lessonsDone / o.lessonsTotal} size={64} stroke={7}>
            <span className="text-[13px] font-bold">{pct(o.lessonsDone / o.lessonsTotal)}</span>
          </Ring>
          <div>
            <div className="text-[22px] font-bold">
              <CountUp value={o.lessonsDone} />/{o.lessonsTotal}
            </div>
            <div className="text-muted text-[14px]">lessons complete</div>
          </div>
        </div>
        <Big d={1} value={o.answered} label={`questions answered, ${o.answered ? pct(o.accuracy) : '0%'} correct`} />
        <Big d={2} value={o.certified} label={`course certificates of ${courses.length}`} icon={<IconAward className="text-warn" />} />
        <Big d={3} value={o.streak} label={`day streak, ${o.codePassed} code exercises solved`} icon={<IconFlame className="text-c2 animate-float" />} />
      </section>

      <section data-reveal className="mt-10">
        <h2 className="text-[20px] font-bold mb-3">Activity</h2>
        <Heatmap activity={p.activity} />
      </section>

      <section className="mt-10">
        <h2 className="text-[20px] font-bold mb-3">Courses</h2>
        <div className="border-y border-line divide-y divide-line">
          {courses.map((c, i) => {
            const s = courseStatus(p, c);
            return (
              <div key={c.id} data-reveal style={{ ['--d' as string]: i % 4 }} className="grid grid-cols-[1fr_auto] sm:grid-cols-[1.4fr_1fr_150px] gap-x-6 gap-y-2 py-4 items-center">
                <Link to={`/course/${c.id}`} className="font-semibold hover:text-accent">
                  {c.title}
                </Link>
                <span className="sm:order-3 text-[14px] text-right">
                  {s.certified ? (
                    <Link to={`/certificate/${c.id}`} className="text-ok font-semibold inline-flex items-center gap-1">
                      <IconAward size={16} /> Certificate
                    </Link>
                  ) : s.lessonsComplete ? (
                    <Link to={`/course/${c.id}/exam`} className="text-accent font-semibold">
                      Exam open
                    </Link>
                  ) : (
                    <span className="text-muted">
                      {s.done}/{s.total} lessons
                    </span>
                  )}
                </span>
                <div className="col-span-2 sm:col-span-1">
                  <ProgressBar value={s.certified ? 1 : s.pct} color={tone[c.color].stroke} label={`${c.title} progress`} />
                </div>
              </div>
            );
          })}
        </div>
        <Link to="/certificate/program" className={cx(btn.secondary, 'mt-5')}>
          <IconAward size={18} /> Program certificate: {o.certified} of {courses.length} courses
        </Link>
      </section>

      <section className="mt-12 grid md:grid-cols-2 gap-6">
        <div data-reveal className="rounded-2xl border border-line bg-surface p-6 shadow-[var(--shadow-card)]">
          <h2 className="text-[18px] font-bold">Your details</h2>
          <form
            className="mt-4 flex flex-col gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              p.setName(name.trim());
              setMsg('Name saved.');
            }}
          >
            <label className="flex flex-col gap-1 text-[14px] font-semibold">
              Name for certificates
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={60}
                placeholder="Your full name"
                className="rounded-[10px] border border-line-strong bg-bg px-3 py-2.5 text-[16px] font-normal outline-none focus:border-accent"
              />
            </label>
            <fieldset>
              <legend className="text-[14px] font-semibold mb-1.5">Theme</legend>
              <div className="flex gap-2">
                {(['system', 'light', 'dark'] as Theme[]).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => p.setTheme(t)}
                    aria-pressed={p.theme === t}
                    className={cx('rounded-[10px] border px-3.5 py-2 text-[14.5px] capitalize', p.theme === t ? 'border-accent bg-accent-soft text-accent-ink font-semibold' : 'border-line')}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </fieldset>
            <button type="submit" className={cx(btn.primary, 'self-start')} disabled={name.trim() === p.name}>
              Save name
            </button>
          </form>
        </div>
        <div data-reveal style={{ ['--d' as string]: 1 }} className="rounded-2xl border border-line bg-surface p-6 shadow-[var(--shadow-card)]">
          <h2 className="text-[18px] font-bold">Backup and restore</h2>
          <p className="text-muted text-[15px] mt-2">
            {user
              ? 'Your progress is stored in your account. You can still download a copy as a file, or restore one into your account.'
              : 'Progress lives in this browser only. Clearing site data erases it, so download a backup now and then. Restore it here or on another device.'}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" className={btn.secondary} onClick={doExport}>
              <IconDownload size={17} /> Download backup
            </button>
            <button type="button" className={btn.secondary} onClick={() => fileRef.current?.click()}>
              <IconUpload size={17} /> Restore from file
            </button>
            <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={(e) => e.target.files?.[0] && doImport(e.target.files[0])} />
          </div>
          <button type="button" className="mt-6 inline-flex items-center gap-1.5 text-[14px] text-bad hover:underline" onClick={() => setConfirmReset(true)}>
            <IconTrash size={15} /> Erase all progress
          </button>
          {msg && (
            <p className="mt-3 text-[14px] font-medium" role="status">
              {msg}
            </p>
          )}
        </div>
      </section>

      <Modal open={confirmReset} onClose={() => setConfirmReset(false)} title="Erase all progress?">
        <p className="text-muted">
          This deletes every completed lesson, quiz answer, exam result and certificate {user ? 'in your account' : 'in this browser'}. It cannot be undone unless you have a backup.
        </p>
        <div className="mt-5 flex gap-2 justify-end">
          <button type="button" className={btn.ghost} onClick={() => setConfirmReset(false)}>
            Keep my progress
          </button>
          <button
            type="button"
            className={btn.danger}
            onClick={() => {
              p.reset();
              setName('');
              setConfirmReset(false);
              setMsg('All progress erased.');
            }}
          >
            Erase everything
          </button>
        </div>
      </Modal>
    </div>
  );
}

function Big({ value, label, icon, d = 0 }: { value: number; label: string; icon?: ReactNode; d?: number }) {
  return (
    <div data-reveal style={{ ['--d' as string]: d }} className="card-lift rounded-2xl border border-line bg-surface p-5">
      <div className="flex items-center gap-2 text-[26px] font-bold">
        {icon}
        <CountUp value={value} />
      </div>
      <div className="text-muted text-[14px] mt-0.5">{label}</div>
    </div>
  );
}
