import { useEffect, useState } from 'react';
import { HtmlContent } from '../components/HtmlContent';
import { PageHeader, useTitle } from '../components/ui';
import { loadPageHtml } from '../lib/catalog';

const PAGES: Record<string, { title: string; sub: string }> = {
  start: { title: 'How this academy works', sub: 'How the courses fit together, how to study them, and the notation used everywhere.' },
  cheatsheet: { title: 'Equation cheat sheet', sub: 'If you can explain where each of these comes from, you understand the core of modern AI.' },
  resources: { title: 'Books, courses and papers', sub: 'Well-established material for going deeper. Most of the books are free from their authors.' },
};

export default function StaticPage({ name }: { name: keyof typeof PAGES }) {
  const meta = PAGES[name];
  const [html, setHtml] = useState<string | null>(null);
  useTitle(meta.title);
  useEffect(() => {
    setHtml(null);
    loadPageHtml(name).then((h) => setHtml(h.replace(/^\s*<p class="lead">[\s\S]*?<\/p>/, '')));
  }, [name]);
  return (
    <div className="mx-auto max-w-[860px] px-4 sm:px-6">
      <PageHeader title={meta.title} sub={meta.sub} />
      {html === null ? <div className="h-64 rounded-2xl bg-sunk animate-pulse" /> : <HtmlContent html={html} />}
    </div>
  );
}
