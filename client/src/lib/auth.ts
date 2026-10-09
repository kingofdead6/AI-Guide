import { create } from 'zustand';
import { api, ApiError, tokenStore } from './api';
import { exportProgress, useProgress, type ProgressData } from './store';

export type User = { id: string; name: string; email: string; role: 'user' | 'admin'; createdAt: string; lastSeenAt: string };
export type SyncStatus = 'local' | 'saving' | 'saved' | 'offline' | 'error';

type AuthState = {
  user: User | null;
  /** True once we know whether a session exists (instantly for guests, after /me for members). */
  ready: boolean;
  sync: SyncStatus;
  syncedAt?: number;
};

const USER_KEY = 'aiguide-user';
const META_KEY = 'aiguide-sync';

const read = <T,>(k: string, fallback: T): T => {
  try {
    const v = localStorage.getItem(k);
    return v ? (JSON.parse(v) as T) : fallback;
  } catch {
    return fallback;
  }
};
const write = (k: string, v: unknown) => {
  try {
    if (v === null) localStorage.removeItem(k);
    else localStorage.setItem(k, JSON.stringify(v));
  } catch {
    /* ignore */
  }
};

/** Whose progress is in localStorage right now, and whether it has changes the server has not seen. */
type Meta = { owner: string | null; dirty: boolean };
const meta = (): Meta => read<Meta>(META_KEY, { owner: null, dirty: false });
const setMeta = (m: Partial<Meta>) => write(META_KEY, { ...meta(), ...m });

const cachedUser = tokenStore.get() ? read<User | null>(USER_KEY, null) : null;

export const useAuth = create<AuthState>()(() => ({
  user: cachedUser,
  ready: !tokenStore.get(),
  sync: 'local',
}));

const setUser = (user: User | null) => {
  write(USER_KEY, user);
  useAuth.setState({ user });
};

/* ------------------------------------------------------------------ merge */
const minT = (a?: number, b?: number) => (a && b ? Math.min(a, b) : a || b);

/** Combines two progress documents without losing anything either side has achieved. */
export function mergeProgress(a: ProgressData, b: ProgressData): ProgressData {
  const out: ProgressData = { ...a, name: a.name || b.name };
  out.lessons = { ...a.lessons };
  for (const [id, l] of Object.entries(b.lessons)) {
    const x = out.lessons[id];
    out.lessons[id] = { visitedAt: minT(x?.visitedAt, l.visitedAt), completedAt: minT(x?.completedAt, l.completedAt) };
  }
  out.quizzes = { ...a.quizzes };
  for (const [id, q] of Object.entries(b.quizzes)) {
    const x = out.quizzes[id];
    if (!x) out.quizzes[id] = q;
    else {
      const keep = Object.keys(q.results).length > Object.keys(x.results).length ? q : x;
      out.quizzes[id] = { ...keep, attempts: Math.max(x.attempts, q.attempts), best: Math.max(x.best, q.best), passedAt: minT(x.passedAt, q.passedAt) };
    }
  }
  out.exams = { ...a.exams };
  for (const [id, e] of Object.entries(b.exams)) {
    const x = out.exams[id];
    if (!x) out.exams[id] = e;
    else {
      const last = (x.last?.finishedAt ?? 0) >= (e.last?.finishedAt ?? 0) ? x.last : e.last;
      out.exams[id] = { attempts: Math.max(x.attempts, e.attempts), best: Math.max(x.best, e.best), passedAt: minT(x.passedAt, e.passedAt), last, current: x.current ?? e.current };
    }
  }
  out.code = { ...a.code };
  for (const [id, c] of Object.entries(b.code)) {
    const x = out.code[id];
    out.code[id] = { code: x?.code ?? c.code, passedAt: minT(x?.passedAt, c.passedAt) };
  }
  out.projects = { ...a.projects };
  for (const [id, ms] of Object.entries(b.projects)) {
    const x = { ...out.projects[id] };
    for (const [m, v] of Object.entries(ms)) x[m] = x[m] || v;
    out.projects[id] = x;
  }
  out.certificates = { ...a.certificates };
  for (const [k, c] of Object.entries(b.certificates)) {
    const x = out.certificates[k];
    out.certificates[k] = { issuedAt: minT(x?.issuedAt, c.issuedAt)! };
  }
  out.activity = { ...a.activity };
  for (const [d, n] of Object.entries(b.activity)) out.activity[d] = Math.max(out.activity[d] || 0, n);
  out.last = (a.last?.at ?? 0) >= (b.last?.at ?? 0) ? a.last : b.last;
  return out;
}

const hasAny = (p: ProgressData) =>
  Object.keys(p.lessons).length + Object.keys(p.quizzes).length + Object.keys(p.exams).length + Object.keys(p.code).length + Object.keys(p.projects).length > 0;

/* ------------------------------------------------------------------ sync */
let suppress = false;
let timer: ReturnType<typeof setTimeout> | undefined;
let inflight: Promise<void> | null = null;

