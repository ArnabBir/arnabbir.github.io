import React from "react";
import { motion } from "framer-motion";

import Container from "@/components/layout/Container";
import SectionHeading from "@/components/layout/SectionHeading";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { skillsContent } from "@/content";

function SkillCard({ group }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{group.category}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {group.items.map((s) => (
            <Badge key={s} variant="secondary">
              {s}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default function Skills() {
  return (
    <section id="skills" className="scroll-mt-24 py-16">
      <Container>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.45 }}
        >
          <SectionHeading
            eyebrow="Skills"
            title="Tools I reach for"
            description="A snapshot of languages, platforms, and practices. Keep it curated — hiring managers like signal."
          />

          <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {skillsContent.map((g) => (
              <SkillCard key={g.category} group={g} />
            ))}
          </div>
        </motion.div>
      </Container>
    </section>
  );
}
