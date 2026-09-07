import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Search } from 'lucide-react';
import SiteHeader from '@/components/layout/SiteHeader';
import SiteFooter from '@/components/layout/SiteFooter';
import CommandMenu from '@/components/CommandMenu';

export default function WhitepaperRack({ papers }) {
  useEffect(() => {
    const previous = document.title;
    document.title = 'Whitepapers | Systems Reading Room';
    return () => { document.title = previous; };
  }, []);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All topics');
  const [kind, setKind] = useState('All formats');
  const [commandOpen, setCommandOpen] = useState(false);
  const visible = papers.filter(p => (category === 'All topics' || category === p.category) && (kind === 'All formats' || kind === p.kind) && `${p.title} ${p.category} ${p.objective}`.toLowerCase().includes(query.trim().toLowerCase()));
  const clear = () => { setQuery(''); setCategory('All topics'); setKind('All formats'); };
  return <div className="min-h-screen bg-background text-foreground">
    <SiteHeader onOpenCommand={() => setCommandOpen(true)} />
    <main id="content" tabIndex={-1} className="mx-auto max-w-7xl px-5 sm:px-8 py-12">
      <Link className="text-sm text-muted-foreground hover:text-primary" to="/library">Library /</Link>
      <div className="grid md:grid-cols-[2fr_1fr] gap-8 border-b border-border pb-10 mt-8">
        <div><p className="text-xs uppercase tracking-[0.25em] text-primary font-semibold">The systems reading room</p><h1 className="text-5xl sm:text-7xl tracking-tight font-semibold my-5">Whitepapers<span className="text-primary">.</span></h1><p className="text-lg text-muted-foreground max-w-2xl leading-relaxed">Read the idea. Change an assumption. Observe what breaks. A collection of foundational systems papers and architecture companions, made tangible.</p></div>
        <aside className="md:border-l border-border md:pl-8 self-end"><div className="text-5xl font-mono">52<span className="text-sm text-muted-foreground ml-3">experiences</span></div><p className="text-sm text-muted-foreground mt-4 leading-relaxed">Model labs compute outcomes. Guided walkthroughs explain a fixed sequence. Legacy interactives open as standalone pages. Each card identifies its format and source.</p></aside>
      </div>
      <section aria-label="Find a paper" className="py-7 flex flex-col md:flex-row gap-3">
        <label className="relative flex-1"><Search className="absolute left-3 top-3.5 w-4 h-4 text-muted-foreground" /><span className="sr-only">Search papers</span><input className="w-full border border-border rounded-lg bg-card pl-10 pr-4 py-3" placeholder="Search papers, ideas, or systems..." value={query} onChange={e => setQuery(e.target.value)} /></label>
        <label><span className="sr-only">Topic</span><select className="w-full border border-border bg-card rounded-lg p-3" value={category} onChange={e => setCategory(e.target.value)}>{['All topics', ...new Set(papers.map(p => p.category))].map(c => <option key={c}>{c}</option>)}</select></label>
        <label><span className="sr-only">Format</span><select className="w-full border border-border bg-card rounded-lg p-3" value={kind} onChange={e => setKind(e.target.value)}>{['All formats', ...new Set(papers.map(p => p.kind))].map(c => <option key={c}>{c}</option>)}</select></label>
      </section>
      <div className="flex justify-between items-center mb-5 text-sm text-muted-foreground"><p role="status">Showing {visible.length} of {papers.length} experiences</p><button className="underline underline-offset-4" onClick={clear}>Reset filters</button></div>
      {!visible.length && <div className="py-16 text-center border rounded-xl"><h2 className="text-xl">No matching papers</h2><p className="text-muted-foreground mt-2">Try a broader idea or reset the filters.</p></div>}
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">{visible.map(p => <article key={p.id} className="flex flex-col border border-border rounded-xl bg-card p-6 hover:border-primary/50 transition-colors">
        <div className="flex justify-between gap-3 text-xs mb-6"><span className="text-primary font-semibold">{p.category}</span><span className="text-muted-foreground">{p.kind}</span></div>
        <h2 className="text-xl leading-snug font-semibold"><a href={p.contentPath} className="hover:text-primary">{p.title}</a></h2>
        <p className="text-sm text-muted-foreground leading-relaxed my-4 flex-1"><span className="font-medium text-foreground">Learn to: </span>{p.objective}</p>
        <a href={p.source} target="_blank" rel="noopener noreferrer" className="text-xs underline underline-offset-4 text-muted-foreground mb-5">{p.sourceLabel} <span className="sr-only">for {p.title} (opens in new tab)</span></a>
        <a href={p.contentPath} className="flex items-center justify-between pt-4 border-t border-border text-sm font-semibold text-primary">Open experience <ArrowUpRight size={17} /><span className="sr-only">: {p.title}</span></a>
      </article>)}</div>
    </main><SiteFooter /><CommandMenu open={commandOpen} onOpenChange={setCommandOpen} />
  </div>;
}
