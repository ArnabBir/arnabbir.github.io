import { z } from 'zod';
import { ResearchPaperSchema } from './paperResearchSchema.js';
import { researchPapers } from './paperResearch.js';
import { paperMetadata } from './whitepapers.js';
import { legacyGuideContent } from './legacyPaperResearch.js';
import { legacyPublicCopies, sourceAccessNotes } from './legacyPaperSources.js';

export const LegacyGuideSchema = ResearchPaperSchema.extend({
  year: z.number().int().min(1900).max(2100).optional(),
  demoPath: z.string().startsWith('/library/'),
  citationNote: z.string().optional(),
}).superRefine((p, ctx) => {
  if ((p.yearBasis === 'Undated') !== (p.year === undefined)) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Undated citations must omit the numeric year; dated citations require it.' });
});

export const legacyResearchPapers = Object.entries(legacyGuideContent).map(([id, content]) => {
  const p = paperMetadata.find(p => p.id === id);
  return LegacyGuideSchema.parse({
    ...content, id, title: p.citationTitle, category: p.category, objective: p.objective,
    source: p.source, sourceType: p.sourceType, authors: p.authors, year: p.year,
    yearBasis: p.yearBasis, venue: p.venue, verifiedOn: p.verifiedOn,
    demoPath: p.contentPath, citationNote: p.citationNote,
    artifacts: [{ label: p.citationTitle, url: p.source, kind: ['Research paper', 'Research article', 'Related reference'].includes(p.sourceType) ? 'Paper' : 'Publisher materials', note: [p.citationNote || 'Primary source for this editorial reading workspace; the local demo is a simplified companion.', sourceAccessNotes[p.source]].filter(Boolean).join(' ') },
      ...(legacyPublicCopies[id] ? [legacyPublicCopies[id]] : []),
      ...(p.evidenceUrl ? [{ label: 'Bibliographic evidence', url: p.evidenceUrl, kind: 'Publisher materials', note: sourceAccessNotes[p.evidenceUrl] || 'Additional institutional or publisher record used to resolve bibliographic fields.' }] : [])],
  });
});
export const allResearchGuides = [...researchPapers, ...legacyResearchPapers];
export const guideById = Object.fromEntries(allResearchGuides.map(p => [p.id, p]));
export const guidePath = p => `/library/whitepapers/${p.id}${p.demoPath ? '/research' : ''}`;
export const guideLabel = p => p.sourceType === 'Textbook' ? 'Book / chapter guide' : p.sourceType === 'Standard' ? 'Standards guide' : ['Project documentation', 'Engineering overview', 'Related reference'].includes(p.sourceType) ? 'Topic guide' : 'Research reading guide';
