import { useEffect, useState, type ReactNode } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { api } from '../lib/api';
import { applyAppearance, useAppearance } from '../lib/appearance';
import { ANDROID_APP } from '../lib/site';
import { useAuth } from '../lib/auth';
import { useProgress, type Theme } from '../lib/store';
import { IconMenu, IconMoon, IconSearch, IconSettings, IconShield, IconSun, IconX } from './icons';
import { useRevealObserver } from './motion';
import { openSearch, SearchPalette } from './SearchPalette';
import { cx } from './ui';
import { SyncBadge, UserMenu } from './UserMenu';

const ADMIN_NAV = [
  { to: '/admin', label: 'Learners', match: (p: string) => p === '/admin' || p.startsWith('/admin/users') },
  { to: '/admin/requests', label: 'Deletion requests', match: (p: string) => p === '/admin/requests' },
  { to: '/account', label: 'Account', match: (p: string) => p === '/account' },
  { to: '/settings', label: 'Settings', match: (p: string) => p === '/settings' },
];

const NAV = [
  { to: '/courses', label: 'Courses' },
  { to: '/projects', label: 'Projects' },
  { to: '/playground', label: 'Playground' },
  { to: '/glossary', label: 'Glossary' },
  { to: '/progress', label: 'My progress' },
];

export function Logo({ className }: { className?: string }) {
  return (
    <Link to="/" className={cx('flex items-center gap-2.5 shrink-0', className)} aria-label="The AI Guide Academy, home">
      <svg width="30" height="30" viewBox="0 0 32 32" aria-hidden className="transition-transform duration-500 hover:rotate-[-8deg] hover:scale-110">
        <rect width="32" height="32" rx="8" fill="var(--accent)" />
        <circle cx="10" cy="11" r="3" fill="var(--surface)" />
        <circle cx="10" cy="21" r="3" fill="var(--surface)" />
        <circle cx="22" cy="16" r="3.6" fill="#f5a84a" />
        <path d="M12.6 12.2 19 15M12.6 19.8 19 17" stroke="var(--surface)" strokeWidth="1.6" />
      </svg>
      <span className="font-wide font-[750] text-[17px] tracking-tight leading-none">
        The AI Guide<span className="hidden sm:inline font-normal text-muted"> Academy</span>
      </span>
    </Link>
  );
}

function useApplyTheme() {
  const theme = useProgress((s) => s.theme);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = () => {
      const dark = theme === 'dark' || (theme === 'system' && mq.matches);
      document.documentElement.classList.toggle('dark', dark);
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#0a0a12' : '#f6f6fa');
      window.dispatchEvent(new Event('themechange'));
    };
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, [theme]);
}

function useApplyAppearance() {
  const a = useAppearance();
  const { palette, uiFont, readingFont, codeFont, readingScale, motion, glow } = a;
  useEffect(() => {
    applyAppearance({ palette, uiFont, readingFont, codeFont, readingScale, motion, glow });
  }, [palette, uiFont, readingFont, codeFont, readingScale, motion, glow]);
}

function ThemeToggle() {
  const theme = useProgress((s) => s.theme);
  const setTheme = useProgress((s) => s.setTheme);
  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  const next: Theme = isDark ? 'light' : 'dark';
  return (
    <button
      type="button"
      onClick={() => setTheme(next)}
      className="h-10 w-10 inline-flex items-center justify-center rounded-[10px] hover:bg-sunk transition-colors"
      aria-label={`Switch to ${next} theme`}
      title={theme === 'system' ? 'Following your system theme' : undefined}
    >
      <span key={String(isDark)} className="animate-spin-in inline-flex">
        {isDark ? <IconSun /> : <IconMoon />}
      </span>
    </button>
  );
}

