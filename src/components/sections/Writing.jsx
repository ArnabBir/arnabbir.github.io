import React from "react";
import { motion } from "framer-motion";
import { ExternalLink, PencilLine } from "lucide-react";

import Container from "@/components/layout/Container";
import SectionHeading from "@/components/layout/SectionHeading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { writingContent } from "@/content";

function WritingCard({ w }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{w.title}</CardTitle>
        <div className="mt-2 flex flex-wrap gap-2">
          {w.publication ? <Badge variant="secondary">{w.publication}</Badge> : null}
          {w.tag ? <Badge variant="secondary">{w.tag}</Badge> : null}
          {w.date ? <Badge variant="outline">{w.date}</Badge> : null}
        </div>
      </CardHeader>
      <CardContent>
        {w.description ? (
          <p className="text-sm text-muted-foreground leading-relaxed">{w.description}</p>
        ) : null}
        <div className="mt-4">
          <Button asChild variant="outline" size="sm">
            <a href={w.href} target="_blank" rel="noopener noreferrer">
              Read <ExternalLink className="ml-2 h-4 w-4" />
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Writing() {
  return (
    <section id="writing" className="scroll-mt-24 py-16">
      <Container>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.45 }}
        >
          <SectionHeading
            eyebrow="Writing"
            title="Notes from the trenches"
            description="When something is tricky to explain, it’s usually tricky to build. I like writing to clarify thinking and share what I learn."
          />

          <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
            {writingContent.map((w) => (
              <WritingCard key={w.href} w={w} />
            ))}
          </div>

          <div className="mt-8 text-sm text-muted-foreground flex items-center gap-2">
            <PencilLine className="h-4 w-4" />
            Add more posts in <span className="font-medium">src/content/writing.js</span>.
          </div>
        </motion.div>
      </Container>
    </section>
  );
}
