/**
 * Colour themes. Each theme is a handful of OKLCH parameters; buildThemeCss turns them into the full
 * set of design tokens (see :root in index.css) for both light and dark mode.
 * The default theme has no CSS of its own: it uses the hand-tuned palette in index.css.
 */
export type Theme = {
  id: string;
  name: string;
  blurb: string;
  /** accent hue, accent chroma */
  h: number;
  c: number;
  /** the two other hues in the brand gradient */
  h2: number;
  h3: number;
  /** neutral (background, borders, text) hue and chroma; chroma 0 = pure grey */
  nh: number;
  nc: number;
  /** lightness of the accent in light mode (lower = deeper) */
  al?: number;
};

export const DEFAULT_THEME = 'indigo';

export const THEMES: Theme[] = [
  { id: 'indigo', name: 'Indigo', blurb: 'The academy default', h: 277, c: 0.21, h2: 305, h3: 15, nh: 280, nc: 0.012 },
  { id: 'ocean', name: 'Ocean', blurb: 'Deep blue and teal', h: 245, c: 0.17, h2: 215, h3: 185, nh: 235, nc: 0.014 },
  { id: 'forest', name: 'Forest', blurb: 'Calm greens', h: 152, c: 0.15, h2: 130, h3: 95, nh: 150, nc: 0.012, al: 0.5 },
  { id: 'sunset', name: 'Sunset', blurb: 'Warm orange into pink', h: 40, c: 0.18, h2: 15, h3: 350, nh: 50, nc: 0.012, al: 0.58 },
  { id: 'rose', name: 'Rose', blurb: 'Soft and rosy', h: 5, c: 0.19, h2: 340, h3: 20, nh: 10, nc: 0.012 },
  { id: 'lavender', name: 'Lavender', blurb: 'Gentle purples', h: 300, c: 0.16, h2: 280, h3: 330, nh: 300, nc: 0.016 },
  { id: 'mint', name: 'Mint', blurb: 'Fresh teal and green', h: 178, c: 0.13, h2: 160, h3: 200, nh: 180, nc: 0.012, al: 0.52 },
  { id: 'honey', name: 'Honey', blurb: 'Golden amber', h: 70, c: 0.16, h2: 55, h3: 35, nh: 75, nc: 0.016, al: 0.54 },
  { id: 'crimson', name: 'Crimson', blurb: 'Bold reds', h: 25, c: 0.21, h2: 10, h3: 45, nh: 20, nc: 0.01, al: 0.53 },
  { id: 'nord', name: 'Nord', blurb: 'Arctic blue-greys', h: 235, c: 0.09, h2: 200, h3: 175, nh: 240, nc: 0.022 },
  { id: 'dracula', name: 'Dracula', blurb: 'Purple and pink night', h: 305, c: 0.19, h2: 345, h3: 190, nh: 290, nc: 0.035 },
  { id: 'solarized', name: 'Solarized', blurb: 'Classic paper and blue', h: 240, c: 0.13, h2: 195, h3: 85, nh: 90, nc: 0.03, al: 0.55 },
  { id: 'coffee', name: 'Coffee', blurb: 'Roasted browns', h: 55, c: 0.1, h2: 40, h3: 75, nh: 60, nc: 0.025, al: 0.5 },
  { id: 'cyber', name: 'Cyberpunk', blurb: 'Neon magenta and cyan', h: 330, c: 0.26, h2: 290, h3: 200, nh: 285, nc: 0.03 },
  { id: 'sakura', name: 'Sakura', blurb: 'Cherry blossom pink', h: 350, c: 0.14, h2: 320, h3: 25, nh: 350, nc: 0.018, al: 0.58 },
  { id: 'aurora', name: 'Aurora', blurb: 'Northern lights', h: 165, c: 0.15, h2: 220, h3: 300, nh: 230, nc: 0.02, al: 0.52 },
  { id: 'grape', name: 'Grape', blurb: 'Rich violet', h: 290, c: 0.22, h2: 270, h3: 320, nh: 290, nc: 0.014, al: 0.48 },
  { id: 'sky', name: 'Sky', blurb: 'Bright and airy blue', h: 230, c: 0.15, h2: 250, h3: 200, nh: 225, nc: 0.01, al: 0.53 },
  { id: 'lime', name: 'Lime', blurb: 'Zesty yellow-green', h: 128, c: 0.17, h2: 105, h3: 160, nh: 120, nc: 0.012, al: 0.55 },
  { id: 'mono', name: 'Monochrome', blurb: 'Pure greys, no distractions', h: 260, c: 0.0, h2: 260, h3: 260, nh: 260, nc: 0, al: 0.3 },
];