function useScrolled(px = 8) {
  const [s, setS] = useState(false);
  useEffect(() => {
    const on = () => setS(window.scrollY > px);
    on();
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, [px]);
  return s;
}

export function Layout({ children }: { children: ReactNode }) {
  useApplyTheme();
  useApplyAppearance();
  useRevealObserver();
  const [menu, setMenu] = useState(false);
  const loc = useLocation();
  const scrolled = useScrolled();
  const isAdmin = useAuth((s) => s.user?.role === 'admin');
  const signedIn = useAuth((s) => !!s.user);
  const pending = usePendingDeletions(isAdmin, loc.pathname);
  const nav = isAdmin
    ? ADMIN_NAV.map((n) => ({ ...n, badge: n.to === '/admin/requests' ? pending : 0 }))
    : NAV.map((n) => ({ ...n, match: undefined as ((p: string) => boolean) | undefined, badge: 0 }));
  const linkClass = (n: (typeof nav)[number], isActive: boolean) => (n.match ? n.match(loc.pathname) : isActive);
  useEffect(() => setMenu(false), [loc.pathname]);
  useEffect(() => {
    if (!loc.hash || loc.hash.length < 2) window.scrollTo(0, 0);
  }, [loc.pathname, loc.hash]);

  return (
    <div className="min-h-dvh flex flex-col">
      <div className="aurora" aria-hidden>
        <span />
        <span />
        <span />
      </div>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] bg-surface px-3 py-2 rounded-lg">
        Skip to content
      </a>
      <header
        className={cx(
          'sticky top-0 z-50 border-b transition-[background-color,box-shadow,border-color] duration-300',
          scrolled ? 'bg-bg/80 backdrop-blur-xl border-line shadow-[0_8px_30px_-18px_rgb(0_0_0/0.35)]' : 'bg-bg/40 backdrop-blur-md border-transparent',
        )}
      >
        <div className="mx-auto max-w-[1280px] h-16 px-4 sm:px-6 flex items-center gap-3">
          <Logo />
          {isAdmin && (
            <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-accent-soft text-accent-ink px-2.5 py-1 text-[12px] font-bold uppercase tracking-wide">
              <IconShield size={13} /> Admin
            </span>
          )}
          <nav className="hidden lg:flex items-center gap-1 ml-6" aria-label="Main">
            {nav.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                end={n.to === '/admin'}
                className={({ isActive }) =>
                  cx(
                    'nav-link px-3 py-2 rounded-[10px] text-[15px] font-medium transition-colors hover:text-ink inline-flex items-center gap-1.5',
                    linkClass(n, isActive) ? 'active text-accent' : 'text-ink/75',
                  )
                }
              >
                {n.label}
                {n.badge > 0 && <span className="min-w-5 h-5 px-1.5 rounded-full bg-bad text-white text-[11.5px] font-bold inline-flex items-center justify-center animate-pop">{n.badge}</span>}
              </NavLink>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-1">
            {!isAdmin && (
            <button
              type="button"
              onClick={openSearch}
              className="h-10 inline-flex items-center gap-2 rounded-[10px] border border-line bg-surface/70 px-3 text-muted hover:border-accent hover:text-ink transition-colors"
              aria-label="Search (Ctrl+K)"
            >
              <IconSearch size={17} />
              <span className="hidden md:inline text-[14px]">Search</span>
              <kbd className="hidden md:inline text-[11.5px] border border-line rounded px-1">Ctrl K</kbd>
            </button>
            )}
            <SyncBadge />
            <ThemeToggle />
            <Link
              to="/settings"
              className="group h-10 w-10 inline-flex items-center justify-center rounded-[10px] hover:bg-sunk transition-colors"
              aria-label="Appearance settings"
              title="Appearance settings"
            >
              <IconSettings className="transition-transform duration-500 group-hover:rotate-90" />
            </Link>
            <button
              type="button"
              className="lg:hidden h-10 w-10 inline-flex items-center justify-center rounded-[10px] hover:bg-sunk"
              aria-label={menu ? 'Close menu' : 'Open menu'}
              aria-expanded={menu}
              onClick={() => setMenu((m) => !m)}
            >
              {menu ? <IconX /> : <IconMenu />}
            </button>
            <UserMenu />
          </div>
        </div>
        {menu && (
          <nav className="lg:hidden border-t border-line bg-bg/95 backdrop-blur-xl px-4 py-3 flex flex-col animate-pop" aria-label="Main">
            {nav.map((n, i) => (
              <NavLink
                key={n.to}
                to={n.to}
                style={{ ['--d' as string]: i }}
                end={n.to === '/admin'}
                className={({ isActive }) => cx('animate-fade-up flex items-center gap-2 px-2 py-3 text-[17px] font-medium border-b border-line last:border-0', linkClass(n, isActive) && 'text-accent')}
              >
                {n.label}
                {n.badge > 0 && <span className="h-5 px-1.5 rounded-full bg-bad text-white text-[11.5px] font-bold inline-flex items-center">{n.badge}</span>}
              </NavLink>
            ))}
          </nav>
        )}
      </header>
      <main id="main" key={loc.pathname} className="flex-1 animate-page">
        {children}
      </main>
      <footer className="relative mt-20 border-t border-line bg-surface/40 backdrop-blur">
        <div aria-hidden className="absolute -top-px left-0 right-0 h-px opacity-70" style={{ background: 'var(--grad)' }} />
        {!isAdmin && (
          <div className="mx-auto max-w-[1280px] px-4 sm:px-6 pt-10 pb-6 grid gap-8 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
            <div>
              <Logo />
              <p className="mt-3 text-muted text-[15px] max-w-sm">
                A free, self-paced path from the math of machine learning to production AI systems.{' '}
                {signedIn ? 'Your progress is saved to your account automatically.' : 'Your progress is saved in this browser; back it up from My progress.'}
              </p>
            </div>
            <FooterCol title="Learn">
              <Link to="/start">How this works</Link>
              <Link to="/courses">All courses</Link>
              <Link to="/projects">Guided projects</Link>
              <Link to="/playground">Playground</Link>
              <a href={ANDROID_APP.url} download rel="noopener">
                Android app
              </a>
            </FooterCol>
            <FooterCol title="Reference">
              <Link to="/cheatsheet">Equation cheat sheet</Link>
              <Link to="/glossary">Glossary</Link>
              <Link to="/resources">Books and courses</Link>
              <Link to="/certificate/program">Program certificate</Link>
            </FooterCol>
            <FooterCol title="Account">
              {signedIn ? <Link to="/account">Account settings</Link> : <Link to="/register">Create an account</Link>}
              {!signedIn && <Link to="/login">Sign in</Link>}
              <Link to="/progress">My progress</Link>
              <Link to="/settings">Appearance settings</Link>
            </FooterCol>
          </div>
        )}
        <div className={cx('mx-auto max-w-[1280px] px-4 sm:px-6 py-5 flex flex-wrap items-center justify-between gap-3 text-[13.5px] text-muted', !isAdmin && 'border-t border-line')}>
          <span>© {new Date().getFullYear()} The AI Guide Academy</span>
          <nav className="flex flex-wrap gap-x-5 gap-y-1" aria-label="Legal">
            <Link to="/privacy" className="hover:text-ink">Privacy policy</Link>
            <Link to="/terms" className="hover:text-ink">Terms of use</Link>
            <Link to="/cookies" className="hover:text-ink">Cookies and storage</Link>
          </nav>
        </div>
      </footer>
      {!isAdmin && <SearchPalette />}
    </div>
  );
}

function FooterCol({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2 text-[15px] [&>a]:text-muted [&>a]:transition-colors [&>a:hover]:text-ink [&>a]:w-fit">
      <span className="font-semibold">{title}</span>
      {children}
    </div>
  );
}

/** Number of open account-deletion requests, refreshed on every navigation while an admin is signed in. */
function usePendingDeletions(isAdmin: boolean, pathname: string) {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!isAdmin) return setN(0);
    let alive = true;
    api<{ deletionRequests: number }>('/admin/stats')
      .then((s) => alive && setN(s.deletionRequests))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [isAdmin, pathname]);
  return n;
}
