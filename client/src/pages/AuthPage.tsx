import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { IconAward, IconCheck, IconCloudCheck, IconEye, IconEyeOff, IconFlame, IconKey, IconMail, IconUser } from '../components/icons';
import { btn, cx, useTitle } from '../components/ui';
import { login, register, useAuth } from '../lib/auth';
import { overall } from '../lib/progress';
import { useProgress } from '../lib/store';

function Field({ label, icon, children }: { label: string; icon: ReactNode; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5 text-[14px] font-semibold">
      {label}
      <span className="group relative flex items-center">
        <span className="pointer-events-none absolute left-3.5 text-muted transition-colors group-focus-within:text-accent">{icon}</span>
        {children}
      </span>
    </label>
  );
}

const input =
  'w-full rounded-xl border border-line-strong bg-bg/60 pl-11 pr-3.5 py-3 text-[16px] font-normal outline-none transition-[border-color,box-shadow] focus:border-accent focus:shadow-[0_0_0_4px_var(--glow)]';

export default function AuthPage({ mode }: { mode: 'login' | 'register' }) {
  const isLogin = mode === 'login';
  useTitle(isLogin ? 'Sign in' : 'Create your account');
  const nav = useNavigate();
  const loc = useLocation();
  const user = useAuth((s) => s.user);
  const p = useProgress();
  const o = overall(p);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const from = (loc.state as { from?: string } | null)?.from || '/';

  useEffect(() => {
    if (user && !busy) nav(from, { replace: true });
  }, [user, busy, from, nav]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setErr('');
    setBusy(true);
    try {
      if (isLogin) await login(email, password);
      else await register(name, email, password);
      nav(from, { replace: true });
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const guestHasProgress = !user && (o.lessonsDone > 0 || o.answered > 0);

  return (
    <div className="mx-auto max-w-[1100px] px-4 sm:px-6 pt-8 sm:pt-14">
      <div className="grid lg:grid-cols-[1fr_440px] gap-10 lg:gap-16 items-center">
        <div className="hidden lg:block relative">
          <div aria-hidden className="absolute -left-10 -top-10 h-40 w-40 rounded-full opacity-50 blur-2xl animate-float" style={{ background: 'var(--c4)' }} />
          <div aria-hidden className="absolute right-10 bottom-0 h-32 w-32 rounded-full opacity-40 blur-2xl animate-float" style={{ background: 'var(--c2)', animationDelay: '1.5s' }} />
          <p className="animate-fade-up text-[15px] font-semibold text-accent">The AI Guide Academy</p>
          <h1 className="animate-fade-up mt-3 font-wide text-[52px] leading-[1] font-[800] tracking-[-0.035em]" style={{ ['--d' as string]: 1 }}>
            {isLogin ? (
              <>
                Welcome <span className="text-gradient">back.</span>
              </>
            ) : (
              <>
                Keep every <span className="text-gradient">step</span> you take.
              </>
            )}
          </h1>
          <p className="animate-fade-up mt-5 text-lg text-muted max-w-md" style={{ ['--d' as string]: 2 }}>
            {isLogin ? 'Sign in to pick up exactly where you left off, on any device.' : 'A free account saves your lessons, quiz scores, exams and certificates, and syncs them everywhere you learn.'}
          </p>
          <ul className="mt-8 flex flex-col gap-4 max-w-md">
            {[
              { icon: IconCloudCheck, text: 'Progress saved automatically as you learn' },
              { icon: IconFlame, text: 'Streaks and activity that follow you across devices' },
              { icon: IconAward, text: 'Certificates kept safe in your account' },
            ].map(({ icon: Icon, text }, i) => (
              <li key={text} className="animate-fade-up flex items-center gap-3.5" style={{ ['--d' as string]: i + 3 }}>
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-surface border border-line shadow-[var(--shadow-card)]">
                  <Icon size={19} className="text-accent" />
                </span>
                <span className="text-[16px]">{text}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="animate-fade-up relative" style={{ ['--d' as string]: 1 }}>
          <div aria-hidden className="absolute -inset-1 rounded-[26px] opacity-60 blur-xl" style={{ background: 'var(--grad)' }} />
          <div className="relative rounded-3xl border border-line surface-glass p-6 sm:p-8 shadow-2xl">
            <div className="flex rounded-xl bg-sunk p-1 text-[14.5px] font-semibold" role="tablist">
              {(['login', 'register'] as const).map((m) => (
                <Link
                  key={m}
                  to={m === 'login' ? '/login' : '/register'}
                  state={loc.state}
                  replace
                  role="tab"
                  aria-selected={mode === m}
                  className={cx('flex-1 rounded-lg py-2 text-center transition-all duration-300', mode === m ? 'bg-surface shadow-sm text-ink' : 'text-muted hover:text-ink')}
                >
                  {m === 'login' ? 'Sign in' : 'Create account'}
                </Link>
              ))}
            </div>

            <h2 className="mt-6 text-[24px] font-bold lg:hidden">{isLogin ? 'Welcome back' : 'Create your account'}</h2>
            <p className="mt-1 text-muted text-[15px] lg:mt-6">{isLogin ? 'Use the email and password you registered with.' : 'It takes ten seconds. No email confirmation needed.'}</p>

            {guestHasProgress && (
              <p className="mt-4 rounded-xl border border-ok/40 bg-ok-soft px-3.5 py-2.5 text-[14px] flex gap-2 animate-pop">
                <IconCheck size={18} className="text-ok shrink-0 mt-px" strokeWidth={2.6} />
                The progress you have made in this browser ({o.lessonsDone} lessons, {o.answered} answers) will be added to your account.
              </p>
            )}

            <form className="mt-6 flex flex-col gap-4" onSubmit={submit} noValidate>
              {!isLogin && (
                <Field label="Full name" icon={<IconUser size={18} />}>
                  <input className={input} value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" placeholder="Ada Lovelace" maxLength={80} required />
                </Field>
              )}
              <Field label="Email" icon={<IconMail size={18} />}>
                <input className={input} type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" placeholder="you@example.com" required />
              </Field>
              <Field label="Password" icon={<IconKey size={18} />}>
                <input
                  className={cx(input, 'pr-11')}
                  type={show ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete={isLogin ? 'current-password' : 'new-password'}
                  placeholder={isLogin ? 'Your password' : 'At least 8 characters'}
                  minLength={isLogin ? undefined : 8}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShow((v) => !v)}
                  className="absolute right-2 h-8 w-8 inline-flex items-center justify-center rounded-lg text-muted hover:text-ink hover:bg-sunk"
                  aria-label={show ? 'Hide password' : 'Show password'}
                >
                  {show ? <IconEyeOff size={17} /> : <IconEye size={17} />}
                </button>
              </Field>
              {!isLogin && password.length > 0 && (
                <div className="flex gap-1.5 -mt-1" aria-hidden>
                  {[0, 1, 2].map((i) => {
                    const level = password.length >= 12 ? 3 : password.length >= 8 ? 2 : 1;
                    return (
                      <span
                        key={i}
                        className="h-1 flex-1 rounded-full transition-colors duration-300"
                        style={{ background: i < level ? ['var(--bad)', 'var(--warn)', 'var(--ok)'][level - 1] : 'var(--sunk)' }}
                      />
                    );
                  })}
                </div>
              )}
              {err && (
                <p role="alert" className="animate-shake rounded-xl border border-bad/40 bg-bad-soft px-3.5 py-2.5 text-[14px] text-bad font-medium">
                  {err}
                </p>
              )}
              <button type="submit" className={cx(btn.primary, 'mt-2 py-3 text-[16px]')} disabled={busy}>
                {busy ? (
                  <>
                    <span className="h-4 w-4 rounded-full border-2 border-current border-r-transparent animate-spin" /> {isLogin ? 'Signing in…' : 'Creating account…'}
                  </>
                ) : isLogin ? (
                  'Sign in'
                ) : (
                  'Create account'
                )}
              </button>
            </form>
            {!isLogin && (
              <p className="mt-4 text-center text-[13px] text-muted">
                By creating an account you agree to the{' '}
                <Link to="/terms" className="underline underline-offset-2 hover:text-ink">
                  terms of use
                </Link>{' '}
                and{' '}
                <Link to="/privacy" className="underline underline-offset-2 hover:text-ink">
                  privacy policy
                </Link>
                .
              </p>
            )}
            <p className="mt-5 text-center text-[14px] text-muted">
              {isLogin ? 'New here? ' : 'Already have an account? '}
              <Link to={isLogin ? '/register' : '/login'} state={loc.state} replace className="font-semibold text-accent hover:underline">
                {isLogin ? 'Create an account' : 'Sign in'}
              </Link>
            </p>
            <p className="mt-2 text-center text-[13px] text-muted">
              Or{' '}
              <Link to="/courses" className="underline underline-offset-2 hover:text-ink">
                keep learning without an account
              </Link>
              ; progress stays in this browser.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
