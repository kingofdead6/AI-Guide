/** Thin client for the Pyodide worker: boots it once, runs code with a timeout, restarts after a hang. */
export type RunResult = { ok: boolean; stage: 'done' | 'code' | 'tests' | 'runtime' | 'timeout'; error: string; output: string };
export type RunnerState = 'idle' | 'loading' | 'ready' | 'error';

let worker: Worker | null = null;
let state: RunnerState = 'idle';
let bootError = '';
let readyPromise: Promise<void> | null = null;
let seq = 0;
const pending = new Map<number, (r: RunResult) => void>();
const listeners = new Set<(s: RunnerState) => void>();

const setState = (s: RunnerState) => {
  state = s;
  listeners.forEach((f) => f(s));
};
export const runnerState = () => state;
export const runnerError = () => bootError;
export function onRunnerState(f: (s: RunnerState) => void) {
  listeners.add(f);
  return () => listeners.delete(f);
}

function spawn() {
  setState('loading');
  worker = new Worker(new URL('./pyodide.worker.js', import.meta.url), { type: 'classic' });
  readyPromise = new Promise((resolve, reject) => {
    worker!.onmessage = (ev: MessageEvent) => {
      const m = ev.data;
      if (m.type === 'ready') {
        setState('ready');
        resolve();
      } else if (m.type === 'boot-error') {
        bootError = m.error;
        setState('error');
        reject(new Error(m.error));
      } else if (m.type === 'result') {
        pending.get(m.id)?.(m as RunResult);
        pending.delete(m.id);
      }
    };
    worker!.onerror = (e) => {
      bootError = e.message || 'The Python worker failed to start.';
      setState('error');
      reject(new Error(bootError));
    };
  });
  readyPromise.catch(() => {});
}

export function warmUp() {
  if (!worker) spawn();
  return readyPromise!;
}

export async function runPython(code: string, tests: string, packages: string[] = [], timeoutMs = 15000): Promise<RunResult> {
  if (!worker || state === 'error') spawn();
  try {
    await readyPromise;
  } catch {
    return { ok: false, stage: 'runtime', error: `Python could not load: ${bootError}. It needs an internet connection to download Pyodide from cdn.jsdelivr.net.`, output: '' };
  }
  const id = ++seq;
  return new Promise((resolve) => {
    const budget = timeoutMs + (packages.length ? 20000 : 0);
    const timer = setTimeout(() => {
      pending.delete(id);
      worker?.terminate();
      worker = null;
      setState('idle');
      resolve({ ok: false, stage: 'timeout', error: `Stopped after ${Math.round(budget / 1000)} seconds. Check for an infinite loop.`, output: '' });
    }, budget);
    pending.set(id, (r) => {
      clearTimeout(timer);
      resolve(r);
    });
    worker!.postMessage({ id, code, tests, packages });
  });
}
