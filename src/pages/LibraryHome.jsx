import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { BookOpen, Search, Layers, ArrowRight, ArrowLeft, Library } from "lucide-react";

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
  "from-violet-500 via-purple-500 to-fuchsia-500",
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

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

function RackCard({ rack, index }) {
  const gradient = gradients[index % gradients.length];
  const previewBooks = rack.books.slice(0, 3);
  return (
    <Card className="group overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm transition-all duration-500 hover:shadow-xl hover:border-primary/20 card-spotlight">
      <div className={`h-2 bg-gradient-to-r ${gradient}`} />
      <CardHeader className="space-y-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-bold">{rack.category}</CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="rounded-full text-xs">
              {rack.chapterCount} chapters
            </Badge>
            <Badge variant="outline" className="rounded-full text-[11px]">
              {rack.bookCount} books
            </Badge>
          </div>
        </div>
        <CardDescription>
          Each rack bundles books into chapter-by-chapter study paths.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2.5">
          {previewBooks.map((book) => (
            <div key={book.id} className="flex items-center gap-3 text-sm text-muted-foreground">
              <div className="flex-shrink-0 rounded-md bg-primary/10 p-1.5">
                <BookOpen className="h-3.5 w-3.5 text-primary" />
              </div>
              <span className="line-clamp-1 flex-1">{book.title}</span>
              <span className="text-xs text-muted-foreground/60 shrink-0">
                {book.chapters?.length || 1} ch
              </span>
            </div>
          ))}
          {rack.books.length > previewBooks.length && (
            <div className="text-xs text-muted-foreground/60 pl-9">
              +{rack.books.length - previewBooks.length} more books
            </div>
          )}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {Array.from(new Set(rack.books.flatMap((b) => b.tags || [])))
            .slice(0, 4)
            .map((tag) => (
              <Badge key={tag} variant="outline" className="rounded-full text-[10px] px-2">
                {tag}
              </Badge>
            ))}
        </div>
        <Button asChild className="gap-2 w-full rounded-full group/btn">
          <Link to={`/library/rack/${rack.rackId}`}>
            Open Rack
            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover/btn:translate-x-1" />
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
    <div className="min-h-screen flex flex-col noise">
      <ScrollProgress />
      <SiteHeader onOpenCommand={() => setCommandOpen(true)} />

      <main className="flex-1">
        {/* Header */}
        <section className="border-b border-border/50 relative overflow-hidden">
          {/* Background accent */}
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
            <div className="absolute top-0 left-1/3 h-[300px] w-[400px] rounded-full bg-gradient-to-br from-primary/10 via-transparent to-transparent blur-3xl" />
          </div>

          <Container className="py-12">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="space-y-6"
            >
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <Layers className="h-4 w-4" />
                <span>Full Library</span>
              </div>
              <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
                Engineering Library Racks
              </h1>
              <p className="text-lg text-muted-foreground max-w-3xl leading-relaxed">
                Browse racks by content name, then open a book for a deep dive. Each
                book contains concept-by-concept explanations, visualizations, and
                interactive tools to help you learn faster.
              </p>

              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search racks or books (e.g., GC, Streams, JVM)"
                    className="w-full rounded-full border border-border bg-background/80 backdrop-blur-sm pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-shadow"
                  />
                </div>
                <Button asChild variant="outline" className="gap-2 rounded-full group">
                  <Link to="/#library">
                    <ArrowLeft className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-1" />
                    Back to Highlights
                  </Link>
                </Button>
              </div>
            </motion.div>
          </Container>
        </section>

        <Container className="py-12">
          {racks.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">
              <Library className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p className="text-lg font-medium">No books match your search.</p>
              <p className="text-sm mt-1">Try a different keyword.</p>
            </div>
          ) : (
            <motion.div
              initial="hidden"
              animate="visible"
              transition={{ staggerChildren: 0.08 }}
              className="grid gap-6 lg:grid-cols-2"
            >
              {racks.map((rack, index) => (
                <motion.div key={rack.category} variants={cardVariants}>
                  <RackCard rack={rack} index={index} />
                </motion.div>
              ))}
            </motion.div>
          )}
        </Container>
      </main>

      <SiteFooter />
      <CommandMenu open={commandOpen} onOpenChange={setCommandOpen} />
    </div>
  );
}
