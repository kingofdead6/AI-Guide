import { useEffect, useRef, useState } from 'react';
import { correctLabel, isAnswered, typeHint } from '../lib/grade';
import type { Answer, Question } from '../lib/types';
import { IconCheck, IconX } from './icons';
import { btn, cx, Rich } from './ui';

type Props = {
  q: Question;
  n: number;
  value: Answer | undefined;
  onChange: (a: Answer) => void;
  /** undefined = not graded yet; true/false = graded result to reveal */
  result?: boolean;
  onCheck?: () => void;
};

export function QuestionCard({ q, n, value, onChange, result, onCheck }: Props) {
  const graded = result !== undefined;
  const answered = isAnswered(q, value);
  // Celebrate or shake only when the answer is checked now, not when a saved result is shown on load.
  const prev = useRef(result);
  const [flash, setFlash] = useState<'' | 'ok' | 'bad'>('');
  useEffect(() => {
    if (result === undefined) setFlash('');
    else if (prev.current === undefined) setFlash(result ? 'ok' : 'bad');
    prev.current = result;
  }, [result]);

  const optionState = (i: number) => {
    if (!graded) return 'idle';
    const isCorrect = q.type === 'single' ? q.answer === i : q.type === 'multi' ? q.answer.includes(i) : false;
    const chosen = q.type === 'single' ? value === i : Array.isArray(value) && value.includes(i);
    if (isCorrect) return chosen ? 'right' : 'missed';
    return chosen ? 'wrong' : 'idle';
  };

  return (
    <section
      className={cx(
        'rounded-2xl border bg-surface p-5 sm:p-6 transition-[border-color,box-shadow] duration-300 shadow-[var(--shadow-card)]',
        flash === 'ok' && 'animate-ok',
        flash === 'bad' && 'animate-shake',
        !graded && 'border-line',
        graded && result && 'border-ok',
        graded && !result && 'border-bad',
      )}
      aria-labelledby={`${q.id}-label`}
      data-reveal
    >
      <div className="flex items-baseline justify-between gap-3 mb-2">
        <h3 id={`${q.id}-label`} className="font-bold text-[15px]">
          Question {n}
        </h3>
        <span className="text-[13px] text-muted">{typeHint[q.type]}</span>
      </div>
      <Rich html={q.prompt} className="font-serif text-[17px] leading-relaxed" />

      <div className="mt-4">
        {(q.type === 'single' || q.type === 'multi') && (
          <div role={q.type === 'single' ? 'radiogroup' : 'group'} aria-labelledby={`${q.id}-label`} className="flex flex-col gap-2">
            {q.options.map((opt, i) => {
              const selected = q.type === 'single' ? value === i : Array.isArray(value) && value.includes(i);
              const st = optionState(i);
              return (
                <button
                  key={i}
                  type="button"
                  role={q.type === 'single' ? 'radio' : 'checkbox'}
                  aria-checked={selected}
                  disabled={graded}
                  onClick={() => {
                    if (q.type === 'single') onChange(i);
                    else {
                      const cur = Array.isArray(value) ? value : [];
                      onChange(cur.includes(i) ? cur.filter((x) => x !== i) : [...cur, i]);
                    }
                  }}
                  className={cx(
                    'group flex items-start gap-3 w-full text-left rounded-xl border px-3.5 py-3 transition-all duration-200',
                    !graded && 'active:scale-[0.99]',
                    st === 'idle' && !selected && 'border-line hover:border-accent/60 hover:bg-sunk/60 hover:translate-x-0.5',
                    st === 'idle' && selected && 'border-accent bg-accent-soft',
                    st === 'right' && 'border-ok bg-ok-soft',
                    st === 'missed' && 'border-ok border-dashed',
                    st === 'wrong' && 'border-bad bg-bad-soft',
                    graded && 'cursor-default',
                  )}
                >
                  <span
                    className={cx(
                      'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center border-2',
                      q.type === 'single' ? 'rounded-full' : 'rounded-[5px]',
                      st === 'right' || st === 'missed' ? 'border-ok text-ok' : st === 'wrong' ? 'border-bad text-bad' : selected ? 'border-accent bg-accent text-white' : 'border-line-strong',
                    )}
                    aria-hidden
                  >
                    {st === 'right' || st === 'missed' ? <IconCheck size={13} strokeWidth={3} /> : st === 'wrong' ? <IconX size={12} strokeWidth={3} /> : selected ? <IconCheck size={12} strokeWidth={3} /> : null}
                  </span>
                  <Rich html={opt} as="span" className="text-[15.5px] leading-snug" />
                </button>
              );
            })}
          </div>
        )}

        {q.type === 'tf' && (
          <div role="radiogroup" aria-labelledby={`${q.id}-label`} className="flex gap-2">
            {[true, false].map((v) => {
              const selected = value === v;
              const right = graded && q.answer === v;
              const wrong = graded && selected && q.answer !== v;
              return (
                <button
                  key={String(v)}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  disabled={graded}
                  onClick={() => onChange(v)}
                  className={cx(
                    'flex-1 sm:flex-none sm:min-w-[120px] rounded-xl border px-4 py-2.5 font-semibold transition-colors',
                    !graded && !selected && 'border-line hover:bg-sunk',
                    !graded && selected && 'border-accent bg-accent-soft text-accent-ink',
                    right && 'border-ok bg-ok-soft text-ok',
                    wrong && 'border-bad bg-bad-soft text-bad',
                    graded && !right && !wrong && 'border-line text-muted',
                  )}
                >
                  {v ? 'True' : 'False'}
                </button>
              );
            })}
          </div>
        )}

        {(q.type === 'num' || q.type === 'text') && (
          <input
            type="text"
            inputMode={q.type === 'num' ? 'decimal' : 'text'}
            autoComplete="off"
            spellCheck={false}
            aria-labelledby={`${q.id}-label`}
            placeholder={q.type === 'num' ? 'e.g. 0.25 or 1/4' : 'Your answer'}
            value={typeof value === 'string' ? value : ''}
            disabled={graded}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && answered && onCheck && !graded) onCheck();
            }}
            className={cx(
              'w-full sm:max-w-xs rounded-xl border bg-bg px-3.5 py-2.5 text-[16px] font-mono outline-none focus:border-accent',
              !graded && 'border-line-strong',
              graded && result && 'border-ok bg-ok-soft',
              graded && !result && 'border-bad bg-bad-soft',
            )}
          />
        )}
      </div>

      {onCheck && !graded && (
        <div className="mt-4">
          <button type="button" className={btn.secondary} disabled={!answered} onClick={onCheck}>
            Check answer
          </button>
        </div>
      )}

      {graded && (
        <div className={cx('mt-4 rounded-xl px-4 py-3 animate-pop', result ? 'bg-ok-soft' : 'bg-bad-soft')} role="status">
          <p className={cx('font-bold flex items-center gap-2', result ? 'text-ok' : 'text-bad')}>
            {result ? <IconCheck size={18} strokeWidth={3} /> : <IconX size={18} strokeWidth={3} />}
            {result ? 'Correct' : 'Not quite'}
          </p>
          {!result && (q.type === 'num' || q.type === 'text' || q.type === 'tf') && (
            <p className="mt-1 text-[15px]">
              Correct answer: <b className="font-mono">{correctLabel(q)}</b>
            </p>
          )}
          {!result && (q.type === 'single' || q.type === 'multi') && (
            <p className="mt-1 text-[15px]">The correct {q.type === 'multi' ? 'answers are' : 'answer is'} marked in green above.</p>
          )}
          {q.explanation && <Rich html={q.explanation} className="mt-2 text-[15px] leading-relaxed text-ink/90" />}
        </div>
      )}
    </section>
  );
}
