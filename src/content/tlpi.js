import tlpiNav from "./tlpi_nav.json";

const toChapter = (item) => ({
  title: item.title,
  contentPath: `/library/${item.href}`,
});

const toAppendix = (item) => ({
  title: `Appendix ${item.letter} - ${item.title}`,
  contentPath: `/library/${item.href}`,
});

export const tlpiChapters = tlpiNav.chapters.map(toChapter);
export const tlpiAppendices = (tlpiNav.appendices || []).map(toAppendix);
export const tlpiMeta = {
  generatedAt: tlpiNav.generatedAt,
  chapterCount: tlpiNav.chapters.length,
  appendixCount: (tlpiNav.appendices || []).length,
};
