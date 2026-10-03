import React from 'react';
import { Link } from 'react-router-dom';
import { allResearchGuides, guidePath } from '@/content/paperGuides';

export default function RelatedResearch({ id }) {
  const related = allResearchGuides.filter(p => p.id === id || p.related.some(link => link.id === id));
  if (!related.length) return null;
  return <aside aria-label="Related research guides" className="max-w-7xl mx-auto mt-5 border-t border-border pt-4 text-sm text-foreground">
    <p className="font-semibold mb-2">Read alongside this experience</p>
    <div className="flex flex-wrap gap-x-5 gap-y-3">{related.map(p => <Link className="text-primary underline underline-offset-4" key={p.id} to={guidePath(p)}>{p.shortTitle} ({p.year ?? 'Undated'}) · reading guide</Link>)}</div>
  </aside>;
}
