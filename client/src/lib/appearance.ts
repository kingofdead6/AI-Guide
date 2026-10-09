import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { buildThemeCss, CODE_FONTS, DEFAULT_THEME, findFont, READING_FONTS, UI_FONTS } from './themes';

export type Appearance = {
  palette: string;
  uiFont: string;
  readingFont: string;
  codeFont: string;
  /** Multiplier for lesson text size. */
  readingScale: number;
  motion: 'full' | 'reduced';
  glow: boolean;
};

export const APPEARANCE_DEFAULTS: Appearance = {
  palette: DEFAULT_THEME,
  uiFont: 'archivo',
  readingFont: 'sourceserif',
  codeFont: 'jetbrains',
  readingScale: 1,
  motion: 'full',
  glow: true,
};

/** What index.html applies before React loads, so a saved theme never flashes the default first. */
export const BOOT_KEY = 'aiguide-appearance-boot';

export const useAppearance = create<Appearance & { set: (p: Partial<Appearance>) => void; reset: () => void }>()(
  persist(
    (set) => ({
      ...APPEARANCE_DEFAULTS,
      set: (p) => set(p),
      reset: () => set(APPEARANCE_DEFAULTS),
    }),
    {
      name: 'aiguide-appearance',
      storage: createJSONStorage(() => {
        try {
          return localStorage;
        } catch {
          return sessionStorage;
        }
      }),
      partialize: ({ palette, uiFont, readingFont, codeFont, readingScale, motion, glow }) => ({ palette, uiFont, readingFont, codeFont, readingScale, motion, glow }),
    },
  ),
);

const googleHref = (families: (string | undefined)[]) => {
  const f = families.filter(Boolean);
  return f.length ? `https://fonts.googleapis.com/css2?${f.map((x) => `family=${x}`).join('&')}&display=swap` : '';
};

function ensureEl<T extends HTMLElement>(id: string, tag: string): T {
  let el = document.getElementById(id) as T | null;
  if (!el) {
    el = document.createElement(tag) as T;
    el.id = id;
    document.head.appendChild(el);
  }
  return el;
}

/** Loads extra Google Fonts (for the settings previews) without touching the user's chosen fonts. */
export function loadPreviewFonts(families: (string | undefined)[]) {
  const link = ensureEl<HTMLLinkElement>('preview-fonts', 'link');
  link.rel = 'stylesheet';
  const href = googleHref(families);
  if (href && link.href !== href) link.href = href;
}

export function applyAppearance(a: Appearance) {
  const root = document.documentElement;
  const ui = findFont(UI_FONTS, a.uiFont);
  const reading = findFont(READING_FONTS, a.readingFont);
  const code = findFont(CODE_FONTS, a.codeFont);
  const css = buildThemeCss(a.palette);
  const vars: Record<string, string> = {
    '--font-ui': ui.stack,
    '--font-sans': ui.stack,
    '--font-serif': reading.stack,
    '--font-mono': code.stack,
    '--reading-scale': String(a.readingScale),
  };
  const classes = { 'reduce-motion': a.motion === 'reduced', 'no-glow': !a.glow };
  const fonts = googleHref([ui.google, reading.google, code.google]);

  if (css) root.setAttribute('data-palette', a.palette);
  else root.removeAttribute('data-palette');
  ensureEl<HTMLStyleElement>('theme-css', 'style').textContent = css;
  for (const [k, v] of Object.entries(vars)) root.style.setProperty(k, v);
  for (const [k, on] of Object.entries(classes)) root.classList.toggle(k, on);
  const link = ensureEl<HTMLLinkElement>('user-fonts', 'link');
  link.rel = 'stylesheet';
  if (fonts) {
    if (link.href !== fonts) link.href = fonts;
  } else link.removeAttribute('href');

  try {
    localStorage.setItem(BOOT_KEY, JSON.stringify({ palette: css ? a.palette : '', css, vars, classes, fonts }));
  } catch {
    /* storage blocked: settings still apply for this visit */
  }
  window.dispatchEvent(new Event('themechange'));
}

export const motionReduced = () =>
  document.documentElement.classList.contains('reduce-motion') || window.matchMedia('(prefers-reduced-motion: reduce)').matches;
