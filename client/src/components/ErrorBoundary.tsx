import { Component, type ReactNode } from 'react';
import { IconRefresh } from './icons';
import { btn } from './ui';

/** Catches a crash in any page so the header and footer stay usable. Layout remounts it on every navigation. */
export class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error) {
    console.error(error);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="mx-auto max-w-[640px] px-4 sm:px-6 pt-20 text-center animate-fade-up">
        <div className="mx-auto inline-flex h-20 w-20 items-center justify-center rounded-3xl bg-bad-soft text-bad text-[38px] font-bold animate-float" aria-hidden>
          !
        </div>
        <h1 className="mt-6 font-wide text-[36px] font-[780] tracking-tight">Something went wrong</h1>
        <p className="mt-3 text-muted text-lg">This page hit an unexpected error. Your progress is safe. Reload to try again, or head back home.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <button type="button" className={btn.primary} onClick={() => window.location.reload()}>
            <IconRefresh size={17} /> Reload page
          </button>
          <a href="#/" className={btn.secondary}>
            Go home
          </a>
        </div>
        <p className="mt-6 text-[13px] text-muted font-mono break-words">{this.state.error.message}</p>
      </div>
    );
  }
}
