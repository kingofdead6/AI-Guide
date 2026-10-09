import { useState, type FormEvent, type ReactNode } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { IconCheck, IconClock, IconEye, IconEyeOff, IconKey, IconShield, IconTrash, IconUser } from '../components/icons';
import { btn, cx, Modal, PageHeader, useTitle } from '../components/ui';
import { Avatar } from '../components/UserMenu';
import { cancelDeletion, changePassword, requestDeletion, updateName, useAuth } from '../lib/auth';

const input =
  'w-full rounded-xl border border-line-strong bg-bg/60 px-3.5 py-2.75 text-[16px] font-normal outline-none transition-[border-color,box-shadow] focus:border-accent focus:shadow-[0_0_0_4px_var(--glow)]';
const fmt = (t: string) => new Date(t).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

function Card({ title, icon, sub, children, d = 0, danger }: { title: string; icon: ReactNode; sub?: string; children: ReactNode; d?: number; danger?: boolean }) {
  return (
    <section data-reveal style={{ ['--d' as string]: d }} className={cx('rounded-2xl border bg-surface p-6 shadow-[var(--shadow-card)]', danger ? 'border-bad/35' : 'border-line')}>
      <div className="flex items-start gap-3">
        <span className={cx('inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl', danger ? 'bg-bad-soft text-bad' : 'bg-accent-soft text-accent')}>{icon}</span>
        <div>
          <h2 className="text-[18px] font-bold leading-tight">{title}</h2>
          {sub && <p className="text-muted text-[14.5px] mt-0.5">{sub}</p>}
        </div>
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function Status({ msg }: { msg: { ok: boolean; text: string } | null }) {
  if (!msg) return null;
  return (
    <p role={msg.ok ? 'status' : 'alert'} className={cx('rounded-xl px-3.5 py-2.5 text-[14px] font-medium flex items-center gap-2', msg.ok ? 'bg-ok-soft text-ok animate-pop' : 'bg-bad-soft text-bad animate-shake')}>
      {msg.ok && <IconCheck size={16} strokeWidth={2.6} />}
      {msg.text}
    </p>
  );
}

export default function AccountPage() {
  useTitle('Account settings');
  const { user, ready } = useAuth();
  if (!user) return ready ? <Navigate to="/login" replace state={{ from: '/account' }} /> : null;
  return <Settings />;
}

function Settings() {
  const user = useAuth((s) => s.user)!;
  const isAdmin = user.role === 'admin';

  const [name, setName] = useState(user.name);
  const [nameMsg, setNameMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const [cur, setCur] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [pwMsg, setPwMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const [reason, setReason] = useState('');
  const [askDelete, setAskDelete] = useState(false);
  const [delMsg, setDelMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState('');

  const run = async (key: string, fn: () => Promise<void>, set: (m: { ok: boolean; text: string } | null) => void, ok: string) => {
    set(null);
    setBusy(key);
    try {
      await fn();
      set({ ok: true, text: ok });
    } catch (e) {
      set({ ok: false, text: (e as Error).message });
    } finally {
      setBusy('');
    }
  };

  const saveName = (e: FormEvent) => {
    e.preventDefault();
    void run('name', async () => void (await updateName(name.trim())), setNameMsg, 'Name updated.');
  };
  const savePassword = (e: FormEvent) => {
    e.preventDefault();
    if (next !== confirm) return setPwMsg({ ok: false, text: 'The new passwords do not match.' });
    void run(
      'pw',
      async () => {
        await changePassword(cur, next);
        setCur('');
        setNext('');
        setConfirm('');
      },
      setPwMsg,
      'Password changed. You have been signed out on your other devices.',
    );
  };

  const pendingSince = user.deletionRequestedAt;

  return (
    <div className="mx-auto max-w-[860px] px-4 sm:px-6">
      <PageHeader title="Account settings" sub="Manage your profile, password and account." />

      <div data-reveal className="mb-6 rounded-2xl border border-line bg-surface/80 p-5 flex flex-wrap items-center gap-4">
        <Avatar name={user.name} size={56} />
        <div className="min-w-0 flex-1">
          <p className="text-[19px] font-bold truncate flex items-center gap-2">
            {user.name}
            {isAdmin && (
              <span className="inline-flex items-center gap-1 rounded-full bg-accent-soft text-accent-ink px-2 py-0.5 text-[11.5px] font-bold uppercase tracking-wide">
                <IconShield size={12} /> Admin
              </span>
            )}
          </p>
          <p className="text-muted truncate">{user.email}</p>
        </div>
        <p className="text-[14px] text-muted">Member since {fmt(user.createdAt)}</p>
      </div>

      <div className="flex flex-col gap-6">
        <Card title="Profile" sub="Your name as it appears in the academy." icon={<IconUser size={19} />}>
          <form onSubmit={saveName} className="flex flex-col gap-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <label className="flex flex-col gap-1.5 text-[14px] font-semibold">
                Name
                <input className={input} value={name} onChange={(e) => setName(e.target.value)} maxLength={80} autoComplete="name" />
              </label>
              <label className="flex flex-col gap-1.5 text-[14px] font-semibold">
                Email
                <input className={cx(input, 'text-muted cursor-not-allowed')} value={user.email} readOnly aria-readonly />
              </label>
            </div>
            {!isAdmin && <p className="text-[13.5px] text-muted -mt-1">The name printed on certificates is set separately on the My progress page.</p>}
            <Status msg={nameMsg} />
            <button type="submit" className={cx(btn.primary, 'self-start')} disabled={busy === 'name' || name.trim().length < 2 || name.trim() === user.name}>
              Save name
            </button>
          </form>
        </Card>

        <Card d={1} title="Change password" sub="Changing it signs you out everywhere else." icon={<IconKey size={19} />}>
          <form onSubmit={savePassword} className="flex flex-col gap-4">
            <label className="flex flex-col gap-1.5 text-[14px] font-semibold">
              Current password
              <input className={input} type={show ? 'text' : 'password'} value={cur} onChange={(e) => setCur(e.target.value)} autoComplete="current-password" required />
            </label>
            <div className="grid sm:grid-cols-2 gap-4">
              <label className="flex flex-col gap-1.5 text-[14px] font-semibold">
                New password
                <input className={input} type={show ? 'text' : 'password'} value={next} onChange={(e) => setNext(e.target.value)} autoComplete="new-password" placeholder="At least 8 characters" required />
              </label>
              <label className="flex flex-col gap-1.5 text-[14px] font-semibold">
                Confirm new password
                <input
                  className={cx(input, confirm && confirm !== next && 'border-bad focus:border-bad')}
                  type={show ? 'text' : 'password'}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  autoComplete="new-password"
                  required
                />
              </label>
            </div>
            <button type="button" onClick={() => setShow((v) => !v)} className="self-start inline-flex items-center gap-1.5 text-[14px] text-muted hover:text-ink">
              {show ? <IconEyeOff size={16} /> : <IconEye size={16} />} {show ? 'Hide passwords' : 'Show passwords'}
            </button>
            <Status msg={pwMsg} />
            <button type="submit" className={cx(btn.primary, 'self-start')} disabled={busy === 'pw' || !cur || next.length < 8 || !confirm}>
              {busy === 'pw' ? 'Changing…' : 'Change password'}
            </button>
          </form>
        </Card>

        {!isAdmin && (
          <Card d={2} danger title="Delete my account" sub="Ask an administrator to permanently delete your account and all saved progress." icon={<IconTrash size={19} />}>
            {pendingSince ? (
              <div className="flex flex-col gap-4">
                <div className="rounded-xl border border-warn/40 bg-warn-soft px-4 py-3 flex gap-3">
                  <IconClock size={20} className="text-warn shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">Deletion requested on {fmt(pendingSince)}</p>
                    <p className="text-[14px] text-muted mt-0.5">An administrator will review it and delete your account. Until then you can keep learning, or change your mind.</p>
                  </div>
                </div>
                <Status msg={delMsg} />
                <button
                  type="button"
                  className={cx(btn.secondary, 'self-start')}
                  disabled={busy === 'del'}
                  onClick={() => void run('del', cancelDeletion, setDelMsg, 'Request cancelled. Your account will be kept.')}
                >
                  Cancel the request
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <p className="text-[14.5px] text-muted">
                  Deleting removes your name, email and every lesson, quiz, exam and certificate saved to your account. It cannot be undone. Download a backup from{' '}
                  <Link to="/progress" className="text-accent hover:underline">
                    My progress
                  </Link>{' '}
                  first if you want to keep a copy. See the{' '}
                  <Link to="/privacy" className="text-accent hover:underline">
                    privacy policy
                  </Link>{' '}
                  for details.
                </p>
                <label className="flex flex-col gap-1.5 text-[14px] font-semibold">
                  Reason (optional)
                  <textarea className={cx(input, 'min-h-[88px] resize-y')} value={reason} onChange={(e) => setReason(e.target.value)} maxLength={1000} placeholder="Anything you would like us to know" />
                </label>
                <Status msg={delMsg} />
                <button type="button" className={cx(btn.danger, 'self-start')} onClick={() => setAskDelete(true)}>
                  <IconTrash size={17} /> Request account deletion
                </button>
              </div>
            )}
          </Card>
        )}
      </div>

      <Modal open={askDelete} onClose={() => setAskDelete(false)} title="Request account deletion?">
        <p className="text-muted">An administrator will permanently delete your account and all of its progress. You can cancel the request until then.</p>
        <div className="mt-5 flex gap-2 justify-end">
          <button type="button" className={btn.ghost} onClick={() => setAskDelete(false)}>
            Keep my account
          </button>
          <button
            type="button"
            className={btn.danger}
            disabled={busy === 'del'}
            onClick={() => {
              setAskDelete(false);
              void run('del', () => requestDeletion(reason), setDelMsg, 'Request sent. An administrator will review it.');
            }}
          >
            Send request
          </button>
        </div>
      </Modal>
    </div>
  );
}
