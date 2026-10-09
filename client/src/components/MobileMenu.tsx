import { useEffect, type ComponentType } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { logout, useAuth } from '../lib/auth';
import { ANDROID_APP } from '../lib/site';
import { useProgress, type Theme } from '../lib/store';
import {
  IconAndroid,
  IconBook,
  IconChart,
  IconChevronRight,
  IconCloudCheck,
  IconCloudOff,
  IconCode,
  IconDownload,
  IconKey,
  IconList,
  IconLogIn,
  IconLogOut,
  IconMoon,
  IconPalette,
  IconSettings,
  IconSpark,
  IconSun,
  IconTarget,
  IconTrash,
  IconUsers,
} from './icons';
import { btn, cx } from './ui';
import { Avatar } from './UserMenu';

export type MenuItem = { to: string; label: string; badge: number; active: boolean };

const ICONS: Record<string, ComponentType<{ size?: number; className?: string }>> = {
  '/courses': IconBook,
  '/projects': IconTarget,
  '/playground': IconSpark,
  '/glossary': IconList,
  '/progress': IconChart,
  '/admin': IconUsers,
  '/admin/requests': IconTrash,
  '/account': IconKey,
  '/settings': IconSettings,
};

/** Full-height navigation sheet for phones and tablets (hidden from the lg breakpoint up). */
export function MobileMenu({ open, onClose, items }: { open: boolean; onClose: () => void; items: MenuItem[] }) {
  const { user, sync } = useAuth();
  const theme = useProgress((s) => s.theme);
  const setTheme = useProgress((s) => s.setTheme);
  const nav = useNavigate();
  const isAdmin = user?.role === 'admin';

  // Lock page scroll and close on Escape while the sheet is open.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  const row = 'flex items-center gap-3.5 rounded-2xl px-3.5 py-3.5 text-[16.5px] font-semibold transition-colors active:scale-[0.99]';

  return (
    <div className="lg:hidden fixed inset-x-0 top-16 bottom-0 z-40" role="dialog" aria-modal="true" aria-label="Menu">
      <button type="button" aria-label="Close menu" className="absolute inset-0 bg-black/30 backdrop-blur-sm animate-[page-in_.2s_ease-out]" onClick={onClose} />
      <div className="relative max-h-full overflow-y-auto overscroll-contain border-t border-line bg-bg shadow-2xl animate-[page-in_.28s_cubic-bezier(.2,.7,.2,1)]">
        <div className="mx-auto max-w-[640px] px-4 pt-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] flex flex-col gap-4">
          {/* Account */}
          {user ? (
            <Link to="/account" className="flex items-center gap-3.5 rounded-2xl border border-line bg-surface p-3.5" onClick={onClose}>
              <Avatar name={user.name} size={46} />
              <span className="min-w-0 flex-1">
                <span className="block font-bold truncate">{user.name}</span>
                <span className="block text-[13.5px] text-muted truncate">{user.email}</span>
                {!isAdmin && (
                  <span className={cx('mt-0.5 inline-flex items-center gap-1 text-[12.5px] font-semibold', sync === 'offline' || sync === 'error' ? 'text-warn' : 'text-ok')}>
                    {sync === 'offline' || sync === 'error' ? <IconCloudOff size={14} /> : <IconCloudCheck size={14} />}
                    {sync === 'saving' ? 'Saving…' : sync === 'offline' ? 'Offline, will save later' : sync === 'error' ? 'Could not save, retrying' : 'Progress saved'}
                  </span>
                )}
              </span>
              <IconChevronRight className="text-muted" />
            </Link>
          ) : (
            <div className="rounded-2xl border border-line bg-surface p-4">
              <p className="font-bold">Save your progress</p>
              <p className="text-[14px] text-muted mt-0.5">Create a free account to keep your progress and use it on any device.</p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <Link to="/register" className={cx(btn.primary, 'px-3')} onClick={onClose}>
                  Create account
                </Link>
                <Link to="/login" className={cx(btn.secondary, 'px-3')} onClick={onClose}>
                  <IconLogIn size={16} /> Sign in
                </Link>
              </div>
            </div>
          )}

          {/* Navigation */}
          <nav aria-label="Main" className="flex flex-col gap-1">
            {items.map((n, i) => {
              const Icon = ICONS[n.to] ?? IconCode;
              return (
                <NavLink
                  key={n.to}
                  to={n.to}
                  end={n.to === '/admin'}
                  onClick={onClose}
                  style={{ ['--d' as string]: i }}
                  className={cx('animate-fade-up', row, n.active ? 'bg-accent-soft text-accent-ink' : 'hover:bg-sunk')}
                >
                  <span className={cx('inline-flex h-9 w-9 items-center justify-center rounded-xl', n.active ? 'bg-accent text-white dark:text-[#0a0a12]' : 'bg-sunk text-accent')}>
                    <Icon size={18} />
                  </span>
                  <span className="flex-1">{n.label}</span>
                  {n.badge > 0 && <span className="h-6 min-w-6 px-2 rounded-full bg-bad text-white text-[12px] font-bold inline-flex items-center justify-center">{n.badge}</span>}
                  <IconChevronRight size={18} className="text-muted" />
                </NavLink>
              );
            })}
          </nav>

          {/* Appearance */}
          <div className="rounded-2xl border border-line bg-surface p-3.5">
            <p className="text-[13px] font-semibold uppercase tracking-wide text-muted mb-2.5">Appearance</p>
            <div className="grid grid-cols-3 gap-1 rounded-xl bg-sunk p-1" role="radiogroup" aria-label="Theme">
              {(
                [
                  ['light', 'Light', IconSun],
                  ['dark', 'Dark', IconMoon],
                  ['system', 'System', IconSettings],
                ] as [Theme, string, typeof IconSun][]
              ).map(([id, label, Icon]) => (
                <button
                  key={id}
                  type="button"
                  role="radio"
                  aria-checked={theme === id}
                  onClick={() => setTheme(id)}
                  className={cx(
                    'inline-flex items-center justify-center gap-1.5 rounded-lg py-2.5 text-[14px] font-semibold transition-all',
                    theme === id ? 'bg-surface text-ink shadow-sm' : 'text-muted',
                  )}
                >
                  <Icon size={16} /> {label}
                </button>
              ))}
            </div>
            <Link to="/settings" onClick={onClose} className="mt-2 flex items-center gap-2.5 rounded-xl px-1 py-2.5 text-[15px] font-semibold text-accent">
              <IconPalette size={18} /> Themes, fonts and reading size
              <IconChevronRight size={16} className="ml-auto text-muted" />
            </Link>
          </div>

          {/* Android app */}
          {!isAdmin && (
            <a href={ANDROID_APP.url} download rel="noopener" className="relative overflow-hidden flex items-center gap-3.5 rounded-2xl border border-line bg-surface p-3.5">
              <span aria-hidden className="absolute -right-10 -top-10 h-28 w-28 rounded-full opacity-25 blur-2xl" style={{ background: 'var(--grad)' }} />
              <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white" style={{ background: 'var(--grad)' }}>
                <IconAndroid size={22} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-bold">Get the Android app</span>
                <span className="block text-[13px] text-muted">
                  {ANDROID_APP.size} · {ANDROID_APP.minAndroid}
                </span>
              </span>
              <IconDownload className="text-accent" />
            </a>
          )}

          {user && (
            <button
              type="button"
              className={cx(row, 'text-bad hover:bg-bad-soft justify-center border border-line')}
              onClick={async () => {
                onClose();
                await logout();
                nav('/');
              }}
            >
              <IconLogOut size={18} /> Sign out
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
