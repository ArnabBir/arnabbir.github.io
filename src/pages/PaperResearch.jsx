import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, BookOpen, Download } from 'lucide-react';
import SiteHeader from '@/components/layout/SiteHeader';
import SiteFooter from '@/components/layout/SiteFooter';
import CommandMenu from '@/components/CommandMenu';
import { learningPaths } from '@/content/paperResearch';
import { guideById as researchById, allResearchGuides as researchPapers, guidePath, guideLabel } from '@/content/paperGuides';
import { legacyPublicCopies, sourceAccessNotes } from '@/content/legacyPaperSources';
import { paperById } from '@/content/whitepapers';
import { researchWorksheet } from '@/content/paperCatalogTools';
import './paper-research.css';

const sections = [['problem', 'The problem'], ['mechanism', 'Mental model'], ['tradeoffs', 'Assumptions'], ['reading', 'Reading plan'], ['practice', 'Think it through'], ['compare', 'Compare'], ['artifacts', 'Sources & artifacts'], ['notes', 'Your notebook']];
const External = ({ href, children, ...props }) => <a href={href} target="_blank" rel="noopener noreferrer" {...props}>{children}<ArrowUpRight size={15} aria-hidden="true" /><span className="sr-only"> (opens in a new tab)</span></a>;
const List = ({ items }) => <ul className="research-list">{items.map(item => <li key={item}>{item}</li>)}</ul>;

