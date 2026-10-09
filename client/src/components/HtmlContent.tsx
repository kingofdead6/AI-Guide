import { useEffect, useRef } from 'react';
import { mountWidget } from '../widgets/widgets';
import { cx } from './ui';

/**
 * Renders pre-built lesson HTML (math and code already rendered at build time),
 * then mounts interactive widgets and adds copy buttons to code blocks.
 */
export function HtmlContent({ html, className }: { html: string; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const cleanups: (() => void)[] = [];
    root.querySelectorAll<HTMLElement>('.widget[data-widget]').forEach((el) => {
      cleanups.push(mountWidget(el, el.dataset.widget!));
    });
    root.querySelectorAll<HTMLElement>('pre.code').forEach((pre) => {
      if (pre.querySelector('.copy-btn')) return;
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'copy-btn';
      b.textContent = 'Copy';
      b.onclick = async () => {
        const text = pre.querySelector('code')?.textContent ?? '';
        try {
          await navigator.clipboard.writeText(text);
          b.textContent = 'Copied';
        } catch {
          b.textContent = 'Select and copy';
        }
        setTimeout(() => (b.textContent = 'Copy'), 1500);
      };
      pre.appendChild(b);
    });
    return () => cleanups.forEach((f) => f());
  }, [html]);

  return <div ref={ref} className={cx('prose-lesson', className)} dangerouslySetInnerHTML={{ __html: html }} />;
}
