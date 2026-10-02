import React, { useState } from "react";
import { motion } from "framer-motion";
import { ExternalLink, Briefcase } from "lucide-react";

import Container from "@/components/layout/Container";
import SectionHeading from "@/components/layout/SectionHeading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { experienceContent, siteContent } from "@/content";

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

function TimelineItem({ exp, isLast }) {
  return (
    <motion.div variants={itemVariants} className="group relative flex gap-3 sm:gap-6">
      {/* Timeline line & dot */}
      <div className="hidden sm:flex flex-col items-center">
        <div className="relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border bg-card shadow-sm transition-all duration-300 group-hover:shadow-md group-hover:border-primary/30 group-hover:scale-105">
          {exp.logo ? (
            <img
              src={exp.logo}
              alt={`${exp.company} logo`}
              className="h-8 w-8 rounded-md object-contain"
              loading="lazy"
            />
          ) : (
            <Briefcase className="h-5 w-5 text-muted-foreground" />
          )}
        </div>
        {!isLast && (
          <div className="mt-2 w-px flex-1 bg-gradient-to-b from-border to-transparent" />
        )}
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1 pb-6 sm:pb-8">
        <div className="rounded-xl border border-border/70 bg-card p-5 sm:p-7 transition-colors group-hover:border-primary/30 card-spotlight">
          {/* Header */}
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h3 className="font-semibold tracking-tight text-xl">{exp.company}</h3>
              <p className="text-sm text-primary font-medium">{exp.role}</p>
            </div>
            <div className="text-left sm:text-right">
              <p className="text-sm text-muted-foreground font-medium">
                {exp.start} to {exp.end}
              </p>
              {exp.location && (
                <p className="text-xs text-muted-foreground/70 mt-0.5">{exp.location}</p>
              )}
            </div>
          </div>

          {/* Summary */}
          {exp.summary && (
            <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{exp.summary}</p>
          )}

          {/* Highlights */}
          {exp.highlights?.length > 0 && (
            <ul className="mt-4 space-y-2">
              {exp.highlights.map((h) => (
                <li key={h} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/60" />
                  <span className="leading-relaxed">{h}</span>
                </li>
              ))}
            </ul>
          )}

          {/* Tech tags */}
          {exp.tech?.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {exp.tech.map((t) => (
                <Badge key={t} variant="secondary" className="rounded-full text-xs px-2.5 py-0.5">
                  {t}
                </Badge>
              ))}
            </div>
          )}

          {/* Links */}
          {(exp.website || exp.links?.length > 0) && (
            <div className="mt-4 flex flex-wrap gap-2">
              {exp.website && (
                <Button asChild variant="outline" size="sm" className="rounded-full text-xs h-8">
                  <a href={exp.website} target="_blank" rel="noopener noreferrer">
                    Website <ExternalLink className="ml-1.5 h-3 w-3" />
                  </a>
                </Button>
              )}
              {exp.links?.map((l) => (
                <Button key={l.href} asChild variant="outline" size="sm" className="rounded-full text-xs h-8">
                  <a href={l.href} target="_blank" rel="noopener noreferrer">
                    {l.label} <ExternalLink className="ml-1.5 h-3 w-3" />
                  </a>
                </Button>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default function Experience() {
  const [showEarlierRoles, setShowEarlierRoles] = useState(false);
  const recentRoles = experienceContent.slice(0, 4);
  const visibleExperience = showEarlierRoles ? experienceContent : recentRoles;
  const hiddenRoleCount = experienceContent.length - recentRoles.length;

  return (
    <section id="experience" className="scroll-mt-24 py-20 sm:py-24">
      <Container>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <SectionHeading
            eyebrow="Experience"
            title="Where I've built impact"
            description="A timeline of roles, scope, and the kinds of problems I enjoy solving."
          />

          {siteContent.resumeUrl ? (
            <Button asChild variant="secondary" className="w-fit rounded-full">
              <a href={siteContent.resumeUrl} target="_blank" rel="noopener noreferrer">
                View resume
              </a>
            </Button>
          ) : null}
        </div>

        <motion.div
          id="experience-timeline"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
          className="mt-10"
        >
          {visibleExperience.map((exp, i) => (
            <TimelineItem
              key={`${exp.company}-${exp.role}`}
              exp={exp}
              isLast={i === visibleExperience.length - 1}
            />
          ))}
        </motion.div>
        {hiddenRoleCount > 0 ? (
          <div className="mt-2 flex justify-center">
            <Button
              type="button"
              variant="outline"
              className="rounded-full"
              aria-expanded={showEarlierRoles}
              aria-controls="experience-timeline"
              onClick={() => setShowEarlierRoles((show) => !show)}
            >
              {showEarlierRoles ? "Show recent experience" : `Show ${hiddenRoleCount} earlier roles`}
            </Button>
          </div>
        ) : null}
      </Container>
    </section>
  );
}
