import React from "react";
import { motion } from "framer-motion";
import { ExternalLink } from "lucide-react";

import Container from "@/components/layout/Container";
import SectionHeading from "@/components/layout/SectionHeading";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { experienceContent, siteContent } from "@/content";

function ExperienceRow({ exp, value }) {
  return (
    <AccordionItem value={value} className="border rounded-lg px-4">
      <AccordionTrigger className="hover:no-underline">
        <div className="flex w-full items-start gap-4">
          {exp.logo ? (
            <img
              src={exp.logo}
              alt={`${exp.company} logo`}
              className="mt-1 h-11 w-11 rounded-md object-contain ring-1 ring-border bg-background"
              loading="lazy"
            />
          ) : null}

          <div className="flex-1 text-left">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <div className="font-semibold tracking-tight">{exp.company}</div>
              <div className="text-sm text-muted-foreground">{exp.role}</div>
            </div>
            <div className="mt-1 text-sm text-muted-foreground">
              {exp.start} — {exp.end}{exp.location ? ` • ${exp.location}` : ""}
            </div>
          </div>
        </div>
      </AccordionTrigger>

      <AccordionContent className="pb-5">
        {exp.summary ? <p className="text-muted-foreground leading-relaxed">{exp.summary}</p> : null}

        {exp.highlights?.length ? (
          <ul className="mt-4 list-disc pl-5 space-y-2 text-muted-foreground">
            {exp.highlights.map((h) => (
              <li key={h}>{h}</li>
            ))}
          </ul>
        ) : null}

        {exp.tech?.length ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {exp.tech.map((t) => (
              <Badge key={t} variant="secondary">
                {t}
              </Badge>
            ))}
          </div>
        ) : null}

        {(exp.website || exp.links?.length) && (
          <div className="mt-5 flex flex-wrap gap-2">
            {exp.website ? (
              <Button asChild variant="outline" size="sm">
                <a href={exp.website} target="_blank" rel="noopener noreferrer">
                  Website <ExternalLink className="ml-2 h-4 w-4" />
                </a>
              </Button>
            ) : null}
            {exp.links?.map((l) => (
              <Button key={l.href} asChild variant="outline" size="sm">
                <a href={l.href} target="_blank" rel="noopener noreferrer">
                  {l.label} <ExternalLink className="ml-2 h-4 w-4" />
                </a>
              </Button>
            ))}
          </div>
        )}
      </AccordionContent>
    </AccordionItem>
  );
}

export default function Experience() {
  return (
    <section id="experience" className="scroll-mt-24 py-16">
      <Container>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.45 }}
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <SectionHeading
              eyebrow="Experience"
              title="Where I’ve built impact"
              description="A timeline of roles, scope, and the kinds of problems I enjoy solving."
            />

            {siteContent.resumeUrl ? (
              <Button asChild variant="secondary" className="w-fit">
                <a href={siteContent.resumeUrl} target="_blank" rel="noopener noreferrer">
                  View resume
                </a>
              </Button>
            ) : null}
          </div>

          <Accordion type="single" collapsible className="mt-8 space-y-3">
            {experienceContent.map((exp, i) => (
              <ExperienceRow key={`${exp.company}-${exp.role}`} exp={exp} value={`item-${i}`} />
            ))}
          </Accordion>
        </motion.div>
      </Container>
    </section>
  );
}
