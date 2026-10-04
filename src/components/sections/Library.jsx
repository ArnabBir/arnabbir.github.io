import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen } from 'lucide-react';
import Container from '@/components/layout/Container';
import SectionHeading from '@/components/layout/SectionHeading';
import { libraryContent } from '@/content';
import { categorySlug, categorySummary, curatedCategories } from '@/content/libraryCategories';

export default function Library() {
  return <section id="library" className="scroll-mt-24 py-20 sm:py-24">
    <Container>
      <div className="mb-10 flex flex-wrap items-end justify-between gap-6">
        <SectionHeading eyebrow="Engineering Library" title="Choose your next deep dive" description="Explore curated shelves, from system architecture to the Linux interfaces underneath it." />
        <Link to="/library" className="inline-flex items-center gap-2 font-medium underline underline-offset-4">Browse full library <ArrowRight size={18} /></Link>
      </div>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {curatedCategories.map(([category, description], index) => {
          const count = categorySummary(libraryContent, category);
          if (!count.books) return null;
          return <Link key={category} to={`/library/rack/${categorySlug(category)}`} className="group flex min-h-60 flex-col rounded-2xl border border-border bg-card p-7 transition-colors hover:border-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary">
            <div className="mb-7 flex items-center justify-between text-muted-foreground"><span className="font-mono text-xs">SHELF {String(index + 1).padStart(2, '0')}</span><BookOpen size={21} aria-hidden="true" /></div>
            <h3 className="mb-3 text-xl font-semibold tracking-tight">{category}</h3>
            <p className="mb-6 text-sm leading-relaxed text-muted-foreground">{description}</p>
            <div className="mt-auto flex items-center justify-between text-sm"><span>{count.units} {category === 'Whitepapers' ? 'chapters' : 'learning units'}</span><ArrowRight size={18} aria-hidden="true" /></div>
          </Link>;
        })}
      </div>
    </Container>
  </section>;
}
