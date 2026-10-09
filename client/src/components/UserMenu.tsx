import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { logout, useAuth } from '../lib/auth';
import { IconChart, IconCloudCheck, IconCloudOff, IconLogIn, IconLogOut, IconShield } from './icons';
import { cx } from './ui';

export const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join('') || '?';

export function Avatar({ name, size = 36, className }: { name: string; size?: number; className?: string }) {
  // Stable hue per name so each learner keeps the same colour everywhere.
  let h = 0;
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) % 360;
  return (
    <span
      className={cx('inline-flex items-center justify-center rounded-full font-bold text-white shrink-0 select-none', className)}
      style={{ width: size, height: size, fontSize: size * 0.38, background: `linear-gradient(135deg, hsl(${h} 70% 55%), hsl(${(h + 50) % 360} 70% 45%))` }}
      aria-hidden
    >
      {initials(name)}
    </span>
  );
}

export function SyncBadge() {
  const { user, sync } = useAuth();
  if (!user) return null;
  const label = { local: 'Not synced yet', saving: 'Saving…', saved: 'Progress saved to your account', offline: 'Offline: will save when you reconnect', error: 'Could not save, retrying' }[sync];
  return (
    <span className="hidden sm:inline-flex h-10 w-10 items-center justify-center rounded-[10px] text-muted" title={label} aria-label={label} role="status">
      {sync === 'saving' ? (
        <span className="relative flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full rounded-full bg-accent opacity-60 animate-ping" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-accent" />
        </span>
      ) : sync === 'offline' || sync === 'error' ? (
        <IconCloudOff size={19} className="text-warn" />
      ) : (
        <IconCloudCheck size={19} className={sync === 'saved' ? 'text-ok' : ''} />
      )}
    </span>
  );
}

export function UserMenu() {
  const user = useAuth((s) => s.user);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const nav = useNavigate();

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('mousedown', onDown);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('mousedown', onDown);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  if (!user)
    return (
      <Link to="/login" className="ml-1 h-10 inline-flex items-center gap-2 rounded-[10px] px-3.5 text-[14.5px] font-semibold btn-shine text-white dark:text-[#0d1120]">
        <IconLogIn size={17} />
        <span className="hidden sm:inline">Sign in</span>
      </Link>
    );

  const item = 'flex items-center gap-2.5 w-full rounded-lg px-3 py-2.5 text-[14.5px] hover:bg-sunk text-left transition-colors';
  return (
    <div ref={ref} className="relative ml-1">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="h-10 inline-flex items-center gap-2 rounded-full p-0.5 pr-0.5 ring-2 ring-transparent hover:ring-accent/40 transition"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Account menu for ${user.name}`}
      >
        <Avatar name={user.name} />
      </button>
      {open && (
        <div role="menu" className="absolute right-0 mt-2 w-64 rounded-2xl border border-line surface-glass p-2 shadow-2xl animate-pop origin-top-right z-[60]">
          <div className="flex items-center gap-3 px-3 py-2.5">
            <Avatar name={user.name} size={40} />
            <div className="min-w-0">
              <p className="font-semibold truncate">{user.name}</p>
              <p className="text-[13px] text-muted truncate">{user.email}</p>
            </div>
          </div>
          <div className="my-1 h-px bg-line" />
          <Link role="menuitem" to="/progress" className={item} onClick={() => setOpen(false)}>
            <IconChart size={17} className="text-muted" /> My progress
          </Link>
          {user.role === 'admin' && (
            <Link role="menuitem" to="/admin" className={item} onClick={() => setOpen(false)}>
              <IconShield size={17} className="text-accent" /> Admin panel
            </Link>
          )}
          <button
            role="menuitem"
            type="button"
            className={cx(item, 'text-bad')}
            onClick={async () => {
              setOpen(false);
              await logout();
              nav('/');
            }}
          >
            <IconLogOut size={17} /> Sign out
          </button>
        </div>
      )}
    </div>
  );
}
