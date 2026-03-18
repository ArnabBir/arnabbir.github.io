import React from "react";
import { motion } from "framer-motion";
import { ExternalLink, Award, ArrowRight } from "lucide-react";

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
          <div className="flex items-end justify-between mb-8">
            <SectionHeading
              eyebrow="Certifications"
              title="Proof of practice"
              description="Short courses and badges demonstrating expertise and continuous learning."
            />
            <a
              href="#"
              onClick={(e) => e.preventDefault()}
              className="flex items-center gap-2 text-sm font-medium text-foreground hover:text-muted-foreground transition-colors mb-2"
            >
              View all <ArrowRight className="h-4 w-4" />
            </a>
          </div>

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

          <motion.div
            className="mt-12 rounded-lg border border-border/50 bg-gradient-to-br from-background to-muted/30 p-8 sm:p-12 text-center"
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.45, delay: 0.1 }}
          >
            <Award className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-60" />
            <h3 className="text-xl font-semibold mb-3">Keep Growing</h3>
            <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
              Earn certifications and badges to validate your skills. These credentials showcase your commitment to continuous learning and professional development.
            </p>
            <Button variant="outline" className="gap-2">
              <Award className="h-4 w-4" />
              Add More Certifications
            </Button>
          </motion.div>
        </motion.div>
      </Container>
    </section>
  );
}
