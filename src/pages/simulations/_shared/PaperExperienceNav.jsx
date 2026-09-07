import React from 'react';
import { Link } from 'react-router-dom';
import { paperMetadata } from '@/content/whitepapers';

export default function PaperExperienceNav({ id, children }) {
  const paper = paperMetadata.find(p => p.id === id);
  // Walkthroughs already provide the same navigation in their shared scaffold.
  if (paper?.kind !== 'Interactive demo') return children;
  return <>
    <nav id="content" tabIndex={-1} aria-label="Paper navigation" className="border-b border-border bg-background text-foreground px-5 py-4">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-sm">
        <Link className="underline underline-offset-4" to="/library/rack/whitepapers">Back to whitepapers</Link>
        <span className="text-muted-foreground">{paper.category} / illustrative interactive demo</span>
        <a className="underline underline-offset-4" href={paper.source} target="_blank" rel="noopener noreferrer">{paper.sourceLabel} (new tab)</a>
      </div>
      <p className="max-w-7xl mx-auto mt-3 text-sm text-muted-foreground">Learning objective: {paper.objective}</p>
    </nav>
    {children}
  </>;
}
