import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { IconChevronLeft, IconChevronRight, IconShuffle } from '../components/icons';
import { btn, cx, PageHeader, Rich, useTitle } from '../components/ui';
import raw from '../generated/glossary.json';
import { getLesson, seededShuffle } from '../lib/glossaryUtil';
import type { GlossaryEntry } from '../lib/types';

const terms = raw as GlossaryEntry[];

function Flashcards() {
  const [order, setOrder] = useState(() => terms.map((_, i) => i));
  const [i, setI] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const t = terms[order[i]];
  const go = (d: number) => {
    setFlipped(false);
    setI((x) => (x + d + order.length) % order.length);
  };
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      if (e.key === 'ArrowRight') go(1);
      if (e.key === 'ArrowLeft') go(-1);
      if (e.key === ' ') (e.preventDefault(), setFlipped((f) => !f));
    };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  });
  if (!t) return null;
  return (
    <div className="max-w-[640px]">
      <button
        type="button"
        onClick={() => setFlipped((f) => !f)}
        className="w-full min-h-[260px] rounded-3xl border-2 border-line bg-surface p-8 text-left flex flex-col justify-center hover:border-line-strong"
        aria-label={flipped ? 'Show term' : 'Show definition'}
      >
        {!flipped ? (
          <>
            <span className="text-[14px] text-muted">Term {i + 1} of {order.length}</span>
            <span className="mt-3 font-wide text-[34px] font-[760] tracking-tight leading-tight">{t.term}</span>
            <span className="mt-6 text-[14px] text-muted">Tap or press space to reveal the definition</span>
          </>
        ) : (
          <>
            <span className="text-[15px] font-bold">{t.term}</span>
            <Rich html={t.def} className="mt-3 font-serif text-[19px] leading-relaxed" />
          </>
        )}
      </button>
      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" className={btn.secondary} onClick={() => go(-1)} aria-label="Previous card">
          <IconChevronLeft size={18} />
        </button>
        <button type="button" className={btn.secondary} onClick={() => go(1)} aria-label="Next card">
          <IconChevronRight size={18} />
        </button>
        <button
          type="button"
          className={btn.ghost}
          onClick={() => {
            setOrder(seededShuffle(order.length, Date.now()));
            setI(0);
            setFlipped(false);
          }}
        >
          <IconShuffle size={17} /> Shuffle
        </button>
      </div>
    </div>
  );
}

export default function GlossaryPage() {
  useTitle('Glossary');
  const [params] = useSearchParams();
  const [q, setQ] = useState('');
  const [mode, setMode] = useState<'list' | 'cards'>('list');
  const focus = params.get('term');

  useEffect(() => {
    if (!focus) return;
    setMode('list');
    setTimeout(() => document.getElementById(`term-${focus}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 50);
  }, [focus]);

  const groups = useMemo(() => {
    const s = q.trim().toLowerCase();
    const list = terms.filter((t) => !s || t.term.toLowerCase().includes(s) || t.def.toLowerCase().includes(s));
    const g = new Map<string, GlossaryEntry[]>();
    for (const t of list) {
      const letter = /[a-z]/i.test(t.term[0]) ? t.term[0].toUpperCase() : '#';
      g.set(letter, [...(g.get(letter) || []), t]);
    }
    return [...g.entries()];
  }, [q]);

  return (
    <div className="mx-auto max-w-[900px] px-4 sm:px-6">
      <PageHeader title="Glossary" sub={`${terms.length} terms you will meet across the courses, each linked to the lesson that explains it.`} />
      <div className="flex flex-wrap gap-3 items-center mb-8">
        <div className="flex rounded-[10px] border border-line p-0.5" role="tablist">
          {(['list', 'cards'] as const).map((m) => (
            <button key={m} role="tab" aria-selected={mode === m} onClick={() => setMode(m)} className={cx('px-4 py-1.5 rounded-lg text-[14.5px] font-medium', mode === m && 'bg-ink text-bg')}>
              {m === 'list' ? 'List' : 'Flashcards'}
            </button>
          ))}
        </div>
        {mode === 'list' && (
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Filter terms"
            aria-label="Filter terms"
            className="flex-1 min-w-[200px] rounded-[10px] border border-line-strong bg-surface px-3 py-2 outline-none focus:border-accent"
          />
        )}
      </div>
      {mode === 'cards' ? (
        <Flashcards />
      ) : (
        <div className="flex flex-col gap-10">
          {!groups.length && <p className="text-muted">No terms match “{q}”.</p>}
          {groups.map(([letter, list]) => (
            <section key={letter}>
              <h2 className="font-wide text-[28px] font-[780] text-accent border-b border-line pb-1 mb-2">{letter}</h2>
              <dl className="divide-y divide-line">
                {list.map((t) => {
                  const hit = getLesson(t.lesson);
                  return (
                    <div key={t.term} id={`term-${t.term}`} className={cx('py-4 grid sm:grid-cols-[200px_1fr] gap-x-6 gap-y-1 scroll-mt-24', focus === t.term && 'bg-accent-soft -mx-3 px-3 rounded-xl')}>
                      <dt className="font-bold text-[16.5px]">{t.term}</dt>
                      <dd>
                        <Rich html={t.def} className="font-serif text-[17px] leading-relaxed" />
                        {hit && (
                          <Link to={`/course/${hit.course.id}/${hit.lesson.id}`} className="mt-1 inline-block text-[14px] text-accent hover:underline">
                            Learn it in {hit.lesson.title}
                          </Link>
                        )}
                      </dd>
                    </div>
                  );
                })}
              </dl>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
