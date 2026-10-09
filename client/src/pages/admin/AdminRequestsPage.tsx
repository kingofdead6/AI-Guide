import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { IconCheck, IconClock, IconTrash } from '../../components/icons';
import { btn, cx, Modal, PageHeader, ProgressBar, useTitle } from '../../components/ui';
import { Avatar } from '../../components/UserMenu';
import { api } from '../../lib/api';
import { overall, pct } from '../../lib/progress';
import { AdminGate, ago, fmtDate, normalize, type AdminUser } from './shared';

export default function AdminRequestsPage() {
  useTitle('Deletion requests');
  return (
    <AdminGate>
      <Requests />
    </AdminGate>
  );
}

function Requests() {
  const [list, setList] = useState<AdminUser[] | null>(null);
  const [err, setErr] = useState('');
  const [target, setTarget] = useState<AdminUser | null>(null);
  const [busy, setBusy] = useState('');
  const [done, setDone] = useState('');

  useEffect(() => {
    api<{ requests: AdminUser[] }>('/admin/deletion-requests')
      .then((r) => setList(r.requests))
      .catch((e: Error) => setErr(e.message));
  }, []);

  const act = async (u: AdminUser, kind: 'delete' | 'keep') => {
    setBusy(u.id);
    setErr('');
    try {
      await api(kind === 'delete' ? `/admin/users/${u.id}` : `/admin/deletion-requests/${u.id}`, { method: 'DELETE' });
      setList((l) => l?.filter((x) => x.id !== u.id) ?? null);
      setDone(kind === 'delete' ? `${u.name}'s account was deleted.` : `${u.name}'s request was dismissed; the account is kept.`);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy('');
      setTarget(null);
    }
  };

  return (
    <div className="mx-auto max-w-[960px] px-4 sm:px-6">
      <PageHeader title="Deletion requests" sub="Learners who asked for their account to be deleted. Delete the account, or keep it and clear the request." />

      {err && <p className="mb-5 rounded-xl border border-bad/40 bg-bad-soft px-4 py-3 text-bad font-medium animate-shake">{err}</p>}
      {done && (
        <p role="status" className="mb-5 rounded-xl bg-ok-soft px-4 py-3 text-ok font-medium flex items-center gap-2 animate-pop">
          <IconCheck size={17} strokeWidth={2.6} /> {done}
        </p>
      )}

      {!list && !err && (
        <div className="flex flex-col gap-4">
          {[0, 1].map((i) => (
            <div key={i} className="h-36 rounded-2xl skeleton" />
          ))}
        </div>
      )}

      {list && list.length === 0 && (
        <div data-reveal className="rounded-2xl border border-dashed border-line-strong bg-surface/60 p-12 text-center">
          <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-ok-soft text-ok animate-float">
            <IconCheck size={26} strokeWidth={2.6} />
          </span>
          <p className="mt-4 text-[19px] font-bold">No pending requests</p>
          <p className="text-muted mt-1">When a learner asks to delete their account, it shows up here.</p>
        </div>
      )}

      <ul className="flex flex-col gap-4">
        {list?.map((u, i) => {
          const o = overall(normalize(u.progress));
          return (
            <li key={u.id} data-reveal style={{ ['--d' as string]: i }} className="rounded-2xl border border-line bg-surface p-5 sm:p-6 shadow-[var(--shadow-card)]">
              <div className="flex flex-wrap items-start gap-4">
                <Avatar name={u.name} size={46} />
                <div className="min-w-0 flex-1">
                  <Link to={`/admin/users/${u.id}`} className="font-bold text-[17px] hover:text-accent">
                    {u.name}
                  </Link>
                  <p className="text-muted text-[14px] truncate">{u.email}</p>
                  <p className="mt-1 text-[13.5px] text-warn font-medium inline-flex items-center gap-1.5">
                    <IconClock size={15} /> Requested {ago(u.deletionRequestedAt)} ({fmtDate(u.deletionRequestedAt)})
                  </p>
                </div>
                <div className="w-full sm:w-52">
                  <div className="flex justify-between text-[12.5px] text-muted mb-1">
                    <span>
                      {o.lessonsDone}/{o.lessonsTotal} lessons
                    </span>
                    <span>{o.certified} certificates</span>
                  </div>
                  <ProgressBar value={o.lessonsDone / o.lessonsTotal} className="h-1.5" />
                  <p className="mt-1 text-[12.5px] text-muted">
                    Joined {fmtDate(u.createdAt)}, {o.answered ? `${pct(o.accuracy)} accuracy` : 'no answers yet'}
                  </p>
                </div>
              </div>
              <blockquote className={cx('mt-4 rounded-xl px-4 py-3 text-[15px] border-l-4', u.deletionReason ? 'bg-sunk/70 border-accent' : 'bg-sunk/40 border-line-strong text-muted italic')}>
                {u.deletionReason || 'No reason given.'}
              </blockquote>
              <div className="mt-4 flex flex-wrap gap-2 justify-end">
                <button type="button" className={btn.secondary} disabled={busy === u.id} onClick={() => act(u, 'keep')}>
                  Keep account
                </button>
                <button type="button" className={btn.danger} disabled={busy === u.id} onClick={() => setTarget(u)}>
                  <IconTrash size={16} /> Delete account
                </button>
              </div>
            </li>
          );
        })}
      </ul>

      <Modal open={!!target} onClose={() => setTarget(null)} title={`Delete ${target?.name ?? ''}?`}>
        <p className="text-muted">This permanently deletes the account and all of its saved progress. It cannot be undone.</p>
        <div className="mt-5 flex gap-2 justify-end">
          <button type="button" className={btn.ghost} onClick={() => setTarget(null)}>
            Cancel
          </button>
          <button type="button" className={btn.danger} disabled={!!busy} onClick={() => target && act(target, 'delete')}>
            Delete permanently
          </button>
        </div>
      </Modal>
    </div>
  );
}
