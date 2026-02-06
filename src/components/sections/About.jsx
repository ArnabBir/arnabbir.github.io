import React from "react";
import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";

import Container from "@/components/layout/Container";
import SectionHeading from "@/components/layout/SectionHeading";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const PRINCIPLES = [
  "SLOs over vibes — reliability is a feature.",
  "Make the fast path obvious (and the safe path automatic).",
  "Measure, iterate, document, repeat.",
  "Keep it simple — until you can prove you need complexity.",
];

export default function About() {
  return (
    <section id="about" className="scroll-mt-24 py-16">
      <Container>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.45 }}
        >
          <SectionHeading
            eyebrow="About"
            title="Building systems people trust"
            description="I enjoy designing platforms that stay boring in production: predictable latency, clear failure modes, and great developer experience."
          />

          <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>What I’m focused on</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground leading-relaxed">
                <p>
                  I’ve worked on high-scale backends in payments and identity. My happy place is the
                  intersection of performance, correctness, and operability — making sure systems are
                  fast, safe, observable, and easy to evolve.
                </p>
                <p className="mt-4">
                  Outside work, I write, mentor, and build small tools that scratch an itch. I’m always
                  up for conversations around system design, platform strategy, and engineering culture.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Principles</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {PRINCIPLES.map((p) => (
                    <li key={p} className="flex items-start gap-2 text-muted-foreground">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 text-primary" />
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </motion.div>
      </Container>
    </section>
  );
}
