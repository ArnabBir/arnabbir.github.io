import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowUpRight, Search } from 'lucide-react';
import SiteHeader from '@/components/layout/SiteHeader';
import SiteFooter from '@/components/layout/SiteFooter';
import CommandMenu from '@/components/CommandMenu';
import { learningPaths } from '@/content/paperResearch';
import { allResearchGuides } from '@/content/paperGuides';
import { filterPapers } from '@/content/paperCatalogTools';

export default function WhitepaperRack({ papers }) {
  useEffect(() => {
    const previous = document.title;
    document.title = 'Whitepapers | Systems Reading Room';
    return () => { document.title = previous; };
  }, []);
  const [params, setParams] = useSearchParams();
  const query = params.get('q') || '';
  const category = params.get('topic') || '';
  const kind = params.get('format') || '';
  const sourceType = params.get('source') || '';
  const sort = params.get('sort') || 'curated';
  const path = learningPaths.find(item => item.id === params.get('path'));
  const [commandOpen, setCommandOpen] = useState(false);
  const visible = filterPapers(papers, { query, category, kind, sourceType, sort, ids: path?.ids });
  const update = (key, value) => setParams(previous => { const next = new URLSearchParams(previous); if (value) next.set(key, value); else next.delete(key); return next; }, { replace: true });
  const clear = () => setParams({});
  const selectPath = id => setParams(id ? { path: id } : {});
  return <div className="min-h-screen bg-background text-foreground">
    <SiteHeader onOpenCommand={() => setCommandOpen(true)} />
    <main id="content" tabIndex={-1} className="mx-auto max-w-7xl px-5 sm:px-8 py-12">
      <Link className="text-sm text-muted-foreground hover:text-primary" to="/library">Library /</Link>
      <div className="grid md:grid-cols-[2fr_1fr] gap-8 border-b border-border pb-10 mt-8">
        <div><p className="text-xs uppercase tracking-[0.25em] text-primary font-semibold">The systems reading room</p><h1 className="text-5xl sm:text-7xl tracking-tight font-semibold my-5">Whitepapers<span className="text-primary">.</span></h1><p className="text-lg text-muted-foreground max-w-2xl leading-relaxed">Read the idea. Change an assumption. Observe what breaks. A collection of foundational systems papers and architecture companions, made tangible.</p></div>
        <aside className="md:border-l border-border md:pl-8 self-end"><div className="text-5xl font-mono">{papers.length}<span className="text-sm text-muted-foreground ml-3">curated entries</span></div><p className="text-sm text-muted-foreground mt-4 leading-relaxed">{allResearchGuides.length} source-backed reading workspaces, one for every entry, including {papers.filter(p => p.researchPath).length} companions to original experiences. {papers.filter(p => p.kind === 'Model lab').length} computed model labs, plus Bloom and Gorilla experiments. Original papers, standards, books, and topic guides are labeled separately.</p><a href="#paper-results" onClick={() => setParams({ format: 'Model lab' })} className="inline-block text-sm text-primary underline underline-offset-4 mt-4">Explore the model labs →</a></aside>
      </div>
      <section aria-labelledby="learning-paths" className="py-8 border-b border-border"><div className="flex flex-wrap justify-between items-baseline gap-3 mb-4"><h2 id="learning-paths" className="text-xl font-semibold">Follow an idea across papers</h2><span className="text-xs text-muted-foreground">Six editorial reading paths</span></div><div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">{learningPaths.map(item => <button key={item.id} aria-pressed={path?.id === item.id} onClick={() => selectPath(path?.id === item.id ? '' : item.id)} className={`text-left border rounded-xl p-4 transition-colors ${path?.id === item.id ? 'border-primary bg-primary/5' : 'border-border bg-card hover:border-primary/50'}`}><span className="block text-xs text-primary mb-2">{item.ids.length} stops</span><span className="block text-sm font-semibold">{item.title}</span><span className="block text-xs leading-relaxed text-muted-foreground mt-2">{item.question}</span></button>)}</div></section>
      <section aria-label="Find a paper" className="py-7 space-y-3">
        <label className="relative block"><Search className="absolute left-3 top-3.5 w-4 h-4 text-muted-foreground" aria-hidden="true" /><span className="sr-only">Search papers</span><input className="w-full border border-border rounded-lg bg-card pl-10 pr-4 py-3" placeholder="Search titles, authors, years, or ideas..." value={query} onChange={e => update('q', e.target.value)} /></label>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <label className="text-xs text-muted-foreground">Topic<select aria-label="Topic" className="w-full border border-border bg-card text-foreground rounded-lg p-3 mt-1" value={category} onChange={e => update('topic', e.target.value)}><option value="">All topics</option>{[...new Set(papers.map(p => p.category))].map(c => <option key={c}>{c}</option>)}</select></label>
          <label className="text-xs text-muted-foreground">Format<select aria-label="Format" className="w-full border border-border bg-card text-foreground rounded-lg p-3 mt-1" value={kind} onChange={e => update('format', e.target.value)}><option value="">All formats</option>{[...new Set(papers.map(p => p.kind))].map(c => <option key={c}>{c}</option>)}</select></label>
          <label className="text-xs text-muted-foreground">Source type<select aria-label="Source type" className="w-full border border-border bg-card text-foreground rounded-lg p-3 mt-1" value={sourceType} onChange={e => update('source', e.target.value)}><option value="">All source types</option>{[...new Set(papers.map(p => p.sourceType))].map(c => <option key={c}>{c}</option>)}</select></label>
          <label className="text-xs text-muted-foreground">Sort<select aria-label="Sort" className="w-full border border-border bg-card text-foreground rounded-lg p-3 mt-1" value={sort} onChange={e => update('sort', e.target.value)}><option value="curated">{path ? 'Learning path order' : 'Curated order'}</option><option value="newest">Publication: newest first</option><option value="oldest">Publication: oldest first</option><option value="title">Title: A to Z</option></select></label>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">Dates describe the cited edition. arXiv entries use first-submission years when labeled. Unverified publication dates sort last. Filters are saved in the page URL.</p>
      </section>
      {path && <div className="border-l-2 border-primary pl-4 mb-6"><h2 className="font-semibold">{path.title}</h2><p className="text-sm text-muted-foreground mt-1">{path.question} Follow the numbered stops in order, or narrow this path with the filters.</p></div>}
      <div id="paper-results" className="flex justify-between items-center gap-4 mb-5 text-sm text-muted-foreground scroll-mt-24"><p role="status">Showing {visible.length} of {papers.length} entries</p><button className="underline underline-offset-4" onClick={clear}>Reset filters</button></div>
      {!visible.length && <div className="py-16 text-center border rounded-xl"><h2 className="text-xl">No matching papers</h2><p className="text-muted-foreground mt-2">Try a broader idea or reset the filters.</p></div>}
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">{visible.map(p => <article key={p.id} className="flex flex-col border border-border rounded-xl bg-card p-6 hover:border-primary/50 transition-colors">
        <div className="flex justify-between gap-3 text-xs mb-6"><span className="text-primary font-semibold">{p.category}</span><span className="text-muted-foreground">{p.kind}</span></div>
        {path && <p className="text-xs font-mono text-primary mb-2">Stop {path.ids.indexOf(p.id) + 1} / {path.ids.length}</p>}
        <h2 className="text-xl leading-snug font-semibold"><a href={p.contentPath} className="hover:text-primary">{p.title}</a></h2>
        <p className="text-xs text-muted-foreground mt-3 leading-relaxed">{p.year ? `${p.year} · ${p.venue}` : p.verifiedOn ? `Undated · ${p.venue}` : 'Publication metadata not yet curated'}<br />{p.sourceType}{p.yearBasis === 'First arXiv submission' ? ' · First arXiv submission' : p.yearBasis === 'Last revision' ? ' · Revision year' : ''}</p>
        {p.citationTitle && <details className="text-xs text-muted-foreground mt-3"><summary>Citation details{p.citationStatus === 'Partial' ? ' (partial)' : ''}</summary><p className="mt-2">{p.citationTitle}</p><p className="mt-2">{p.authors?.join(', ')}</p>{p.citationNote && <p className="mt-2">{p.citationNote}</p>}{p.evidenceUrl && <a className="underline" href={p.evidenceUrl} target="_blank" rel="noopener noreferrer">Bibliographic evidence</a>}</details>}
        <p className="text-sm text-muted-foreground leading-relaxed my-4 flex-1"><span className="font-medium text-foreground">Learn to: </span>{p.objective}</p>
        <a href={p.source} target="_blank" rel="noopener noreferrer" className="text-xs underline underline-offset-4 text-muted-foreground mb-5">{p.sourceLabel} <span className="sr-only">for {p.title} (opens in new tab)</span></a>
        <a href={p.contentPath} className="flex items-center justify-between pt-4 border-t border-border text-sm font-semibold text-primary">{p.kind === 'Reading guide' ? 'Open research guide' : 'Open experience'} <ArrowUpRight size={17} aria-hidden="true" /><span className="sr-only">: {p.title}</span></a>
        {p.researchPath && <a href={p.researchPath} className="text-sm font-semibold text-primary underline mt-3">Open research workspace<span className="sr-only">: {p.title}</span></a>}
      </article>)}</div>
    </main><SiteFooter /><CommandMenu open={commandOpen} onOpenChange={setCommandOpen} />
  </div>;
}
