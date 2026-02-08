import React from "react";
import { motion } from "framer-motion";
import { ExternalLink } from "lucide-react";

import Container from "@/components/layout/Container";
import SectionHeading from "@/components/layout/SectionHeading";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { educationContent } from "@/content";

function EducationCard({ e }) {
  return (
    <Card className="p-4">
      <div className="flex items-start gap-4">
        {e.logo ? (
          <img
            src={e.logo}
            alt={`${e.school} logo`}
            className="mt-0.5 h-10 w-10 rounded-md object-cover ring-1 ring-border"
            loading="lazy"
          />
        ) : null}
        <div className="flex-1 min-w-0">
          <CardTitle className="text-base">
            {e.website ? (
              <a href={e.website} target="_blank" rel="noopener noreferrer" className="hover:underline">
                {e.school}
              </a>
            ) : e.school}
          </CardTitle>
          <p className="mt-0.5 text-sm text-muted-foreground">{e.degree}</p>
          {(e.start || e.end) ? (
            <p className="mt-0.5 text-xs text-muted-foreground">
              {e.start ? e.start : ""}{e.start && e.end ? " — " : ""}{e.end ? e.end : ""}
            </p>
          ) : null}
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {e.details?.map((d) => (
              <Badge key={d} variant="secondary" className="text-xs">
                {d}
              </Badge>
            ))}
            {e.website ? (
              <a
                href={e.website}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <ExternalLink className="h-3 w-3" /> Website
              </a>
            ) : null}
            {e.links?.map((l) => (
              <a
                key={l.href}
                href={l.href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <ExternalLink className="h-3 w-3" /> {l.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}

export default function Education() {
  return (
    <section id="education" className="scroll-mt-24 py-16">
      <Container>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.45 }}
        >
          <SectionHeading
            eyebrow="Education"
            title="Foundations"
            description="A quick view of my academic background. Add more entries in src/content/education.js."
          />

          <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
            {educationContent.map((e) => (
              <EducationCard key={`${e.school}-${e.degree}`} e={e} />
            ))}
          </div>
        </motion.div>
      </Container>
    </section>
  );
}