export default function PaperResearch({ id }) {
  const paper = researchById[id];
  const storageKey = `paper-notebook:v1:${id}`;
  const [commandOpen, setCommandOpen] = useState(false);
  const [compareId, setCompareId] = useState('');
  const [notes, setNotes] = useState(() => {
    try { return localStorage.getItem(storageKey) || ''; }
    catch { return ''; }
  });
  const [storageStatus, setStorageStatus] = useState('Notes stay in this browser.');
  useEffect(() => {
    const previous = document.title;
    document.title = `${paper.shortTitle} | Research Reading Room`;
    try { localStorage.getItem(storageKey); }
    catch { setStorageStatus('Browser storage unavailable. Export notes before leaving.'); }
    return () => { document.title = previous; };
  }, [paper, storageKey]);
  const saveNotes = value => {
    setNotes(value);
    try { localStorage.setItem(storageKey, value); setStorageStatus('Saved in this browser.'); }
    catch { setStorageStatus('Could not save locally. Export notes before leaving.'); }
  };
  const exportNotes = () => {
    const url = URL.createObjectURL(new Blob([researchWorksheet(paper, notes)], { type: 'text/markdown;charset=utf-8' }));
    const anchor = document.createElement('a');
    anchor.href = url; anchor.download = `${paper.id}-reading-notes.md`; anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const comparison = researchById[compareId];
  const paths = learningPaths.filter(path => path.ids.includes(id));
  const publicCopy = legacyPublicCopies[id];
  const comparisonGroups = [...new Set(researchPapers.map(p => p.category))].sort();
  const catalogIndex = Object.keys(paperById).indexOf(id);
  const adjacent = [Object.values(paperById)[catalogIndex - 1], Object.values(paperById)[catalogIndex + 1]];
  return <div className="min-h-screen bg-background text-foreground">
    <SiteHeader onOpenCommand={() => setCommandOpen(true)} />
    <main id="content" tabIndex={-1} className="research-page">
      <Link to="/library/rack/whitepapers" className="research-back">Library / Whitepapers /</Link>
      <header className="research-hero">
        <div className="research-eyebrow"><BookOpen size={16} aria-hidden="true" /> {paper.category} <span>/</span> {guideLabel(paper)}</div>
        <h1>{paper.shortTitle}</h1>
        <p className="research-subtitle">{paper.title}</p>
        <div className="research-meta"><span>{paper.year ?? 'Undated'}</span><span>{paper.venue}</span><span>{paper.sourceType}</span></div>
        <p className="research-muted">{paper.yearBasis === 'Undated' ? 'Living source; no publication year is asserted.' : paper.yearBasis === 'Last revision' ? 'Year refers to the stated source revision.' : paper.yearBasis === 'First arXiv submission' ? 'Year is the first arXiv submission, not a claimed conference publication date.' : 'Year refers to the cited publication.'}</p>
        {paper.citationNote && <p className="research-muted">{paper.citationNote}</p>}
        <details className="research-authors"><summary>Attribution · {paper.authors[0]}{paper.authors.length > 1 ? ` and ${paper.authors.length - 1} collaborators` : ''}</summary><p>{paper.authors.join(', ')}</p></details>
        <div className="research-actions"><External href={paper.source} className="research-button primary">Read original source</External>{publicCopy && <External href={publicCopy.url} className="research-button">Read verified public copy</External>}{paper.demoPath && <a className="research-button" href={paper.demoPath}>Open original interactive experience</a>}<a href="#practice" className="research-button">Try the reading exercise</a></div>
        {sourceAccessNotes[paper.source] && <p className="research-access-note">{sourceAccessNotes[paper.source]} {publicCopy && 'Use the verified public copy above for reading.'}</p>}
        <p className="research-disclosure">An editorial study workspace with original conceptual diagrams. This is a reading guide, not an executable simulation. Bibliographic record checked {paper.verifiedOn}; access observations appear with the sources.</p>
      </header>
      <div className="research-layout">
        <aside className="research-sidebar"><nav aria-label="On this page"><p className="research-eyebrow">Reading desk</p>{sections.map(([anchor, label], index) => <a key={anchor} href={`#${anchor}`}><span>{String(index + 1).padStart(2, '0')}</span>{label}</a>)}</nav>
          <div className="research-prerequisites"><h2>Before you begin</h2><List items={paper.prerequisites} /></div>
        </aside>
        <div className="research-body">
          <section id="problem"><p className="research-eyebrow">01 / Motivation</p><h2>The problem worth solving</h2><p className="research-lead">{paper.problem}</p><div className="research-callout"><strong>Leave able to</strong><p>{paper.objective}</p></div></section>
          <section id="mechanism"><p className="research-eyebrow">02 / Mechanism</p><h2>A mental model</h2><List items={paper.ideas} />
            <figure className="research-figure" aria-labelledby="concept-caption"><ol aria-label={`${paper.shortTitle} conceptual sequence`}>{paper.diagram.map((node, i) => <li key={node.label}><span className="research-node-index" aria-hidden="true">{i + 1}</span><strong>{node.label}</strong><p>{node.detail}</p>{i < paper.diagram.length - 1 && <span className="research-arrow" aria-hidden="true">→</span>}</li>)}</ol><figcaption id="concept-caption">Conceptual sequence drawn for this guide. Simplified relationships, not a reproduction of a paper figure or a complete implementation.</figcaption></figure>
          </section>
          <section id="tradeoffs"><p className="research-eyebrow">03 / Boundaries</p><h2>What the idea asks you to assume</h2><List items={paper.tradeoffs} /></section>
          <section id="reading"><p className="research-eyebrow">04 / Read with intent</p><h2>Take two passes through the source</h2><p>First identify the contract and mechanism. Then inspect assumptions and evaluation conditions.</p><List items={paper.readingNotes} /><div className="research-glossary">{paper.glossary.map(entry => <dl key={entry.term}><dt>{entry.term}</dt><dd>{entry.definition}</dd></dl>)}</div></section>
          <section id="practice"><p className="research-eyebrow">05 / Active reading</p><h2>Think it through</h2><div className="research-exercise"><p>{paper.exercise.prompt}</p><details><summary>Reveal reasoning guidance</summary><p>{paper.exercise.guidance}</p></details></div><p className="research-muted">Write your prediction in the notebook below before revealing the guidance. Numerical exercises are illustrative, not paper benchmark reproductions.</p></section>
          <section id="compare"><p className="research-eyebrow">06 / Connect ideas</p><h2>Read beside another design</h2><div className="research-related">{paper.related.map(link => { const other = paperById[link.id]; return <a href={other.researchPath || other.contentPath} key={link.id}><span>{other.researchPath ? 'Reading guide + original experience' : other.kind}</span><h3>{researchById[link.id]?.shortTitle || other.title} <ArrowUpRight size={16} aria-hidden="true" /></h3><p>{link.reason}</p></a>; })}</div>
            <label className="research-compare-label">Compare research guides<select value={compareId} onChange={event => setCompareId(event.target.value)}><option value="">Choose another source</option>{comparisonGroups.map(category => <optgroup key={category} label={category}>{researchPapers.filter(p => p.id !== id && p.category === category).sort((a, b) => a.shortTitle.localeCompare(b.shortTitle)).map(p => <option key={p.id} value={p.id}>{p.shortTitle} ({p.year ?? 'Undated'})</option>)}</optgroup>)}</select></label>
            {comparison && <div className="research-comparison" aria-live="polite">{[paper, comparison].map(p => <article key={p.id}><h3><Link to={guidePath(p)}>{p.shortTitle}</Link></h3><p className="research-muted">{p.year ?? 'Undated'} · {p.category}</p><h4>Problem</h4><p>{p.problem}</p><h4>Design move</h4><p>{p.ideas[0]}</p><h4>Boundary</h4><p>{p.tradeoffs[0]}</p></article>)}</div>}
            {paths.length > 0 && <div className="research-path-links"><h3>Continue a learning path</h3>{paths.map(path => <Link key={path.id} to={`/library/rack/whitepapers?path=${path.id}`}>{path.title} →</Link>)}</div>}
          </section>
          <section id="artifacts"><p className="research-eyebrow">07 / Evidence shelf</p><h2>Sources & artifacts</h2><p>Primary citations were checked for title, authors, and date. Code links identify project ownership and purpose; linked software was not installed or benchmarked for this guide.</p><div className="research-artifacts">{paper.artifacts.map(artifact => <article key={artifact.url}><span>{artifact.kind}</span><External href={artifact.url}>{artifact.label}</External><p>{artifact.note}</p><small>{new URL(artifact.url).hostname}</small></article>)}</div></section>
          <section id="notes"><p className="research-eyebrow">08 / Your notebook</p><h2>Turn reading into an argument</h2><label htmlFor="paper-notes">What is the invariant? Which assumption is weakest? What would you measure?</label><textarea id="paper-notes" rows={8} maxLength={50000} value={notes} onChange={event => saveNotes(event.target.value)} placeholder="Capture a counterexample, a question for a teammate, or an experiment you want to run..." /><div className="research-notes-footer"><p role="status">{storageStatus} No server sync.</p><button className="research-button" onClick={exportNotes}><Download size={16} aria-hidden="true" /> Export worksheet</button></div></section>
        </div>
      </div>
      <nav className="research-pagination" aria-label="Adjacent reading workspaces">{adjacent.map((entry, index) => entry && <Link key={entry.id} to={guidePath(researchById[entry.id])}><span>{index === 0 ? '← Previous in collection' : 'Next in collection →'}</span><strong>{researchById[entry.id].shortTitle}</strong></Link>)}</nav>
    </main><SiteFooter /><CommandMenu open={commandOpen} onOpenChange={setCommandOpen} />
  </div>;
}
