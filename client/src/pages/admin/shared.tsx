import type { ReactNode } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { IconShield } from '../../components/icons';
import { useAuth, type User } from '../../lib/auth';
import type { ProgressData } from '../../lib/store';

export type AdminUser = User & { progressUpdatedAt: string | null; progress: ProgressData | null };

/** Server documents can be missing fields (or be null for users who never synced); fill them in. */
export const normalize = (p: ProgressData | null | undefined): ProgressData => ({
  version: 1,
  name: p?.name ?? '',
  theme: 'system',
  lessons: p?.lessons ?? {},
  quizzes: p?.quizzes ?? {},
  exams: p?.exams ?? {},
  code: p?.code ?? {},
  projects: p?.projects ?? {},
  certificates: p?.certificates ?? {},
  activity: p?.activity ?? {},
  last: p?.last,
});

export function ago(t: string | number | null | undefined) {
  if (!t) return 'never';
  const s = (Date.now() - new Date(t).getTime()) / 1000;
  if (s < 60) return 'just now';
  const units: [number, string][] = [
    [60, 'minute'],
    [3600, 'hour'],
    [86400, 'day'],
    [604800, 'week'],
    [2629800, 'month'],
    [31557600, 'year'],
  ];
  let i = 0;
  while (i < units.length - 1 && s >= units[i + 1][0]) i++;
  const n = Math.floor(s / units[i][0]);
  return `${n} ${units[i][1]}${n === 1 ? '' : 's'} ago`;
}

export const fmtDate = (t: string | number | null | undefined) =>
  t ? new Date(t).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

/** Shows children only to admins; sends guests to sign in. */
export function AdminGate({ children }: { children: ReactNode }) {
  const { user, ready } = useAuth();
  const loc = useLocation();
  if (!ready && !user)
    return (
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6 pt-16">
        <div className="h-10 w-1/3 rounded-lg skeleton" />
      </div>
    );
  if (!user) return <Navigate to="/login" replace state={{ from: loc.pathname }} />;
  if (user.role !== 'admin')
    return (
      <div className="mx-auto max-w-[640px] px-4 sm:px-6 pt-20 text-center animate-fade-up">
        <span className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-warn-soft text-warn">
          <IconShield size={30} />
        </span>
        <h1 className="mt-5 font-wide text-[34px] font-[780] tracking-tight">Admins only</h1>
        <p className="mt-2 text-muted text-lg">Your account does not have access to the admin panel.</p>
        <Link to="/" className="mt-6 inline-block text-accent font-semibold hover:underline">
          Back to the academy
        </Link>
      </div>
    );
  return <>{children}</>;
}

export function RoleBadge({ role }: { role: 'user' | 'admin' }) {
  return role === 'admin' ? (
    <span className="inline-flex items-center gap-1 rounded-full bg-accent-soft text-accent-ink px-2 py-0.5 text-[11.5px] font-bold uppercase tracking-wide">
      <IconShield size={12} /> Admin
    </span>
  ) : null;
}
