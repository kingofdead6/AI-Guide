import { Link, useLocation } from 'react-router-dom';
import { IconArrowLeft, IconBook, IconChart, IconSearch } from '../components/icons';
import { openSearch } from '../components/SearchPalette';
import { btn, useTitle } from '../components/ui';
import { useAuth } from '../lib/auth';

export default function NotFound() {
  useTitle('Page not found');
  const { pathname } = useLocation();
  const isAdmin = useAuth((s) => s.user?.role === 'admin');

  return (
    <div className="relative mx-auto max-w-[760px] px-4 sm:px-6 pt-12 sm:pt-20 text-center">
      <div aria-hidden className="pointer-events-none absolute left-1/2 top-10 -z-10 h-72 w-72 -translate-x-1/2 rounded-full opacity-30 blur-3xl" style={{ background: 'var(--grad)' }} />
      <div className="relative inline-block select-none" aria-hidden>
        <div className="animate-float font-wide text-[130px] sm:text-[170px] leading-none font-[850] tracking-[-0.06em] text-gradient">404</div>
        <svg className="absolute -right-6 top-4 animate-spin-in" width="44" height="44" viewBox="0 0 44 44">
          <circle cx="22" cy="22" r="20" fill="var(--surface)" stroke="var(--border-strong)" />
          <circle cx="22" cy="22" r="6" fill="var(--warn)" className="map-halo" />
          <circle cx="22" cy="22" r="6" fill="var(--warn)" />
        </svg>
      </div>
      <h1 className="animate-fade-up mt-4 font-wide text-[34px] sm:text-[42px] font-[780] tracking-tight">This page does not exist</h1>
      <p className="animate-fade-up mt-3 text-muted text-lg" style={{ ['--d' as string]: 1 }}>
        The link may be out of date. Every course is listed on the courses page.
      </p>
      <p className="animate-fade-up mt-2 text-[13.5px] text-muted font-mono break-all" style={{ ['--d' as string]: 1 }}>
        {pathname}
      </p>

      {isAdmin ? (
        <Link to="/admin" className={`${btn.primary} mt-8`}>
          <IconArrowLeft size={17} /> Back to the admin panel
        </Link>
      ) : (
        <>
          <div className="animate-fade-up mt-8 flex flex-wrap justify-center gap-3" style={{ ['--d' as string]: 2 }}>
            <Link to="/courses" className={btn.primary}>
              See all courses
            </Link>
            <button type="button" onClick={openSearch} className={btn.secondary}>
              <IconSearch size={17} /> Search the academy
            </button>
          </div>
          <div className="mt-12 grid sm:grid-cols-3 gap-3 text-left">
            {[
              { to: '/', icon: IconArrowLeft, title: 'Home', text: 'The learning map and your next lesson.' },
              { to: '/progress', icon: IconChart, title: 'My progress', text: 'Lessons, scores and certificates.' },
              { to: '/glossary', icon: IconBook, title: 'Glossary', text: 'Every key term, with flashcards.' },
            ].map(({ to, icon: Icon, title, text }, i) => (
              <Link key={to} to={to} data-reveal style={{ ['--d' as string]: i }} className="group card-lift glow-border rounded-2xl border border-line bg-surface p-4">
                <Icon size={19} className="text-accent icon-bounce" />
                <p className="mt-2 font-semibold group-hover:text-accent">{title}</p>
                <p className="text-[13.5px] text-muted">{text}</p>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
