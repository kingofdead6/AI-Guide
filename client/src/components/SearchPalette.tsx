import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCourse } from '../lib/catalog';
import type { SearchEntry } from '../lib/types';
import { IconBook, IconSearch, IconSpark, IconTarget } from './icons';
import { cx } from './ui';

let index: Promise<SearchEntry[]> | null = null;
const loadIndex = () => (index ??= import('../generated/search.json').then((m) => m.default as unknown as SearchEntry[]));

export const openSearch = () => window.dispatchEvent(new Event('open-search'));

function score(e: SearchEntry, terms: string[]) {
  let s = 0;
  const title = e.title.toLowerCase();
  const lead = e.lead.toLowerCase();
  const head = (e.head || '').toLowerCase();
  const text = (e.text || '').toLowerCase();
  for (const t of terms) {
    let hit = false;
    if (title.includes(t)) (s += title.startsWith(t) ? 14 : 10), (hit = true);
    if (head.includes(t)) (s += 5), (hit = true);
    if (lead.includes(t)) (s += 4), (hit = true);
    if (text.includes(t)) (s += 1), (hit = true);
    if (!hit) return 0;
  }
  if (e.t === 'term') s += 2;
  return s;
}

export function SearchPalette() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [items, setItems] = useState<SearchEntry[]>([]);
  const [active, setActive] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  const nav = useNavigate();

  useEffect(() => {
    const show = () => {
      setOpen(true);
      loadIndex().then(setItems);
    };
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        show();
      }
    };
    window.addEventListener('open-search', show);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('open-search', show);
      window.removeEventListener('keydown', onKey);
    };
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => input.current?.focus(), 10);
    else setQ('');
  }, [open]);

  const results = useMemo(() => {
    const terms = q.toLowerCase().split(/\s+/).filter(Boolean);
    if (!terms.length) return [];
    return items
      .map((e) => ({ e, s: score(e, terms) }))
      .filter((x) => x.s > 0)
      .sort((a, b) => b.s - a.s)
      .slice(0, 12)
      .map((x) => x.e);
  }, [q, items]);

  useEffect(() => setActive(0), [q]);

  const go = (e: SearchEntry) => {
    setOpen(false);
    if (e.t === 'lesson') nav(`/course/${e.course}/${e.id}`);
    else if (e.t === 'term') nav(`/glossary?term=${encodeURIComponent(e.id)}`);
    else nav(`/projects#${e.id}`);
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[90] bg-black/40 flex items-start justify-center p-3 sm:pt-[12vh]" onClick={() => setOpen(false)}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Search"
        className="animate-pop w-full max-w-xl rounded-2xl bg-surface border border-line shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-4 border-b border-line">
          <IconSearch className="text-muted" />
          <input
            ref={input}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') setOpen(false);
              if (e.key === 'ArrowDown') (e.preventDefault(), setActive((a) => Math.min(a + 1, results.length - 1)));
              if (e.key === 'ArrowUp') (e.preventDefault(), setActive((a) => Math.max(a - 1, 0)));
              if (e.key === 'Enter' && results[active]) go(results[active]);
            }}
            placeholder="Search lessons, terms and projects"
            className="flex-1 bg-transparent py-4 text-[17px] outline-none"
            aria-label="Search"
          />
          <kbd className="hidden sm:block text-[12px] text-muted border border-line rounded-md px-1.5 py-0.5">Esc</kbd>
        </div>
        <ul className="max-h-[60vh] overflow-y-auto p-2" role="listbox">
          {q && !results.length && <li className="p-4 text-muted">No matches. Try a shorter word, like “attention” or “bias”.</li>}
          {!q && <li className="p-4 text-muted text-[15px]">Try “backprop”, “LoRA”, “Kalman”, “BM25” or “overfitting”.</li>}
          {results.map((e, i) => {
            const c = getCourse(e.course);
            const Icon = e.t === 'lesson' ? IconBook : e.t === 'term' ? IconSpark : IconTarget;
            return (
              <li key={e.t + e.id} role="option" aria-selected={i === active}>
                <button
                  type="button"
                  onMouseEnter={() => setActive(i)}
                  onClick={() => go(e)}
                  className={cx('w-full text-left flex gap-3 rounded-xl px-3 py-2.5', i === active && 'bg-accent-soft')}
                >
                  <Icon size={18} className="mt-0.5 shrink-0 text-muted" />
                  <span className="min-w-0">
                    <span className="block font-semibold truncate">{e.title}</span>
                    <span className="block text-[13px] text-muted truncate">
                      {e.t === 'lesson' ? c?.title : e.t === 'term' ? `Glossary: ${e.lead}` : `Project: ${e.lead}`}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
