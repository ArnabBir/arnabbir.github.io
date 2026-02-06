import React from "react";
import { motion } from "framer-motion";
import { ExternalLink } from "lucide-react";

import Container from "@/components/layout/Container";
import SectionHeading from "@/components/layout/SectionHeading";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { certificationsContent } from "@/content";

function CertCard({ c }) {
  return (
    <Card className="overflow-hidden">
      {c.image ? (
        <AspectRatio ratio={16 / 9}>
          <img
            src={c.image}
            alt={c.title}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        </AspectRatio>
      ) : null}
      <CardHeader>
        <CardTitle className="text-base">{c.title}</CardTitle>
        <p className="mt-1 text-sm text-muted-foreground">
          {c.issuer}
          {c.date ? ` • ${c.date}` : ""}
        </p>
      </CardHeader>
      <CardContent>
        {c.href ? (
          <Button asChild variant="outline" size="sm">
            <a href={c.href} target="_blank" rel="noopener noreferrer">
              View <ExternalLink className="ml-2 h-4 w-4" />
            </a>
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}

export default function Certifications() {
  return (
    <section id="certifications" className="scroll-mt-24 py-16">
      <Container>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.45 }}
        >
          <SectionHeading
            eyebrow="Certifications"
            title="Proof of practice"
            description="Short courses and badges. Add more in src/content/certifications.js."
          />

          <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {certificationsContent.map((c) => (
              <CertCard key={`${c.title}-${c.issuer}`} c={c} />
            ))}
          </div>
        </motion.div>
      </Container>
    </section>
  );
}
