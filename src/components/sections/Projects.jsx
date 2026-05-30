import React, { useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { ExternalLink, ArrowUpRight } from "lucide-react";

import Container from "@/components/layout/Container";
import SectionHeading from "@/components/layout/SectionHeading";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { projectsContent } from "@/content";

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

function ProjectCard({ p }) {
  const cardRef = useRef(null);

  const handleMouseMove = useCallback((e) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    card.style.setProperty("--mouse-x", `${x}px`);
    card.style.setProperty("--mouse-y", `${y}px`);
  }, []);

  return (
    <motion.div variants={cardVariants}>
      <Card
        ref={cardRef}
        onMouseMove={handleMouseMove}
        className="group h-full overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm transition-all duration-500 hover:shadow-xl hover:border-primary/20 hover:-translate-y-1 card-spotlight"
      >
        {p.image ? (
          <AspectRatio ratio={16 / 9}>
            <div className="relative h-full w-full overflow-hidden">
              <img
                src={p.image}
                alt={p.name}
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-card/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </div>
          </AspectRatio>
        ) : (
          <AspectRatio ratio={16 / 9}>
            <div className="h-full w-full bg-gradient-to-br from-primary/5 via-muted to-muted/50 flex items-center justify-center">
              <div className="text-4xl font-bold text-primary/20">{p.name.charAt(0)}</div>
            </div>
          </AspectRatio>
        )}

        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-base font-semibold tracking-tight">{p.name}</CardTitle>
            {p.links?.length > 0 && (
              <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground/50 transition-all duration-300 group-hover:text-primary group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            )}
          </div>
          <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed line-clamp-2">{p.description}</p>
        </CardHeader>

        <CardContent className="pb-3">
          {p.highlights?.length > 0 && (
            <ul className="space-y-1.5 mb-3">
              {p.highlights.slice(0, 2).map((h) => (
                <li key={h} className="flex items-start gap-2 text-xs text-muted-foreground">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary/50" />
                  <span className="line-clamp-1">{h}</span>
                </li>
              ))}
            </ul>
          )}

          {p.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {p.tags.slice(0, 4).map((t) => (
                <Badge key={t} variant="secondary" className="rounded-full text-[10px] px-2 py-0.5 font-normal">
                  {t}
                </Badge>
              ))}
              {p.tags.length > 4 && (
                <Badge variant="secondary" className="rounded-full text-[10px] px-2 py-0.5 font-normal">
                  +{p.tags.length - 4}
                </Badge>
              )}
            </div>
          )}
        </CardContent>

        {p.links?.length > 0 && (
          <CardFooter className="flex flex-wrap gap-2 pt-0">
            {p.links.map((l) => (
              <Button key={l.href} asChild variant="outline" size="sm" className="rounded-full text-xs h-8">
                <a
                  href={l.href}
                  target={l.href.startsWith("/") ? undefined : "_blank"}
                  rel={l.href.startsWith("/") ? undefined : "noopener noreferrer"}
                >
                  {l.label} <ExternalLink className="ml-1.5 h-3 w-3" />
                </a>
              </Button>
            ))}
          </CardFooter>
        )}
      </Card>
    </motion.div>
  );
}

function ProjectGrid({ items }) {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.05 }}
      className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3"
    >
      {items.map((p) => (
        <ProjectCard key={p.name} p={p} />
      ))}
    </motion.div>
  );
}

export default function Projects() {
  const featured = projectsContent.filter((p) => p.kind === "featured" || p.featured);
  const openSource = projectsContent.filter((p) => p.kind === "open-source");
  const labs = projectsContent.filter((p) => p.kind === "lab");

  return (
    <section id="projects" className="scroll-mt-24 py-20 sm:py-24">
      <Container>
        <SectionHeading
          eyebrow="Projects"
          title="Things I've shipped (and tinkered with)"
          description="A mix of production systems, open-source tools, and side projects across distributed systems, platform engineering, and interactive learning."
        />

        <div className="mt-10">
          <Tabs defaultValue="featured">
            <TabsList className="h-10 rounded-full bg-muted/50 p-1">
              <TabsTrigger value="featured" className="rounded-full text-sm px-4 data-[state=active]:shadow-sm">
                Featured
              </TabsTrigger>
              <TabsTrigger value="open-source" className="rounded-full text-sm px-4 data-[state=active]:shadow-sm">
                Open source
              </TabsTrigger>
              <TabsTrigger value="labs" className="rounded-full text-sm px-4 data-[state=active]:shadow-sm">
                Labs
              </TabsTrigger>
            </TabsList>

            <TabsContent value="featured" className="mt-8">
              <ProjectGrid items={featured} />
            </TabsContent>
            <TabsContent value="open-source" className="mt-8">
              <ProjectGrid items={openSource} />
            </TabsContent>
            <TabsContent value="labs" className="mt-8">
              <ProjectGrid items={labs} />
            </TabsContent>
          </Tabs>
        </div>
      </Container>
    </section>
  );
}
