import React from "react";
import { motion } from "framer-motion";
import { ExternalLink, Award } from "lucide-react";

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
    <Card className="group h-full overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm transition-all duration-500 hover:shadow-xl hover:-translate-y-1 hover:border-primary/20 card-spotlight">
      {c.image ? (
        <AspectRatio ratio={16 / 9}>
          <div className="relative h-full w-full overflow-hidden">
            <img
              src={c.image}
              alt={c.title}
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-card/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          </div>
        </AspectRatio>
      ) : (
        <AspectRatio ratio={16 / 9}>
          <div className="h-full w-full bg-gradient-to-br from-primary/10 via-muted to-muted/50 flex items-center justify-center">
            <Award className="h-10 w-10 text-primary/30" />
          </div>
        </AspectRatio>
      )}
      <CardHeader>
        <CardTitle className="text-base line-clamp-2 font-semibold">{c.title}</CardTitle>
        <p className="mt-1.5 text-sm text-muted-foreground">
          {c.issuer}
          {c.date ? ` · ${c.date}` : ""}
        </p>
      </CardHeader>
      <CardContent>
        {c.href ? (
          <Button asChild variant="outline" size="sm" className="w-full rounded-full">
            <a href={c.href} target="_blank" rel="noopener noreferrer">
              View credential <ExternalLink className="ml-2 h-3 w-3" />
            </a>
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}

export default function Certifications() {
  return (
    <section id="certifications" className="scroll-mt-24 py-20 sm:py-24">
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
          />

          {certificationsContent.length > 0 && (
            <div className="mt-10 relative px-12">
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
                <CarouselPrevious className="absolute -left-12 rounded-full" />
                <CarouselNext className="absolute -right-12 rounded-full" />
              </Carousel>
            </div>
          )}
        </motion.div>
      </Container>
    </section>
  );
}
