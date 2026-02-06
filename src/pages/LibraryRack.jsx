import React, { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, BookOpen, Layers } from "lucide-react";

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

  const racks = useRackData();
  const rack = racks.find((r) => r.rackId === rackId);

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
                This rack contains {rack.books.length} books. Each book is treated as a chapter.
                Open a chapter to preview its contents or jump directly into the full book.
              </p>
              <div className="flex items-center gap-3">
                <Button variant="outline" onClick={() => navigate("/library")} className="gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Back to racks
                </Button>
              </div>
            </motion.div>
          </Container>
        </section>

        <Container className="py-10">
          <Accordion type="single" collapsible className="space-y-4">
            {rack.books.map((book, index) => (
              <AccordionItem key={book.id} value={book.id} className="border rounded-xl px-4">
                <AccordionTrigger className="py-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between w-full gap-3">
                    <div className="flex items-center gap-4">
                      <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                        Chapter {String(index + 1).padStart(2, "0")}
                      </span>
                      <span className="text-base font-semibold">{book.title}</span>
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
                        <div className="mt-4 space-y-2">
                          <div className="text-xs uppercase tracking-wider text-muted-foreground">
                            Chapters
                          </div>
                          <div className="grid gap-2 sm:grid-cols-2">
                            {book.chapters.map((chapter, chapterIndex) => (
                              <div
                                key={`${book.id}-chapter-${chapterIndex}`}
                                className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground"
                              >
                                <span className="font-semibold text-foreground">
                                  {String(chapterIndex + 1).padStart(2, "0")}
                                </span>
                                <span className="line-clamp-1">{chapter}</span>
                              </div>
                            ))}
                          </div>
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
                          Open the full book experience with interactive content.
                        </div>
                      </div>
                      <Button asChild className="gap-2">
                        <Link to={`/library/${book.id}`}>
                          Open book
                          <BookOpen className="h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Container>
      </main>

      <SiteFooter />
      <CommandMenu open={commandOpen} onOpenChange={setCommandOpen} />
    </div>
  );
}
