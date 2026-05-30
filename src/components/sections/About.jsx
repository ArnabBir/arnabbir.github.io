import React, { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { CheckCircle2, Code2, Users, Zap } from "lucide-react";

import Container from "@/components/layout/Container";
import SectionHeading from "@/components/layout/SectionHeading";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const PRINCIPLES = [
  "SLOs over vibes — reliability is a feature.",
  "Make the fast path obvious (and the safe path automatic).",
  "Measure, iterate, document, repeat.",
  "Keep it simple — until you can prove you need complexity.",
];

const STATS = [
  { label: "Years of experience", value: 7, suffix: "+", icon: Code2 },
  { label: "Engineers mentored", value: 50, suffix: "+", icon: Users },
  { label: "Scale (TPS)", value: 100, suffix: "M+", icon: Zap },
];

function AnimatedCounter({ target, suffix = "", duration = 2000 }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.5 });

  useEffect(() => {
    if (!inView) return;
    let startTime = null;
    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * target));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [inView, target, duration]);

  return (
    <span ref={ref} className="tabular-nums">
      {count}
      {suffix}
    </span>
  );
}

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

export default function About() {
  return (
    <section id="about" className="scroll-mt-24 py-20 sm:py-24">
      <Container>
        <SectionHeading
          eyebrow="About"
          title="Building systems people trust"
          description="I enjoy designing platforms that stay boring in production: predictable latency, clear failure modes, and great developer experience."
        />

        {/* Stats strip */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          className="mt-10 grid grid-cols-3 gap-4"
        >
          {STATS.map(({ label, value, suffix, icon: Icon }) => (
            <motion.div
              key={label}
              variants={itemVariants}
              className="group relative rounded-xl border bg-card/50 backdrop-blur-sm p-5 text-center transition-all duration-300 hover:shadow-lg hover:border-primary/20 card-spotlight"
            >
              <div className="flex justify-center mb-3">
                <div className="rounded-full bg-primary/10 p-2.5">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
              </div>
              <div className="text-3xl sm:text-4xl font-bold tracking-tight text-gradient">
                <AnimatedCounter target={value} suffix={suffix} />
              </div>
              <div className="mt-2 text-xs sm:text-sm text-muted-foreground">{label}</div>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2"
        >
          <motion.div variants={itemVariants}>
            <Card className="h-full border-border/50 bg-card/50 backdrop-blur-sm transition-all duration-300 hover:shadow-md hover:border-primary/20 card-spotlight">
              <CardHeader>
                <CardTitle className="text-lg">What I'm focused on</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground leading-relaxed space-y-4">
                <p>
                  I've worked on high-scale backends in payments, identity, fulfillment, and data platforms.
                  My happy place is the intersection of performance, correctness, and operability —
                  making sure systems are fast, safe, observable, and easy to evolve.
                </p>
                <p>
                  Outside work, I write, mentor, and build small tools that scratch an itch. I'm always
                  up for conversations around system design, platform strategy, and engineering culture.
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card className="h-full border-border/50 bg-card/50 backdrop-blur-sm transition-all duration-300 hover:shadow-md hover:border-primary/20 card-spotlight">
              <CardHeader>
                <CardTitle className="text-lg">Principles</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-4">
                  {PRINCIPLES.map((p, i) => (
                    <motion.li
                      key={p}
                      initial={{ opacity: 0, x: -10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.4, delay: 0.3 + i * 0.1 }}
                      className="flex items-start gap-3 text-muted-foreground"
                    >
                      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                      <span className="leading-relaxed">{p}</span>
                    </motion.li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </Container>
    </section>
  );
}