const o = (l: number, c: number, h: number) => `oklch(${l.toFixed(3)} ${Math.max(0, c).toFixed(3)} ${h})`;

function tokens(t: Theme, dark: boolean) {
  const { h, c, h2, h3, nh, nc } = t;
  const al = t.al ?? 0.52;
  const mono = c === 0;
  if (!dark) {
    return {
      '--bg': o(0.977, nc * 0.7, nh),
      '--surface': o(0.997, nc * 0.25, nh),
      '--sunk': o(0.945, nc, nh),
      '--text': o(0.21, nc * 1.6, nh),
      '--muted': o(0.5, nc * 2, nh),
      '--border': o(0.905, nc * 1.1, nh),
      '--border-strong': o(0.82, nc * 1.3, nh),
      '--accent': o(al, c, h),
      '--accent-ink': o(al - 0.1, c * 0.95, h),
      '--accent-soft': o(0.95, mono ? 0.0 : Math.min(0.045, c * 0.25), h),
      '--fig-bg': o(0.985, nc * 0.5, nh),
      '--code-bg': o(0.2, nc * 1.5 + 0.01, nh),
      '--grad': `linear-gradient(115deg, ${o(al, c, h)} 0%, ${o(al + 0.04, c, h2)} 52%, ${o(al + 0.1, c, h3)} 100%)`,
      '--blob-a': o(0.84, mono ? 0 : 0.11, h),
      '--blob-b': o(0.86, mono ? 0 : 0.1, h2),
      '--blob-c': o(0.9, mono ? 0 : 0.09, h3),
      '--blob-opacity': mono ? '0.25' : '0.38',
    };
  }
  return {
    '--bg': o(0.165, nc * 1.1 + 0.004, nh),
    '--surface': o(0.205, nc * 1.1 + 0.006, nh),
    '--sunk': o(0.135, nc + 0.003, nh),
    '--text': o(0.945, nc * 0.5, nh),
    '--muted': o(0.72, nc * 1.4, nh),
    '--border': o(0.29, nc * 1.2 + 0.006, nh),
    '--border-strong': o(0.37, nc * 1.2 + 0.006, nh),
    '--accent': o(0.74, c * 0.85, h),
    '--accent-ink': o(0.84, c * 0.6, h),
    '--accent-soft': o(0.27, mono ? 0 : Math.min(0.07, c * 0.4), h),
    '--fig-bg': o(0.19, nc + 0.004, nh),
    '--code-bg': o(0.13, nc + 0.004, nh),
    '--grad': `linear-gradient(115deg, ${o(0.74, c * 0.85, h)} 0%, ${o(0.76, c * 0.85, h2)} 52%, ${o(0.8, c * 0.8, h3)} 100%)`,
    '--blob-a': o(0.36, mono ? 0 : 0.12, h),
    '--blob-b': o(0.34, mono ? 0 : 0.12, h2),
    '--blob-c': o(0.32, mono ? 0 : 0.1, h3),
    '--blob-opacity': mono ? '0.2' : '0.32',
  };
}

const block = (sel: string, vars: Record<string, string>) => `${sel}{${Object.entries(vars).map(([k, v]) => `${k}:${v}`).join(';')}}`;

/** CSS that overrides the design tokens for a theme. Empty for the default theme. */
export function buildThemeCss(id: string) {
  const t = THEMES.find((x) => x.id === id);
  if (!t || t.id === DEFAULT_THEME) return '';
  return block(':root[data-palette]', tokens(t, false)) + block(':root.dark[data-palette]', tokens(t, true));
}

/** Small swatch colours for the picker, in both modes. */
export function swatch(t: Theme, dark: boolean) {
  const v = tokens(t, dark);
  return { bg: v['--bg'], surface: v['--surface'], accent: v['--accent'], grad: v['--grad'], text: v['--text'], muted: v['--muted'], border: v['--border'] };
}

/* ------------------------------------------------------------------ fonts */
export type FontOption = { id: string; name: string; stack: string; google?: string; note?: string };

