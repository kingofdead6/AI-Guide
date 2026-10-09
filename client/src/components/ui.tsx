import { useEffect, useRef, type ReactNode } from 'react';
import { useMounted } from './motion';
import { Link } from 'react-router-dom';
import type { Course } from '../lib/types';

export const cx = (...xs: (string | false | null | undefined)[]) => xs.filter(Boolean).join(' ');

/** Literal class names per course colour so Tailwind can see them. */
export const tone: Record<Course['color'], { text: string; bg: string; soft: string; border: string; stroke: string }> = {
  c1: { text: 'text-c1', bg: 'bg-c1', soft: 'bg-c1s', border: 'border-c1', stroke: 'var(--c1)' },
  c2: { text: 'text-c2', bg: 'bg-c2', soft: 'bg-c2s', border: 'border-c2', stroke: 'var(--c2)' },
  c3: { text: 'text-c3', bg: 'bg-c3', soft: 'bg-c3s', border: 'border-c3', stroke: 'var(--c3)' },
  c4: { text: 'text-c4', bg: 'bg-c4', soft: 'bg-c4s', border: 'border-c4', stroke: 'var(--c4)' },
  c5: { text: 'text-c5', bg: 'bg-c5', soft: 'bg-c5s', border: 'border-c5', stroke: 'var(--c5)' },
};

const btnBase =
  'inline-flex items-center justify-center gap-2 rounded-[10px] font-semibold text-[15px] px-4 py-2.5 disabled:opacity-45 disabled:cursor-not-allowed select-none';
export const btn = {
  primary: `${btnBase} btn-shine bg-accent text-white dark:text-[#0a0a12]`,
  secondary: `${btnBase} btn-press bg-surface text-ink border border-line-strong hover:border-accent hover:text-accent`,
  ghost: `${btnBase} btn-press text-ink hover:bg-sunk`,
  ok: `${btnBase} btn-press bg-ok text-white dark:text-[#0a0a12]`,
  danger: `${btnBase} btn-press bg-bad text-white dark:text-[#0a0a12] hover:opacity-90`,
};

export function ButtonLink({ to, kind = 'primary', children, className }: { to: string; kind?: keyof typeof btn; children: ReactNode; className?: string }) {
  return (
    <Link to={to} className={cx(btn[kind], className)}>
      {children}
    </Link>
  );
}

export function ProgressBar({ value, color = 'var(--accent)', className, label }: { value: number; color?: string; className?: string; label?: string }) {
  const mounted = useMounted();
  const v = Math.max(0, Math.min(1, value));
  return (
    <div
      className={cx('h-2 rounded-full bg-sunk overflow-hidden', className)}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(v * 100)}
      aria-label={label}
    >
      <div
        className={cx('h-full rounded-full transition-[width] duration-[900ms] ease-[cubic-bezier(0.2,0.7,0.2,1)]', v > 0 && 'bar-fill')}
        style={{ width: `${mounted ? v * 100 : 0}%`, background: color }}
      />
    </div>
  );
}

export function Ring({ value, size = 56, stroke = 6, color = 'var(--accent)', children }: { value: number; size?: number; stroke?: number; color?: string; children?: ReactNode }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const mounted = useMounted();
  const v = mounted ? Math.max(0, Math.min(1, value)) : 0;
  return (
    <div className="relative inline-flex items-center justify-center shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--sunk)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - v)}
          style={{ transition: 'stroke-dashoffset 1.1s cubic-bezier(0.2, 0.7, 0.2, 1)' }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">{children}</div>
    </div>
  );
}

export function Chip({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cx('inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[13px] font-medium', className)}>{children}</span>;
}

export function Rich({ html, className, as: Tag = 'div' }: { html: string; className?: string; as?: 'div' | 'span' | 'p' }) {
  return <Tag className={cx('rich', className)} dangerouslySetInnerHTML={{ __html: html }} />;
}

export function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    ref.current?.querySelector<HTMLElement>('button, input, a')?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      prev?.focus();
    };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-[page-in_.2s_ease-out]" onClick={onClose}>
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="animate-pop w-full max-w-md rounded-2xl bg-surface border border-line p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-bold mb-2">{title}</h2>
        {children}
      </div>
    </div>
  );
}

export function PageHeader({ title, sub, children }: { title: ReactNode; sub?: ReactNode; children?: ReactNode }) {
  return (
    <header className="pt-8 sm:pt-12 pb-6">
      <h1 className="animate-fade-up font-wide text-[34px] sm:text-[46px] leading-[1.05] font-[750] tracking-[-0.02em] text-balance">{title}</h1>
      <span aria-hidden className="animate-fade-up mt-4 block h-1 w-16 rounded-full" style={{ background: 'var(--grad)', ['--d' as string]: 1 }} />
      {sub && (
        <p className="animate-fade-up mt-4 text-muted text-lg max-w-2xl text-pretty" style={{ ['--d' as string]: 2 }}>
          {sub}
        </p>
      )}
      {children}
    </header>
  );
}

export function useTitle(title: string) {
  useEffect(() => {
    document.title = title ? `${title} | The AI Guide Academy` : 'The AI Guide Academy';
  }, [title]);
}
