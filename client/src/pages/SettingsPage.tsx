import { useEffect, useState, type ReactNode } from 'react';
import { IconCheck, IconCode, IconMoon, IconPalette, IconRefresh, IconSpark, IconSun, IconType } from '../components/icons';
import { btn, cx, PageHeader, ProgressBar, useTitle } from '../components/ui';
import { APPEARANCE_DEFAULTS, loadPreviewFonts, useAppearance } from '../lib/appearance';
import { useProgress, type Theme as Mode } from '../lib/store';
import { CODE_FONTS, READING_FONTS, swatch, THEMES, UI_FONTS, type FontOption } from '../lib/themes';

function useIsDark() {
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'));
  useEffect(() => {
    const on = () => setDark(document.documentElement.classList.contains('dark'));
    window.addEventListener('themechange', on);
    return () => window.removeEventListener('themechange', on);
  }, []);
  return dark;
}

const SECTIONS = [
  { id: 'mode', label: 'Light and dark' },
  { id: 'theme', label: 'Colour theme' },
  { id: 'fonts', label: 'Fonts' },
  { id: 'reading', label: 'Reading size' },
  { id: 'motion', label: 'Motion and effects' },
];

function Section({ id, title, sub, icon, children }: { id: string; title: string; sub: string; icon: ReactNode; children: ReactNode }) {
  return (
    <section id={id} data-reveal className="scroll-mt-24 rounded-2xl border border-line bg-surface p-5 sm:p-6 shadow-[var(--shadow-card)]">
      <div className="flex items-start gap-3 mb-5">
        <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent">{icon}</span>
        <div>
          <h2 className="text-[19px] font-bold leading-tight">{title}</h2>
          <p className="text-muted text-[14.5px] mt-0.5">{sub}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

function Check() {
  return (
    <span className="absolute right-2.5 top-2.5 z-10 inline-flex h-6 w-6 items-center justify-center rounded-full bg-accent text-white dark:text-[#0a0a12] shadow-md animate-spin-in">
      <IconCheck size={14} strokeWidth={3} />
    </span>
  );
}

function Toggle({ on, onChange, label, sub }: { on: boolean; onChange: (v: boolean) => void; label: string; sub: string }) {
  return (
    <button type="button" role="switch" aria-checked={on} onClick={() => onChange(!on)} className="group flex w-full items-center gap-4 rounded-xl px-1 py-3 text-left">
      <span className="min-w-0 flex-1">
        <span className="block font-semibold">{label}</span>
        <span className="block text-[14px] text-muted">{sub}</span>
      </span>
      <span className={cx('relative h-7 w-12 shrink-0 rounded-full transition-colors duration-300', on ? 'bg-accent' : 'bg-line-strong')}>
        <span className={cx('absolute top-1 left-1 h-5 w-5 rounded-full bg-white shadow transition-transform duration-300', on && 'translate-x-5')} />
      </span>
    </button>
  );
}

function FontGrid({ label, options, value, onPick, sample, mono }: { label: string; options: FontOption[]; value: string; onPick: (id: string) => void; sample: string; mono?: boolean }) {
  return (
    <div>
      <h3 className="font-semibold mb-2.5">{label}</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
        {options.map((f) => {
          const active = value === f.id;
          return (
            <button
              key={f.id}
              type="button"
              onClick={() => onPick(f.id)}
              aria-pressed={active}
              className={cx(
                'relative rounded-xl border p-3.5 text-left transition-all duration-300 hover:-translate-y-0.5',
                active ? 'border-accent bg-accent-soft/60 shadow-[0_0_0_3px_var(--glow)]' : 'border-line hover:border-line-strong hover:shadow-[var(--shadow-card)]',
              )}
            >
              {active && <Check />}
              <span className={cx('block leading-none', mono ? 'text-[22px]' : 'text-[28px] font-semibold')} style={{ fontFamily: f.stack }}>
                {sample}
              </span>
              <span className="mt-2.5 block text-[14px] font-semibold truncate" style={{ fontFamily: f.stack }}>
                {f.name}
              </span>
              <span className={cx('block text-[12px] text-muted', !f.note && 'invisible')}>{f.note || '.'}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function SettingsPage() {
  useTitle('Settings');
  const a = useAppearance();
  const mode = useProgress((s) => s.theme);
  const setMode = useProgress((s) => s.setTheme);
  const dark = useIsDark();
  const [justReset, setJustReset] = useState(false);

  useEffect(() => {
    loadPreviewFonts([...UI_FONTS, ...READING_FONTS, ...CODE_FONTS].map((f) => f.google));
  }, []);

  const isDefault = (Object.keys(APPEARANCE_DEFAULTS) as (keyof typeof APPEARANCE_DEFAULTS)[]).every((k) => a[k] === APPEARANCE_DEFAULTS[k]);

  return (
    <div className="mx-auto max-w-[1280px] px-4 sm:px-6">
      <PageHeader title="Settings" sub="Make the academy look and read the way you like. Changes apply instantly and are saved on this device." />

      <div className="grid lg:grid-cols-[220px_minmax(0,1fr)] xl:grid-cols-[220px_minmax(0,1fr)_300px] gap-8">
        <aside className="hidden lg:block">
          <nav className="sticky top-24 flex flex-col gap-1" aria-label="Settings sections">
            {SECTIONS.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById(s.id)?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="rounded-xl px-3.5 py-2.5 text-[15px] font-medium text-muted transition-colors hover:bg-sunk hover:text-ink"
              >
                {s.label}
              </a>
            ))}
            <button
              type="button"
              disabled={isDefault}
              onClick={() => {
                a.reset();
                setJustReset(true);
                setTimeout(() => setJustReset(false), 2000);
              }}
              className="mt-4 inline-flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-[14px] font-semibold text-accent hover:bg-accent-soft disabled:opacity-40 disabled:hover:bg-transparent"
            >
              <IconRefresh size={16} /> {justReset ? 'Defaults restored' : 'Reset to defaults'}
            </button>
          </nav>
        </aside>

        <div className="flex flex-col gap-6 min-w-0">
          <Section id="mode" title="Light and dark" sub="Pick a mode, or follow your device setting." icon={dark ? <IconMoon size={19} /> : <IconSun size={19} />}>
            <div className="grid grid-cols-3 gap-3">
              {(
                [
                  { id: 'light', label: 'Light', icon: IconSun },
                  { id: 'dark', label: 'Dark', icon: IconMoon },
                  { id: 'system', label: 'System', icon: IconSpark },
                ] as { id: Mode; label: string; icon: typeof IconSun }[]
              ).map(({ id, label, icon: Icon }) => {
                const active = mode === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setMode(id)}
                    aria-pressed={active}
                    className={cx('relative overflow-hidden rounded-xl border p-3 text-left transition-all duration-300 hover:-translate-y-0.5', active ? 'border-accent shadow-[0_0_0_3px_var(--glow)]' : 'border-line hover:border-line-strong')}
                  >
                    {active && <Check />}
                    <span
                      aria-hidden
                      className="block h-16 rounded-lg border border-black/5"
                      style={{
                        background:
                          id === 'light' ? 'linear-gradient(#f7f7fb, #ececf3)' : id === 'dark' ? 'linear-gradient(#1a1a26, #0d0d14)' : 'linear-gradient(115deg, #f7f7fb 0 50%, #13131c 50% 100%)',
                      }}
                    >
                      <span className="flex gap-1 p-2">
                        <span className="h-1.5 w-8 rounded-full" style={{ background: 'var(--accent)' }} />
                        <span className={cx('h-1.5 w-5 rounded-full', id === 'light' ? 'bg-black/15' : 'bg-white/25')} />
                      </span>
                    </span>
                    <span className="mt-2.5 flex items-center gap-1.5 font-semibold">
                      <Icon size={16} /> {label}
                    </span>
                  </button>
                );
              })}
            </div>
          </Section>

          <Section id="theme" title="Colour theme" sub={`${THEMES.length} palettes. Each one has a light and a dark version.`} icon={<IconPalette size={19} />}>
            <div className="grid grid-cols-2 sm:grid-cols-3 2xl:grid-cols-4 gap-3">
              {THEMES.map((t, i) => {
                const sw = swatch(t, dark);
                const active = a.palette === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => a.set({ palette: t.id })}
                    aria-pressed={active}
                    style={{ ['--d' as string]: i % 4 }}
                    className={cx(
                      'animate-fade-up group relative rounded-2xl border p-2 text-left transition-all duration-300 hover:-translate-y-1',
                      active ? 'border-accent shadow-[0_0_0_3px_var(--glow)]' : 'border-line hover:border-line-strong hover:shadow-[var(--shadow-lift)]',
                    )}
                  >
                    {active && <Check />}
                    <span aria-hidden className="block overflow-hidden rounded-xl border" style={{ background: sw.bg, borderColor: sw.border }}>
                      <span className="block h-1.5 transition-[height] duration-300 group-hover:h-2.5" style={{ background: sw.grad }} />
                      <span className="flex gap-2 p-2.5">
                        <span className="flex-1 rounded-lg p-2 border" style={{ background: sw.surface, borderColor: sw.border }}>
                          <span className="block h-1.5 w-3/4 rounded-full" style={{ background: sw.text }} />
                          <span className="mt-1.5 block h-1 w-full rounded-full opacity-60" style={{ background: sw.muted }} />
                          <span className="mt-1 block h-1 w-2/3 rounded-full opacity-60" style={{ background: sw.muted }} />
                          <span className="mt-2.5 block h-3.5 w-12 rounded-md" style={{ background: sw.grad }} />
                        </span>
                        <span className="flex w-5 flex-col gap-1.5 pt-0.5">
                          <span className="h-5 w-5 rounded-full" style={{ background: sw.accent }} />
                          <span className="h-5 w-5 rounded-full opacity-50" style={{ background: sw.accent }} />
                        </span>
                      </span>
                    </span>
                    <span className="mt-2 block px-1 font-semibold leading-tight">{t.name}</span>
                    <span className="block px-1 pb-0.5 text-[12.5px] text-muted truncate">{t.blurb}</span>
                  </button>
                );
              })}
            </div>
          </Section>

          <Section id="fonts" title="Fonts" sub="Choose the typefaces for the interface, for lesson text and for code." icon={<IconType size={19} />}>
            <div className="flex flex-col gap-7">
              <FontGrid label="Interface" options={UI_FONTS} value={a.uiFont} onPick={(id) => a.set({ uiFont: id })} sample="Aa" />
              <FontGrid label="Lesson text" options={READING_FONTS} value={a.readingFont} onPick={(id) => a.set({ readingFont: id })} sample="Aa" />
              <FontGrid label="Code" options={CODE_FONTS} value={a.codeFont} onPick={(id) => a.set({ codeFont: id })} sample="{ }=>" mono />
            </div>
          </Section>

          <Section id="reading" title="Reading size" sub="Scale the text of lessons and reference pages." icon={<IconCode size={19} />}>
            <div className="flex items-center gap-4">
              <span className="text-[13px] font-semibold text-muted">A</span>
              <input
                type="range"
                min={0.85}
                max={1.3}
                step={0.05}
                value={a.readingScale}
                onChange={(e) => a.set({ readingScale: Number(e.target.value) })}
                className="flex-1 accent-[var(--accent)] h-2 cursor-pointer"
                aria-label="Lesson text size"
              />
              <span className="text-[20px] font-semibold text-muted">A</span>
              <span className="w-14 text-right font-bold tabular-nums">{Math.round(a.readingScale * 100)}%</span>
            </div>
            <div className="mt-5 rounded-xl border border-line bg-bg/60 p-5">
              <p className="font-serif leading-relaxed transition-[font-size] duration-200" style={{ fontSize: `calc(1.125rem * ${a.readingScale})` }}>
                Gradient descent takes small steps downhill on the loss surface, guided by the slope at each point.
              </p>
              <pre className="mt-3 rounded-lg px-4 py-3 text-[#e6edf3] overflow-x-auto font-mono" style={{ background: 'var(--code-bg)', fontSize: `calc(0.85rem * ${a.readingScale})` }}>
                w = w - lr * grad(loss, w)
              </pre>
            </div>
          </Section>

          <Section id="motion" title="Motion and effects" sub="Turn animations and decoration down if you prefer a calmer page." icon={<IconSpark size={19} />}>
            <div className="divide-y divide-line">
              <Toggle on={a.motion === 'full'} onChange={(v) => a.set({ motion: v ? 'full' : 'reduced' })} label="Animations" sub="Page transitions, scroll reveals, confetti and moving highlights." />
              <Toggle on={a.glow} onChange={(v) => a.set({ glow: v })} label="Background glow" sub="The soft drifting colour behind every page." />
            </div>
          </Section>

          <button
            type="button"
            disabled={isDefault}
            onClick={() => a.reset()}
            className={cx(btn.secondary, 'self-start lg:hidden')}
          >
            <IconRefresh size={16} /> Reset to defaults
          </button>
        </div>

        <aside className="hidden xl:block">
          <div className="sticky top-24 animate-fade-up" style={{ ['--d' as string]: 2 }}>
            <p className="text-[12.5px] font-semibold uppercase tracking-wide text-muted mb-2">Preview</p>
            <div className="relative overflow-hidden rounded-2xl border border-line bg-surface p-5 shadow-[var(--shadow-lift)]">
              <span aria-hidden className="absolute -right-10 -top-10 h-32 w-32 rounded-full opacity-30 blur-2xl" style={{ background: 'var(--grad)' }} />
              <p className="text-[13px] font-semibold text-accent">Course 4 of 16</p>
              <p className="mt-1 font-wide text-[24px] font-[780] leading-tight tracking-tight">
                From vectors to <span className="text-gradient">agents.</span>
              </p>
              <p className="mt-2 font-serif text-[15.5px] leading-relaxed text-muted">A short paragraph set in your lesson font, so you can judge how reading feels.</p>
              <pre className="mt-3 rounded-lg px-3 py-2.5 text-[12.5px] text-[#e6edf3] font-mono overflow-hidden" style={{ background: 'var(--code-bg)' }}>
                {'def relu(x):\n    return max(0, x)'}
              </pre>
              <div className="mt-4">
                <div className="flex justify-between text-[12.5px] text-muted mb-1">
                  <span>4 of 6 lessons</span>
                  <span>67%</span>
                </div>
                <ProgressBar value={0.67} />
              </div>
              <div className="mt-4 flex gap-2">
                <span className={cx(btn.primary, 'px-3 py-2 text-[14px]')}>Continue</span>
                <span className={cx(btn.secondary, 'px-3 py-2 text-[14px]')}>Details</span>
              </div>
              <div className="mt-4 flex gap-1.5">
                {['var(--c1)', 'var(--c2)', 'var(--c3)', 'var(--c4)', 'var(--c5)', 'var(--ok)', 'var(--warn)', 'var(--bad)'].map((c) => (
                  <span key={c} className="h-4 flex-1 rounded" style={{ background: c }} />
                ))}
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
