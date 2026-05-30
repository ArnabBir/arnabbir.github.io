import React from "react";
import { motion } from "framer-motion";
import { ExternalLink, GraduationCap } from "lucide-react";

import Container from "@/components/layout/Container";
import SectionHeading from "@/components/layout/SectionHeading";
import { Card, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { educationContent } from "@/content";

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

function EducationCard({ e }) {
  return (
    <motion.div variants={cardVariants}>
      <Card className="group h-full overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm p-5 transition-all duration-300 hover:shadow-lg hover:border-primary/20 card-spotlight">
        <div className="flex items-start gap-4">
          {e.logo ? (
            <div className="shrink-0 rounded-xl border bg-background p-2 transition-all duration-300 group-hover:shadow-sm group-hover:border-primary/20">
              <img
                src={e.logo}
                alt={`${e.school} logo`}
                className="h-10 w-10 rounded-md object-cover"
                loading="lazy"
              />
            </div>
          ) : (
            <div className="shrink-0 rounded-xl border bg-primary/5 p-3">
              <GraduationCap className="h-6 w-6 text-primary" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base font-semibold">
              {e.website ? (
                <a href={e.website} target="_blank" rel="noopener noreferrer" className="animated-underline">
                  {e.school}
                </a>
              ) : (
                e.school
              )}
            </CardTitle>
            <p className="mt-1 text-sm text-primary font-medium">{e.degree}</p>
            {(e.start || e.end) && (
              <p className="mt-1 text-xs text-muted-foreground">
                {e.start ? e.start : ""}
                {e.start && e.end ? " — " : ""}
                {e.end ? e.end : ""}
              </p>
            )}
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {e.details?.map((d) => (
                <Badge key={d} variant="secondary" className="rounded-full text-xs px-2.5 py-0.5">
                  {d}
                </Badge>
              ))}
              {e.website && (
                <a
                  href={e.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
                >
                  <ExternalLink className="h-3 w-3" /> Website
                </a>
              )}
              {e.links?.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
                >
                  <ExternalLink className="h-3 w-3" /> {l.label}
                </a>
              ))}
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

export default function Education() {
  return (
    <section id="education" className="scroll-mt-24 py-20 sm:py-24">
      <Container>
        <SectionHeading
          eyebrow="Education"
          title="Foundations"
          description="Academic background in computer science and engineering that underpins my work in systems and distributed computing."
        />

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2"
        >
          {educationContent.map((e) => (
            <EducationCard key={`${e.school}-${e.degree}`} e={e} />
          ))}
        </motion.div>
      </Container>
    </section>
  );
}