/** Replace local progress without it counting as a new local change. */
function applyLocal(p: ProgressData) {
  suppress = true;
  try {
    useProgress.getState().importData({ ...p, theme: useProgress.getState().theme });
  } finally {
    suppress = false;
  }
}

async function push(keepalive = false): Promise<void> {
  const user = useAuth.getState().user;
  if (!user) return;
  clearTimeout(timer);
  if (inflight && !keepalive) await inflight.catch(() => {});
  useAuth.setState({ sync: 'saving' });
  const run = api<{ updatedAt: string }>('/progress', { method: 'PUT', body: { progress: exportProgress() }, keepalive })
    .then(() => {
      setMeta({ owner: user.id, dirty: false });
      useAuth.setState({ sync: 'saved', syncedAt: Date.now() });
    })
    .catch((e: unknown) => {
      if (e instanceof ApiError && e.status === 401) return void signOutLocal();
      useAuth.setState({ sync: e instanceof ApiError && e.status === 0 ? 'offline' : 'error' });
      timer = setTimeout(() => void push(), 15_000);
    });
  inflight = run;
  return run;
}

const schedule = () => {
  clearTimeout(timer);
  timer = setTimeout(() => void push(), 1200);
};

/** Fetch the account's progress and reconcile it with whatever is in this browser. */
async function pull() {
  const user = useAuth.getState().user;
  if (!user) return;
  useAuth.setState({ sync: 'saving' });
  const { progress: remote } = await api<{ progress: ProgressData | null }>('/progress');
  const m = meta();
  const local = exportProgress();
  const localIsMine = m.owner === user.id;
  const localIsGuest = m.owner === null;

  let next: ProgressData;
  let needsPush: boolean;
  if (!remote) {
    // First time this account syncs: keep this browser's progress if it is ours or a guest's.
    next = localIsMine || localIsGuest ? local : { ...local, lessons: {}, quizzes: {}, exams: {}, code: {}, projects: {}, certificates: {}, activity: {}, last: undefined, name: '' };
    needsPush = true;
  } else if (localIsMine && !m.dirty) {
    next = remote;
    needsPush = false;
  } else if ((localIsMine && m.dirty) || (localIsGuest && hasAny(local))) {
    next = mergeProgress(local, remote);
    needsPush = true;
  } else {
    next = remote;
    needsPush = false;
  }
  if (!next.name) {
    next = { ...next, name: user.name };
    needsPush = true;
  }
  applyLocal(next);
  setMeta({ owner: user.id, dirty: needsPush });
  if (needsPush) await push();
  else useAuth.setState({ sync: 'saved', syncedAt: Date.now() });
}

function signOutLocal() {
  clearTimeout(timer);
  tokenStore.set(null);
  setUser(null);
  setMeta({ owner: null, dirty: false });
  suppress = true;
  try {
    useProgress.getState().reset();
  } finally {
    suppress = false;
  }
  useAuth.setState({ sync: 'local', ready: true });
}

/* ------------------------------------------------------------------ public */
export async function login(email: string, password: string) {
  const r = await api<{ token: string; user: User }>('/auth/login', { body: { email, password } });
  tokenStore.set(r.token);
  setUser(r.user);
  useAuth.setState({ ready: true });
  await pull().catch(() => useAuth.setState({ sync: 'offline' }));
  return r.user;
}

export async function register(name: string, email: string, password: string) {
  const r = await api<{ token: string; user: User }>('/auth/register', { body: { name, email, password } });
  tokenStore.set(r.token);
  setUser(r.user);
  useAuth.setState({ ready: true });
  await pull().catch(() => useAuth.setState({ sync: 'offline' }));
  return r.user;
}

export async function logout() {
  if (meta().dirty) await push().catch(() => {});
  signOutLocal();
}

let started = false;
/** Restores the session, pulls saved progress and starts auto-saving. Call once at startup. */
export function startSync() {
  if (started) return;
  started = true;

  useProgress.subscribe(() => {
    if (suppress || !useAuth.getState().user) return;
    setMeta({ dirty: true });
    schedule();
  });

  const flush = () => {
    if (useAuth.getState().user && meta().dirty) void push(true);
  };
  window.addEventListener('pagehide', flush);
  document.addEventListener('visibilitychange', () => document.visibilityState === 'hidden' && flush());
  window.addEventListener('online', () => useAuth.getState().user && void pull().catch(() => {}));

  if (!tokenStore.get()) return;
  api<{ user: User }>('/auth/me')
    .then(({ user }) => {
      setUser(user);
      useAuth.setState({ ready: true });
      return pull();
    })
    .catch((e: unknown) => {
      if (e instanceof ApiError && e.status === 401) return signOutLocal();
      // Offline or server down: keep working locally and save when we can.
      useAuth.setState({ ready: true, sync: 'offline' });
    });
}
