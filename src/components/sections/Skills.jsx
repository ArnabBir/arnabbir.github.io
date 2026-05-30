import React, { useRef, useCallback } from "react";
import { motion } from "framer-motion";

import Container from "@/components/layout/Container";
import SectionHeading from "@/components/layout/SectionHeading";
import { Badge } from "@/components/ui/badge";
import { skillsContent } from "@/content";

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 16, scale: 0.97 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.45, ease: "easeOut" } },
};

const chipVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: (i) => ({
    opacity: 1,
    scale: 1,
    transition: { duration: 0.3, delay: i * 0.03, ease: "easeOut" },
  }),
};

function SkillCard({ group }) {
  const cardRef = useRef(null);

  const handleMouseMove = useCallback((e) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    card.style.setProperty("--mouse-x", `${e.clientX - rect.left}px`);
    card.style.setProperty("--mouse-y", `${e.clientY - rect.top}px`);
  }, []);

  return (
    <motion.div
      ref={cardRef}
      variants={cardVariants}
      onMouseMove={handleMouseMove}
      className="group rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm p-6 transition-all duration-300 hover:shadow-lg hover:border-primary/20 card-spotlight"
    >
      <h3 className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
        {group.category}
      </h3>
      <div className="flex flex-wrap gap-2">
        {group.items.map((s, i) => (
          <motion.div key={s} custom={i} variants={chipVariants}>
            <Badge
              variant="secondary"
              className="rounded-full px-3 py-1.5 text-xs font-normal transition-all duration-300 hover:bg-primary/10 hover:text-primary hover:shadow-sm cursor-default"
            >
              {s}
            </Badge>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

export default function Skills() {
  return (
    <section id="skills" className="scroll-mt-24 py-20 sm:py-24">
      <Container>
        <SectionHeading
          eyebrow="Skills"
          title="Tools I reach for"
          description="Languages, platforms, and practices — a curated snapshot of my technical toolkit."
        />

        <motion.div
          className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
        >
          {skillsContent.map((g) => (
            <SkillCard key={g.category} group={g} />
          ))}
        </motion.div>
      </Container>
    </section>
  );
}
