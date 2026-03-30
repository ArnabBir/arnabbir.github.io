import React from "react";
import { motion } from "framer-motion";
import { ExternalLink } from "lucide-react";

import Container from "@/components/layout/Container";
import SectionHeading from "@/components/layout/SectionHeading";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { certificationsContent } from "@/content";

const CAROUSEL_OPTS = {
  align: "start",
  loop: false,
  dragFree: false,
  containScroll: "trimSnaps",
};

function CertCard({ c }) {
  return (
    <Card className="group overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
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
        <CardTitle className="text-base line-clamp-2">{c.title}</CardTitle>
        <p className="mt-1 text-sm text-muted-foreground">
          {c.issuer}
          {c.date ? ` • ${c.date}` : ""}
        </p>
      </CardHeader>
      <CardContent>
        {c.href ? (
          <Button asChild variant="outline" size="sm" className="w-full">
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
            description="Short courses and credentials demonstrating expertise and continuous learning."
            className="mb-8"
          />

          {certificationsContent.length > 0 && (
            <div className="mt-8 relative px-12">
              <Carousel opts={CAROUSEL_OPTS}>
                <CarouselContent>
                  {certificationsContent.map((c) => (
                    <CarouselItem
                      key={`${c.title}-${c.issuer}`}
                      className="basis-full md:basis-1/2 lg:basis-1/3"
                    >
                      <CertCard c={c} />
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious className="absolute -left-12" />
                <CarouselNext className="absolute -right-12" />
              </Carousel>
            </div>
          )}
        </motion.div>
      </Container>
    </section>
  );
}
