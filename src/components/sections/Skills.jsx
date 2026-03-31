import React from "react";
import { motion } from "framer-motion";

import Container from "@/components/layout/Container";
import SectionHeading from "@/components/layout/SectionHeading";
import { Badge } from "@/components/ui/badge";
import { skillsContent } from "@/content";

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};

const item = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

function SkillCard({ group }) {
  return (
    <motion.div
      variants={item}
      className="rounded-lg border bg-card p-5 hover:shadow-md transition-shadow"
    >
      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        {group.category}
      </h3>
      <div className="flex flex-wrap gap-2">
        {group.items.map((s) => (
          <Badge
            key={s}
            variant="secondary"
            className="rounded-md font-normal"
          >
            {s}
          </Badge>
        ))}
      </div>
    </motion.div>
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
            description="Languages, platforms, and practices — a curated snapshot of my technical toolkit."
          />

          <motion.div
            className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3"
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.1 }}
          >
            {skillsContent.map((g) => (
              <SkillCard key={g.category} group={g} />
            ))}
          </motion.div>
        </motion.div>
      </Container>
    </section>
  );
}
