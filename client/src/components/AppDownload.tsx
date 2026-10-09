import { ANDROID_APP } from '../lib/site';
import { IconAndroid, IconCheck, IconDownload } from './icons';
import { btn, cx } from './ui';

/** Link to the Android APK. */
export function AppDownloadButton({ className, label = 'Download for Android' }: { className?: string; label?: string }) {
  return (
    <a href={ANDROID_APP.url} download className={cx(btn.primary, className)} rel="noopener">
      <IconDownload size={18} /> {label}
    </a>
  );
}

/** Home page promo: a phone mock-up next to what the app offers and the download button. */
export function AppDownloadSection() {
  return (
    <section data-reveal className="relative overflow-hidden rounded-3xl border border-line bg-surface shadow-[var(--shadow-lift)]">
      <div aria-hidden className="absolute -right-24 -top-24 h-72 w-72 rounded-full opacity-25 blur-3xl" style={{ background: 'var(--grad)' }} />
      <div aria-hidden className="absolute -left-20 -bottom-28 h-64 w-64 rounded-full opacity-15 blur-3xl" style={{ background: 'var(--c3)' }} />
      <div className="relative grid md:grid-cols-[1fr_auto] gap-8 items-center p-6 sm:p-10">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full bg-accent-soft text-accent-ink px-3 py-1 text-[13px] font-semibold">
            <IconAndroid size={16} /> Now on Android
          </p>
          <h2 className="mt-4 font-wide text-[30px] sm:text-[38px] leading-[1.05] font-[780] tracking-tight text-balance">
            Take the academy <span className="text-gradient">with you.</span>
          </h2>
          <p className="mt-3 text-muted text-[16.5px] max-w-xl">Every course, quiz and exam in your pocket. Sign in with the same account and your progress follows you between the app and this site.</p>
          <ul className="mt-5 grid sm:grid-cols-2 gap-x-6 gap-y-2.5 text-[15px]">
            {['Lessons work offline', 'Run Python exercises on your phone', 'Progress syncs with the website', '20 colour themes and dark mode'].map((t) => (
              <li key={t} className="flex items-center gap-2.5">
                <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-ok-soft text-ok">
                  <IconCheck size={13} strokeWidth={3} />
                </span>
                {t}
              </li>
            ))}
          </ul>
          <div className="mt-7 flex flex-wrap items-center gap-x-4 gap-y-2">
            <AppDownloadButton className="px-5 py-3 text-[16px]" />
            <span className="text-[13.5px] text-muted">
              APK, {ANDROID_APP.size}, {ANDROID_APP.minAndroid}
            </span>
          </div>
          <p className="mt-3 text-[13px] text-muted max-w-xl">
            The app is installed from this file rather than an app store, so Android will ask you to allow installs from your browser the first time.
          </p>
        </div>
        <PhoneMockup />
      </div>
    </section>
  );
}

function PhoneMockup() {
  return (
    <div aria-hidden className="hidden md:block animate-float">
      <div className="relative w-[210px] h-[420px] rounded-[38px] border-[7px] border-ink/90 bg-bg shadow-2xl overflow-hidden">
        <div className="absolute left-1/2 top-2 h-4 w-16 -translate-x-1/2 rounded-full bg-ink/90" />
        <div className="h-1.5 mt-9" style={{ background: 'var(--grad)' }} />
        <div className="p-3.5">
          <p className="font-wide text-[19px] font-[800] leading-[1.05] tracking-tight">
            From vectors to <span className="text-gradient">agents.</span>
          </p>
          <div className="mt-3 rounded-xl border border-line bg-surface p-2.5">
            <p className="text-[9px] font-semibold text-accent">Pick up where you left off</p>
            <p className="mt-0.5 text-[11px] font-bold leading-tight">Linear Regression, Ridge &amp; Lasso</p>
            <div className="mt-2 h-6 rounded-lg" style={{ background: 'var(--grad)' }} />
          </div>
          {[
            ['var(--c1)', 'Python for AI', 0.8],
            ['var(--c2)', 'Mathematics for AI', 0.45],
            ['var(--c3)', 'Classical ML', 0.2],
          ].map(([c, t, v]) => (
            <div key={t as string} className="mt-2 flex items-center gap-2 rounded-xl border border-line bg-surface p-2">
              <span className="h-5 w-5 shrink-0 rounded-full border-2" style={{ borderColor: c as string }} />
              <div className="min-w-0 flex-1">
                <p className="text-[9.5px] font-bold truncate">{t}</p>
                <div className="mt-1 h-1 rounded-full bg-sunk">
                  <div className="h-full rounded-full" style={{ width: `${(v as number) * 100}%`, background: c as string }} />
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="absolute bottom-0 inset-x-0 flex justify-around border-t border-line bg-surface py-2">
          {[0, 1, 2, 3, 4].map((i) => (
            <span key={i} className={cx('h-1.5 w-5 rounded-full', i === 0 ? 'bg-accent' : 'bg-line-strong')} />
          ))}
        </div>
      </div>
    </div>
  );
}
