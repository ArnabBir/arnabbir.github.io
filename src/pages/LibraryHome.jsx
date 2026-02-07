import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { BookOpen, Search, Layers, ArrowRight, Library } from "lucide-react";

import CommandMenu from "@/components/CommandMenu";
import ScrollProgress from "@/components/ScrollProgress";
import SiteFooter from "@/components/layout/SiteFooter";
import SiteHeader from "@/components/layout/SiteHeader";
import Container from "@/components/layout/Container";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { libraryContent } from "@/content";

const gradients = [
  "from-orange-500 via-amber-500 to-yellow-500",
  "from-blue-500 via-indigo-500 to-purple-500",
  "from-emerald-500 via-teal-500 to-cyan-500",
  "from-pink-500 via-rose-500 to-red-500",
  "from-slate-500 via-gray-500 to-zinc-500",
];

const slugify = (value) =>
  value
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

function useCategoryRacks(items) {
  return useMemo(() => {
    const racks = new Map();
    items.forEach((item) => {
      const key = item.category || "General";
      if (!racks.has(key)) racks.set(key, []);
      racks.get(key).push(item);
    });
    return Array.from(racks.entries()).map(([category, books]) => ({
      category,
      rackId: slugify(category),
      books,
      bookCount: books.length,
      chapterCount: books.reduce(
        (sum, book) => sum + (book.chapters?.length || 1),
        0
      ),
    }));
  }, [items]);
}

function RackCard({ rack, index }) {
  const gradient = gradients[index % gradients.length];
  const previewBooks = rack.books.slice(0, 3);
  return (
    <Card className="overflow-hidden">
      <div className={`h-24 bg-gradient-to-r ${gradient}`} />
      <CardHeader className="space-y-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl">{rack.category}</CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{rack.chapterCount} chapters</Badge>
            <Badge variant="outline" className="text-[11px]">
              {rack.bookCount} books
            </Badge>
          </div>
        </div>
        <CardDescription>
          Each rack bundles books into chapter-by-chapter study paths.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2 text-sm text-muted-foreground">
          {previewBooks.map((book) => (
            <div key={book.id} className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-primary" />
              <span className="line-clamp-1">{book.title}</span>
              <span className="text-xs text-muted-foreground">
                {book.chapters?.length || 1} ch
              </span>
            </div>
          ))}
          {rack.books.length > previewBooks.length && (
            <div className="text-xs text-muted-foreground">
              +{rack.books.length - previewBooks.length} more books
            </div>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {Array.from(
            new Set(rack.books.flatMap((b) => b.tags || []))
          )
            .slice(0, 4)
            .map((tag) => (
              <Badge key={tag} variant="outline" className="text-[10px]">
                {tag}
              </Badge>
            ))}
        </div>
        <Button asChild className="gap-2 w-full">
          <Link to={`/library/rack/${rack.rackId}`}>
            Open Rack
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

export default function LibraryHome() {
  const [query, setQuery] = useState("");
  const [commandOpen, setCommandOpen] = useState(false);

  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return libraryContent;
    return libraryContent.filter((item) => {
      return (
        item.title.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        (item.tags || []).some((tag) => tag.toLowerCase().includes(q)) ||
        (item.category || "").toLowerCase().includes(q)
      );
    });
  }, [query]);

  const racks = useCategoryRacks(filteredItems);

  return (
    <div className="min-h-screen flex flex-col">
      <ScrollProgress />
      <SiteHeader onOpenCommand={() => setCommandOpen(true)} />

      <main className="flex-1">
        <section className="border-b bg-background/80 backdrop-blur">
          <Container className="py-10">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45 }}
              className="space-y-6"
            >
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <Layers className="h-4 w-4" />
                Full Library
              </div>
              <h1 className="text-4xl font-bold tracking-tight">
                Engineering Library Racks
              </h1>
              <p className="text-lg text-muted-foreground max-w-3xl">
                Browse racks by content name, then open a book for a deep dive. Each
                book contains concept-by-concept explanations, visualizations, and
                interactive tools to help you learn faster.
              </p>

              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search racks or books (e.g., GC, Streams, JVM)"
                    className="w-full rounded-xl border border-border bg-background px-10 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
                <Button asChild className="gap-2">
                  <Link to="/#library">
                    Back to Highlights
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </motion.div>
          </Container>
        </section>

        <Container className="py-10 space-y-12">
          {racks.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Library className="h-10 w-10 mx-auto mb-4 opacity-50" />
              <p>No books match your search.</p>
            </div>
          ) : (
            <div className="grid gap-6 lg:grid-cols-2">
              {racks.map((rack, index) => (
                <motion.div
                  key={rack.category}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.4 }}
                >
                  <RackCard rack={rack} index={index} />
                </motion.div>
              ))}
            </div>
          )}
        </Container>
      </main>

      <SiteFooter />
      <CommandMenu open={commandOpen} onOpenChange={setCommandOpen} />
    </div>
  );
}
