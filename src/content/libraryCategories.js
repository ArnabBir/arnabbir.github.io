export const categorySlug = value => value.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

export const curatedCategories = [
  ['System Design', 'Architecture, tradeoffs, and deliberate design practice.'],
  ['Whitepapers', 'Read the ideas behind influential production systems.'],
  ['Search & AI Systems', 'Retrieval, ranking, data pipelines, and intelligent systems.'],
  ['Systems Programming', 'Build a precise model of Linux processes, memory, and I/O.'],
  ['Frontend', 'Interfaces, browser fundamentals, and hands-on application design.'],
  ['Payments & Financial Infrastructure', 'Follow money movement, ledgers, and payment reliability.'],
];

export function categorySummary(items, category) {
  const books = items.filter(item => item.category === category);
  return { books: books.length, units: books.reduce((sum, item) => sum + (item.chapters?.length || 1), 0) };
}
