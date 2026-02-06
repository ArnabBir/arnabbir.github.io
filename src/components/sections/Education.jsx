import React from "react";
import { motion } from "framer-motion";

import Container from "@/components/layout/Container";
import SectionHeading from "@/components/layout/SectionHeading";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { educationContent } from "@/content";

function EducationCard({ e }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start gap-4">
          {e.logo ? (
            <img
              src={e.logo}
              alt={`${e.school} logo`}
              className="mt-1 h-11 w-11 rounded-md object-cover ring-1 ring-border"
              loading="lazy"
            />
          ) : null}
          <div className="flex-1">
            <CardTitle className="text-base">{e.school}</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">{e.degree}</p>
            {(e.start || e.end) ? (
              <p className="mt-1 text-sm text-muted-foreground">
                {e.start ? e.start : ""}{e.start && e.end ? " — " : ""}{e.end ? e.end : ""}
              </p>
            ) : null}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {e.details?.length ? (
          <div className="flex flex-wrap gap-2">
            {e.details.map((d) => (
              <Badge key={d} variant="secondary">
                {d}
              </Badge>
            ))}
          </div>
        ) : null}
      </CardContent>
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
