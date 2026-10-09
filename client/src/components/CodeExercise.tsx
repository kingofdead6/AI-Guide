import { useEffect, useRef, useState } from 'react';
import { basicSetup, EditorView } from 'codemirror';
import { python } from '@codemirror/lang-python';
import { indentUnit } from '@codemirror/language';
import { EditorState } from '@codemirror/state';
import { keymap } from '@codemirror/view';
import { indentWithTab } from '@codemirror/commands';
import { onRunnerState, runnerState, runPython, warmUp, type RunnerState, type RunResult } from '../py/runner';
import { useProgress } from '../lib/store';
import type { Exercise } from '../lib/types';
import { IconCheck, IconCode, IconPlay, IconRefresh, IconX } from './icons';
import { btn, cx, Rich } from './ui';

const editorTheme = EditorView.theme({
  '&': { fontSize: '13.5px', backgroundColor: 'var(--code-bg)', color: '#e6edf3', borderRadius: '12px' },
  '.cm-content': { fontFamily: 'var(--font-mono)', caretColor: '#fff', padding: '12px 0' },
  '.cm-gutters': { backgroundColor: 'transparent', color: '#6e7a91', border: 'none' },
  '.cm-activeLine, .cm-activeLineGutter': { backgroundColor: 'rgba(255,255,255,0.04)' },
  '&.cm-focused': { outline: '2px solid var(--accent)' },
  '.cm-selectionBackground, &.cm-focused .cm-selectionBackground, ::selection': { backgroundColor: 'rgba(125,155,255,0.3) !important' },
  '.cm-cursor': { borderLeftColor: '#fff' },
  '.cm-scroller': { overflow: 'auto', maxHeight: '420px' },
}, { dark: true });

function Editor({ value, onChange, label }: { value: string; onChange: (v: string) => void; label: string }) {
  const host = useRef<HTMLDivElement>(null);
  const view = useRef<EditorView | null>(null);
  const cb = useRef(onChange);
  cb.current = onChange;

  useEffect(() => {
    view.current = new EditorView({
      parent: host.current!,
      state: EditorState.create({
        doc: value,
        extensions: [
          basicSetup,
          python(),
          indentUnit.of('    '),
          keymap.of([indentWithTab]),
          editorTheme,
          EditorView.contentAttributes.of({ 'aria-label': label }),
          EditorView.updateListener.of((u) => u.docChanged && cb.current(u.state.doc.toString())),
        ],
      }),
    });
    return () => view.current?.destroy();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Replace the document when the value is reset from outside (reset / show solution).
  useEffect(() => {
    const v = view.current;
    if (v && v.state.doc.toString() !== value) v.dispatch({ changes: { from: 0, to: v.state.doc.length, insert: value } });
  }, [value]);

  return <div ref={host} />;
}

export default function CodeExercise({ ex, n }: { ex: Exercise; n: number }) {
  const saved = useProgress((s) => s.code[ex.id]);
  const { saveCode, codePassed } = useProgress.getState();
  const [code, setCode] = useState(saved?.code ?? ex.starter);
  const [result, setResult] = useState<RunResult | null>(null);
  const [running, setRunning] = useState(false);
  const [rt, setRt] = useState<RunnerState>(runnerState());
  const [showSolution, setShowSolution] = useState(false);

  useEffect(() => onRunnerState(setRt) as unknown as () => void, []);
  useEffect(() => {
    const t = setTimeout(() => saveCode(ex.id, code), 400);
    return () => clearTimeout(t);
  }, [code, ex.id, saveCode]);

  const run = async () => {
    setRunning(true);
    setResult(null);
    const r = await runPython(code, ex.tests, ex.packages);
    setResult(r);
    setRunning(false);
    if (r.ok) codePassed(ex.id);
  };

  return (
    <section className="rounded-2xl border border-line bg-surface p-5 sm:p-6" aria-labelledby={`${ex.id}-t`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 id={`${ex.id}-t`} className="font-bold text-[17px] flex items-center gap-2">
          <IconCode size={18} className="text-c4" /> Exercise {n}: {ex.title}
        </h3>
        {saved?.passedAt && (
          <span className="inline-flex items-center gap-1 text-ok text-sm font-semibold">
            <IconCheck size={16} strokeWidth={3} /> Solved
          </span>
        )}
      </div>
      <Rich html={ex.prompt} className="mt-2 font-serif text-[16.5px] leading-relaxed" />
      {ex.packages.length > 0 && <p className="mt-2 text-[13px] text-muted">Uses {ex.packages.join(', ')} (downloaded on first run).</p>}

      <div className="mt-4" onFocus={() => rt === 'idle' && warmUp().catch(() => {})}>
        <Editor value={code} onChange={setCode} label={`Code editor for ${ex.title}`} />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button type="button" className={btn.primary} onClick={run} disabled={running}>
          <IconPlay size={16} /> {running ? (rt === 'loading' ? 'Loading Python…' : 'Running…') : 'Run tests'}
        </button>
        <button type="button" className={btn.ghost} onClick={() => setCode(ex.starter)}>
          <IconRefresh size={16} /> Reset
        </button>
        <button type="button" className={btn.ghost} onClick={() => setShowSolution((v) => !v)}>
          {showSolution ? 'Hide solution' : 'Show solution'}
        </button>
        {rt === 'loading' && !running && <span className="text-[13px] text-muted">Preparing Python in your browser…</span>}
      </div>

      {result && (
        <div className={cx('mt-4 rounded-xl px-4 py-3 animate-pop', result.ok ? 'bg-ok-soft' : 'bg-bad-soft')} role="status">
          <p className={cx('font-bold flex items-center gap-2', result.ok ? 'text-ok' : 'text-bad')}>
            {result.ok ? <IconCheck size={18} strokeWidth={3} /> : <IconX size={18} strokeWidth={3} />}
            {result.ok
              ? 'All tests passed'
              : result.stage === 'code'
                ? 'Your code raised an error'
                : result.stage === 'tests'
                  ? 'A test failed'
                  : result.stage === 'timeout'
                    ? 'Timed out'
                    : 'Could not run'}
          </p>
          {result.error && <pre className="mt-2 whitespace-pre-wrap font-mono text-[12.5px] leading-relaxed">{result.error}</pre>}
          {result.output && (
            <details className="mt-2">
              <summary className="cursor-pointer text-[13px] font-semibold">Printed output</summary>
              <pre className="mt-1 whitespace-pre-wrap font-mono text-[12.5px]">{result.output}</pre>
            </details>
          )}
        </div>
      )}

      {showSolution && (
        <div className="mt-4">
          <p className="text-[13px] text-muted mb-2">One possible solution. Try to finish your own version first.</p>
          <pre className="code">
            <code>{ex.solution}</code>
          </pre>
          <button type="button" className={cx(btn.ghost, 'mt-2')} onClick={() => setCode(ex.solution)}>
            Load into editor
          </button>
        </div>
      )}
    </section>
  );
}
