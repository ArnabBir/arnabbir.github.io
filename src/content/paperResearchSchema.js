import { z } from 'zod';

const text = z.string().min(1);
export const SourceTypeSchema = z.enum(['Research paper', 'Research article', 'Technical report', 'Standard', 'Engineering overview', 'Project documentation', 'Textbook', 'Related reference']);
export const CitationSchema = z.object({
  year: z.number().int().min(1900).max(2100),
  authors: z.array(text).min(1),
  venue: text,
  yearBasis: z.enum(['Publication', 'First arXiv submission', 'Last revision', 'Undated']),
  verifiedOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});
export const ResearchPaperSchema = CitationSchema.extend({
  id: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  title: text,
  shortTitle: text,
  category: text,
  source: z.string().url().startsWith('https://'),
  sourceType: SourceTypeSchema,
  problem: text,
  objective: text,
  ideas: z.array(text).min(2),
  tradeoffs: z.array(text).min(2),
  prerequisites: z.array(text).min(1),
  readingNotes: z.array(text).min(2),
  diagram: z.array(z.object({ label: text, detail: text })).min(3),
  exercise: z.object({ prompt: text, guidance: text }),
  glossary: z.array(z.object({ term: text, definition: text })).min(2),
  related: z.array(z.object({ id: text, reason: text })).min(2),
  artifacts: z.array(z.object({ label: text, url: z.string().url().startsWith('https://'), kind: z.enum(['Paper', 'Code', 'Publisher materials']), note: text })).min(1),
}).strict();