export const UI_FONTS: FontOption[] = [
  { id: 'archivo', name: 'Archivo', stack: "'Archivo', ui-sans-serif, system-ui, sans-serif", note: 'Default' },
  { id: 'inter', name: 'Inter', stack: "'Inter', ui-sans-serif, system-ui, sans-serif", google: 'Inter:wght@400..800' },
  { id: 'jakarta', name: 'Plus Jakarta Sans', stack: "'Plus Jakarta Sans', ui-sans-serif, sans-serif", google: 'Plus+Jakarta+Sans:wght@400..800' },
  { id: 'grotesk', name: 'Space Grotesk', stack: "'Space Grotesk', ui-sans-serif, sans-serif", google: 'Space+Grotesk:wght@400..700' },
  { id: 'dmsans', name: 'DM Sans', stack: "'DM Sans', ui-sans-serif, sans-serif", google: 'DM+Sans:wght@400..800' },
  { id: 'outfit', name: 'Outfit', stack: "'Outfit', ui-sans-serif, sans-serif", google: 'Outfit:wght@400..800' },
  { id: 'manrope', name: 'Manrope', stack: "'Manrope', ui-sans-serif, sans-serif", google: 'Manrope:wght@400..800' },
  { id: 'nunito', name: 'Nunito', stack: "'Nunito', ui-sans-serif, sans-serif", google: 'Nunito:wght@400..800', note: 'Rounded' },
  { id: 'poppins', name: 'Poppins', stack: "'Poppins', ui-sans-serif, sans-serif", google: 'Poppins:wght@400;500;600;700;800' },
  { id: 'plex', name: 'IBM Plex Sans', stack: "'IBM Plex Sans', ui-sans-serif, sans-serif", google: 'IBM+Plex+Sans:wght@400;500;600;700' },
  { id: 'lexend', name: 'Lexend', stack: "'Lexend', ui-sans-serif, sans-serif", google: 'Lexend:wght@400..800', note: 'Easy reading' },
  { id: 'atkinson', name: 'Atkinson Hyperlegible', stack: "'Atkinson Hyperlegible', ui-sans-serif, sans-serif", google: 'Atkinson+Hyperlegible:wght@400;700', note: 'High legibility' },
  { id: 'system', name: 'System', stack: "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif", note: 'Your device font' },
];

export const READING_FONTS: FontOption[] = [
  { id: 'sourceserif', name: 'Source Serif 4', stack: "'Source Serif 4', 'Iowan Old Style', Georgia, serif", note: 'Default' },
  { id: 'merriweather', name: 'Merriweather', stack: "'Merriweather', Georgia, serif", google: 'Merriweather:ital,wght@0,400;0,700;1,400' },
  { id: 'lora', name: 'Lora', stack: "'Lora', Georgia, serif", google: 'Lora:ital,wght@0,400..700;1,400..700' },
  { id: 'literata', name: 'Literata', stack: "'Literata', Georgia, serif", google: 'Literata:ital,opsz,wght@0,7..72,400..700;1,7..72,400..700' },
  { id: 'newsreader', name: 'Newsreader', stack: "'Newsreader', Georgia, serif", google: 'Newsreader:ital,opsz,wght@0,6..72,400..700;1,6..72,400..700' },
  { id: 'crimson', name: 'Crimson Pro', stack: "'Crimson Pro', Georgia, serif", google: 'Crimson+Pro:ital,wght@0,400..700;1,400..700' },
  { id: 'fraunces', name: 'Fraunces', stack: "'Fraunces', Georgia, serif", google: 'Fraunces:ital,opsz,wght@0,9..144,400..700;1,9..144,400..700' },
  { id: 'sans', name: 'Same as interface', stack: 'var(--font-ui)', note: 'Sans-serif lessons' },
];

export const CODE_FONTS: FontOption[] = [
  { id: 'jetbrains', name: 'JetBrains Mono', stack: "'JetBrains Mono', ui-monospace, Menlo, monospace", note: 'Default' },
  { id: 'fira', name: 'Fira Code', stack: "'Fira Code', ui-monospace, monospace", google: 'Fira+Code:wght@400;500' },
  { id: 'sourcecode', name: 'Source Code Pro', stack: "'Source Code Pro', ui-monospace, monospace", google: 'Source+Code+Pro:wght@400;500' },
  { id: 'plexmono', name: 'IBM Plex Mono', stack: "'IBM Plex Mono', ui-monospace, monospace", google: 'IBM+Plex+Mono:wght@400;500' },
  { id: 'robotomono', name: 'Roboto Mono', stack: "'Roboto Mono', ui-monospace, monospace", google: 'Roboto+Mono:wght@400;500' },
  { id: 'spacemono', name: 'Space Mono', stack: "'Space Mono', ui-monospace, monospace", google: 'Space+Mono:wght@400;700' },
];

export const findFont = (list: FontOption[], id: string) => list.find((f) => f.id === id) ?? list[0];
