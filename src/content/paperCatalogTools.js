export function filterPapers(papers, { query = '', category = '', kind = '', sourceType = '', sort = 'curated', ids } = {}) {
  const words = query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  const visible = papers.filter(p => (!category || p.category === category)
    && (!kind || p.kind === kind) && (!sourceType || p.sourceType === sourceType) && (!ids || ids.includes(p.id))
    && words.every(word => [p.title, p.citationTitle, p.id, p.category, p.objective, p.venue, p.year, p.sourceType, ...(p.authors || [])].join(' ').toLocaleLowerCase().includes(word)));
  if (sort === 'newest' || sort === 'oldest') visible.sort((a, b) => {
    if (!a.year || !b.year) return Number(!a.year) - Number(!b.year);
    return (sort === 'newest' ? b.year - a.year : a.year - b.year) || a.title.localeCompare(b.title);
  });
  else if (sort === 'title') visible.sort((a, b) => a.title.localeCompare(b.title));
  else if (ids) visible.sort((a, b) => ids.indexOf(a.id) - ids.indexOf(b.id));
  return visible;
}

export function researchWorksheet(paper, notes) {
  paper = { ...paper, year: paper.year ?? 'Undated' };
  const context = [
    `Source type: ${paper.sourceType}`,
    ...(paper.citationNote ? [`Citation note: ${paper.citationNote}`] : []),
    ...(paper.demoPath ? [`Original interactive experience: ${paper.demoPath}`] : []),
  ].join('\n');
  return `# ${paper.title}\n\n${paper.authors.join(', ')}\n${paper.venue}, ${paper.year} (${paper.yearBasis})\n${paper.source}\nBibliographic record checked: ${paper.verifiedOn}\n${context}\n\n## Learning objective\n${paper.objective}\n\n## Problem\n${paper.problem}\n\n## Before reading\n${paper.prerequisites.map(x => `- ${x}`).join('\n')}\n\n## Key ideas\n${paper.ideas.map(x => `- ${x}`).join('\n')}\n\n## Conceptual sequence\n${paper.diagram.map((x, i) => `${i + 1}. ${x.label}: ${x.detail}`).join('\n')}\n\n## Tradeoffs and assumptions\n${paper.tradeoffs.map(x => `- ${x}`).join('\n')}\n\n## Reading notes\n${paper.readingNotes.map(x => `- ${x}`).join('\n')}\n\n## Glossary\n${paper.glossary.map(x => `- **${x.term}:** ${x.definition}`).join('\n')}\n\n## Exercise\n${paper.exercise.prompt}\n\n## My notes\n${notes || '(No notes yet)'}\n\n## Reasoning guidance\n${paper.exercise.guidance}\n\n## Artifacts\n${paper.artifacts.map(a => `- [${a.label}](${a.url}): ${a.note}`).join('\n')}\n\nEditorial study guide, not the original paper or an executable simulation.\n`;
}
