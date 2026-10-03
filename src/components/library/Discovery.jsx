import React from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, BookOpen } from "lucide-react";
import { playbooks, playbookPaths } from "@/content/playbooks";
import { frontendAtlas, frontendPath } from "@/content/frontend-atlas";
import { systemDesign, systemDesignPath } from "@/content/system-design";

const experiences = [...playbooks, frontendAtlas, ...systemDesign];
const readingPaths = [systemDesignPath, ...playbookPaths, frontendPath];

export const itemFormat = item => item.id === "whitepapers" ? "Paper labs & walkthroughs" : item.format || "Interactive companion";
export const matchesLibraryItem = (item, query, format = "", topic = "", category = "") =>
  (!format || itemFormat(item) === format) && (!topic || item.tags.includes(topic)) &&
  (!category || item.category === category) &&
  [item.title, item.description, item.category, ...item.tags].join(" ").toLowerCase().includes(query.trim().toLowerCase());

export function DiscoveryFilters({ items, format, topic, category, onFormat, onTopic, onCategory, onClear }) {
  const choices = [
    ["Format", format, onFormat, [...new Set(items.map(itemFormat))]],
    ["Topic", topic, onTopic, [...new Set(items.flatMap(item => item.tags))]],
    ...(onCategory ? [["Category", category, onCategory, [...new Set(items.map(item => item.category))]]] : []),
  ];
  return <div className="flex flex-wrap items-end gap-3">
    {choices.map(([label, value, change, options]) => <label key={label} className="flex min-w-0 flex-col gap-1 text-xs font-medium flex-1 sm:flex-none">
      {label}
      <select aria-label={label} value={value} onChange={event => change(event.target.value)} className="max-w-full sm:max-w-72 rounded-lg border bg-background px-3 py-2 text-sm">
        <option value="">All {label === "Category" ? "categories" : `${label.toLowerCase()}s`}</option>
        {options.sort().map(option => <option key={option}>{option}</option>)}
      </select>
    </label>)}
    <button type="button" onClick={onClear} className="rounded-lg px-3 py-2 text-sm underline underline-offset-4">Reset filters</button>
  </div>;
}

export function ExperienceCard({ item }) {
  return <article className="flex h-full flex-col gap-4 rounded-2xl border border-border/60 bg-card p-6 transition-colors hover:border-primary/50">
    <div className="flex items-start justify-between gap-3 text-xs text-muted-foreground"><span>{itemFormat(item)}</span><BookOpen aria-hidden="true" className="h-4 w-4 shrink-0 text-primary" /></div>
    <h3 className="text-xl font-semibold leading-snug"><Link className="hover:text-primary" to={`/library/${item.id}`}>{item.title}</Link></h3>
    <p className="text-sm leading-relaxed text-muted-foreground">{item.description}</p>
    <div className="flex flex-wrap gap-2">{item.tags.map(tag => <span key={tag} className="rounded-full bg-muted px-2.5 py-1 text-xs">{tag}</span>)}</div>
    <Link to={`/library/${item.id}`} className="mt-auto flex items-center gap-2 pt-2 text-sm font-medium text-primary">Open experience <ArrowUpRight aria-hidden="true" className="h-4 w-4" /></Link>
  </article>;
}

export function FeaturedPaths({ compact = false }) {
  return <section aria-label="Suggested reading paths" className="space-y-5">
    <div><p className="text-xs font-semibold uppercase tracking-widest text-primary">Playbooks & courses · {experiences.length} experiences</p><h2 className="mt-2 text-2xl font-bold">Choose a thread. Follow it deeper.</h2>
      <p className="mt-2 text-sm text-muted-foreground">Architecture studies, system-design theory and practice, product guides, book companions, and hands-on frontend learning.</p></div>
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{readingPaths.map(path => <article key={path.title} className="rounded-2xl border bg-gradient-to-br from-primary/5 to-card p-5">
      <h3 className="font-semibold">{path.title}</h3><p className="my-3 text-sm text-muted-foreground">{path.description}</p>
      <ol className="space-y-3">{path.ids.slice(0, compact && path !== systemDesignPath ? 1 : 3).map((id, index) => <li key={id}><Link to={`/library/${id}`} className="flex gap-3 text-sm hover:text-primary"><span className="text-primary tabular-nums">0{index + 1}</span>{experiences.find(item => item.id === id).title}</Link></li>)}</ol>
    </article>)}</div>
  </section>;
}
