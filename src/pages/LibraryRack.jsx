import React, { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, BookOpen, Layers, Search } from "lucide-react";

import CommandMenu from "@/components/CommandMenu";
import ScrollProgress from "@/components/ScrollProgress";
import SiteFooter from "@/components/layout/SiteFooter";
import SiteHeader from "@/components/layout/SiteHeader";
import Container from "@/components/layout/Container";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { libraryContent } from "@/content";

const slugify = (value) =>
  value
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

function useRackData() {
  return useMemo(() => {
    const racks = new Map();
    libraryContent.forEach((item) => {
      const key = item.category || "General";
      if (!racks.has(key)) racks.set(key, []);
      racks.get(key).push(item);
    });
    return Array.from(racks.entries()).map(([category, books]) => ({
      category,
      rackId: slugify(category),
      books,
    }));
  }, []);
}

export default function LibraryRack() {
  const { rackId } = useParams();
  const navigate = useNavigate();
  const [commandOpen, setCommandOpen] = useState(false);
  const [chapterQuery, setChapterQuery] = useState("");

  const racks = useRackData();
  const rack = racks.find((r) => r.rackId === rackId);

  const chapterItems = useMemo(() => {
    if (!rack) return [];
    return rack.books.flatMap((book, bookIndex) => {
      if (book.chapters?.length) {
        return book.chapters.map((chapter, chapterIndex) => {
          const chapterTitle =
            typeof chapter === "string" ? chapter : chapter.title;
          const chapterContentPath =
            typeof chapter === "string" ? undefined : chapter.contentPath;
          return {
            id: `${book.id}-chapter-${chapterIndex}`,
            chapterTitle,
            chapterIndex: chapterIndex + 1,
            chapterContentPath,
            book,
            bookIndex,
            totalChapters: book.chapters.length,
          };
        });
      }
      return [
        {
          id: book.id,
          chapterTitle: book.title,
          chapterIndex: bookIndex + 1,
          chapterContentPath: undefined,
          book,
          bookIndex,
          totalChapters: 1,
        },
      ];
    });
  }, [rack]);

  const filteredChapters = useMemo(() => {
    const q = chapterQuery.trim().toLowerCase();
    if (!q) return chapterItems;
    return chapterItems.filter((item) => {
      const haystack = [
        item.chapterTitle,
        item.book.title,
        item.book.category,
        ...(item.book.tags || []),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [chapterItems, chapterQuery]);

  if (!rack) {
    return (
      <div className="min-h-screen flex flex-col">
        <SiteHeader onOpenCommand={() => setCommandOpen(true)} />
        <Container className="py-20">
          <Card className="max-w-xl mx-auto">
            <CardHeader>
              <CardTitle>Rack not found</CardTitle>
              <CardDescription>
                We couldn’t find this rack. Please return to the library racks.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild>
                <Link to="/library">Back to racks</Link>
              </Button>
            </CardContent>
          </Card>
        </Container>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <ScrollProgress />
      <SiteHeader onOpenCommand={() => setCommandOpen(true)} />

      <main className="flex-1">
        <section className="border-b bg-background/80 backdrop-blur">
          <Container className="py-10 space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45 }}
              className="space-y-4"
            >
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <Layers className="h-4 w-4" />
                Rack
              </div>
              <h1 className="text-4xl font-bold tracking-tight">{rack.category}</h1>
              <p className="text-lg text-muted-foreground max-w-3xl">
                This rack contains {chapterItems.length} chapters across {rack.books.length} books.
                Pick a chapter to preview the content, then open the full book experience.
              </p>
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    value={chapterQuery}
                    onChange={(e) => setChapterQuery(e.target.value)}
                    placeholder="Search chapters, topics, or book titles..."
                    className="w-full rounded-xl border border-border bg-background px-10 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
                <Button variant="outline" onClick={() => navigate("/library")} className="gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Back to racks
                </Button>
              </div>
            </motion.div>
          </Container>
        </section>

        <Container className="py-10">
          <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
            <span>
              Showing {filteredChapters.length} of {chapterItems.length} chapters
            </span>
          </div>

          {filteredChapters.length === 0 ? (
            <Card className="max-w-xl mx-auto">
              <CardHeader>
                <CardTitle>No chapters found</CardTitle>
                <CardDescription>
                  Try a different keyword or clear the search to view all chapters.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" onClick={() => setChapterQuery("")}>
                  Clear search
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Accordion type="single" collapsible className="space-y-4">
              {filteredChapters.map((chapter) => {
                const { book } = chapter;
                const appendixMatch = chapter.chapterTitle?.match(/^Appendix\s+([A-Z])/i);
                const chapterLabel = appendixMatch
                  ? `Appendix ${appendixMatch[1]}`
                  : `Chapter ${String(chapter.chapterIndex).padStart(2, "0")}`;
                const displayTitle =
                  rack.books.length > 1 && book.chapters?.length
                    ? `${book.title} — ${chapter.chapterTitle}`
                    : chapter.chapterTitle;
                return (
                  <AccordionItem key={chapter.id} value={chapter.id} className="border rounded-xl px-4">
                    <AccordionTrigger className="py-4">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between w-full gap-3">
                        <div className="flex items-center gap-4">
                          <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                            {chapterLabel}
                          </span>
                          <span className="text-base font-semibold">{displayTitle}</span>
                        </div>
                        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                          {book.difficulty && (
                            <Badge variant="outline">{book.difficulty}</Badge>
                          )}
                          {book.readingTime && (
                            <Badge variant="outline">{book.readingTime}</Badge>
                          )}
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="grid md:grid-cols-3 gap-6 pb-4">
                        <div className="md:col-span-2 space-y-3">
                          <p className="text-sm text-muted-foreground">{book.description}</p>
                          {book.highlights?.length ? (
                            <ul className="space-y-2 text-sm text-muted-foreground">
                              {book.highlights.map((highlight) => (
                                <li key={highlight} className="flex items-start gap-2">
                                  <span className="text-primary mt-1">•</span>
                                  <span>{highlight}</span>
                                </li>
                              ))}
                            </ul>
                          ) : null}
                          {book.chapters?.length ? (
                            <div className="mt-4 text-xs text-muted-foreground">
                              Part of <span className="font-semibold text-foreground">{book.title}</span> • {book.chapters.length} chapters total
                            </div>
                          ) : null}
                          <div className="flex flex-wrap gap-2">
                            {(book.tags || []).map((tag) => (
                              <Badge key={tag} variant="secondary" className="text-[10px]">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div className="flex flex-col justify-between gap-3">
                          <div className="rounded-lg border border-border p-4 bg-muted/30">
                            <div className="text-xs uppercase tracking-wider text-muted-foreground">
                              Ready to read?
                            </div>
                            <div className="mt-2 text-sm text-muted-foreground">
                              Open this chapter in the full book experience.
                            </div>
                          </div>
                          <Button asChild className="gap-2">
                            <Link to={`/library/${book.id}?chapter=${chapter.chapterIndex}`}>
                              Open chapter
                              <BookOpen className="h-4 w-4" />
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          )}
        </Container>
      </main>

      <SiteFooter />
      <CommandMenu open={commandOpen} onOpenChange={setCommandOpen} />
    </div>
  );
}
