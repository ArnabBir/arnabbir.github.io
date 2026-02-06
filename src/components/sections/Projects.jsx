import React from "react";
import { motion } from "framer-motion";
import { ExternalLink } from "lucide-react";

import Container from "@/components/layout/Container";
import SectionHeading from "@/components/layout/SectionHeading";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { projectsContent } from "@/content";

function ProjectCard({ p }) {
  return (
    <Card className="overflow-hidden">
      {p.image ? (
        <AspectRatio ratio={16 / 9}>
          <img
            src={p.image}
            alt={p.name}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        </AspectRatio>
      ) : null}
      <CardHeader>
        <CardTitle className="text-base">{p.name}</CardTitle>
        <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{p.description}</p>
      </CardHeader>
      <CardContent>
        {p.highlights?.length ? (
          <ul className="list-disc pl-5 space-y-2 text-sm text-muted-foreground">
            {p.highlights.map((h) => (
              <li key={h}>{h}</li>
            ))}
          </ul>
        ) : null}

        {p.tags?.length ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {p.tags.map((t) => (
              <Badge key={t} variant="secondary">
                {t}
              </Badge>
            ))}
          </div>
        ) : null}
      </CardContent>
      {p.links?.length ? (
        <CardFooter className="flex flex-wrap gap-2">
          {p.links.map((l) => (
            <Button key={l.href} asChild variant="outline" size="sm">
              <a
                href={l.href}
                target={l.href.startsWith("/") ? undefined : "_blank"}
                rel={l.href.startsWith("/") ? undefined : "noopener noreferrer"}
              >
                {l.label} <ExternalLink className="ml-2 h-4 w-4" />
              </a>
            </Button>
          ))}
        </CardFooter>
      ) : null}
    </Card>
  );
}

function ProjectGrid({ items }) {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {items.map((p) => (
        <ProjectCard key={p.name} p={p} />
      ))}
    </div>
  );
}

export default function Projects() {
  const featured = projectsContent.filter((p) => p.kind === "featured" || p.featured);
  const openSource = projectsContent.filter((p) => p.kind === "open-source");
  const labs = projectsContent.filter((p) => p.kind === "lab");

  return (
    <section id="projects" className="scroll-mt-24 py-16">
      <Container>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.45 }}
        >
          <SectionHeading
            eyebrow="Projects"
            title="Things I’ve shipped (and tinkered with)"
            description="A mix of writing, open-source, and side projects. Add new items in src/content/projects.js."
          />

          <div className="mt-8">
            <Tabs defaultValue="featured">
              <TabsList className="grid w-full grid-cols-3 sm:w-fit">
                <TabsTrigger value="featured">Featured</TabsTrigger>
                <TabsTrigger value="open-source">Open source</TabsTrigger>
                <TabsTrigger value="labs">Labs</TabsTrigger>
              </TabsList>

              <TabsContent value="featured" className="mt-6">
                <ProjectGrid items={featured} />
              </TabsContent>
              <TabsContent value="open-source" className="mt-6">
                <ProjectGrid items={openSource} />
              </TabsContent>
              <TabsContent value="labs" className="mt-6">
                <ProjectGrid items={labs} />
              </TabsContent>
            </Tabs>
          </div>
        </motion.div>
      </Container>
    </section>
  );
}
