import { useEffect, useState, type ReactNode } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { useProgress, type Theme } from '../lib/store';
import { IconMenu, IconMoon, IconSearch, IconShield, IconSun, IconX } from './icons';
import { useRevealObserver } from './motion';
import { openSearch, SearchPalette } from './SearchPalette';
import { cx } from './ui';
import { SyncBadge, UserMenu } from './UserMenu';

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
        <circle cx="22" cy="16" r="3.6" fill="#f0a35c" />
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
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#0d1120' : '#f4f6fb');
      window.dispatchEvent(new Event('themechange'));
    };
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, [theme]);
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
  useRevealObserver();
  const [menu, setMenu] = useState(false);
  const loc = useLocation();
  const scrolled = useScrolled();
  const isAdmin = useAuth((s) => s.user?.role === 'admin');
  const signedIn = useAuth((s) => !!s.user);
  const nav = isAdmin ? [...NAV, { to: '/admin', label: 'Admin' }] : NAV;
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
          <nav className="hidden lg:flex items-center gap-1 ml-6" aria-label="Main">
            {nav.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                className={({ isActive }) =>
                  cx('nav-link px-3 py-2 rounded-[10px] text-[15px] font-medium transition-colors hover:text-ink inline-flex items-center gap-1.5', isActive ? 'active text-accent' : 'text-ink/75')
                }
              >
                {n.to === '/admin' && <IconShield size={15} />}
                {n.label}
              </NavLink>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-1">
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
            <SyncBadge />
            <ThemeToggle />
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
                className={({ isActive }) => cx('animate-fade-up px-2 py-3 text-[17px] font-medium border-b border-line last:border-0', isActive && 'text-accent')}
              >
                {n.label}
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
        <div className="mx-auto max-w-[1280px] px-4 sm:px-6 py-10 grid gap-8 sm:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <Logo />
            <p className="mt-3 text-muted text-[15px] max-w-sm">
              A free, self-paced path from the math of machine learning to production AI systems.{' '}
              {signedIn ? 'Your progress is saved to your account automatically.' : 'Your progress is saved in this browser; back it up from My progress.'}
            </p>
          </div>
          <div className="flex flex-col gap-2 text-[15px]">
            <span className="font-semibold">Learn</span>
            <Link to="/start" className="text-muted hover:text-ink">How this works</Link>
            <Link to="/courses" className="text-muted hover:text-ink">All courses</Link>
            <Link to="/projects" className="text-muted hover:text-ink">Guided projects</Link>
            <Link to="/playground" className="text-muted hover:text-ink">Playground</Link>
          </div>
          <div className="flex flex-col gap-2 text-[15px]">
            <span className="font-semibold">Reference</span>
            <Link to="/cheatsheet" className="text-muted hover:text-ink">Equation cheat sheet</Link>
            <Link to="/glossary" className="text-muted hover:text-ink">Glossary</Link>
            <Link to="/resources" className="text-muted hover:text-ink">Books and courses</Link>
            <Link to="/certificate/program" className="text-muted hover:text-ink">Program certificate</Link>
          </div>
        </div>
      </footer>
      <SearchPalette />
    </div>
  );
}
