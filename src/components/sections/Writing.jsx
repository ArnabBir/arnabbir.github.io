import React from "react";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

import Container from "@/components/layout/Container";
import SectionHeading from "@/components/layout/SectionHeading";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import WritingCard from "@/components/writing/WritingCard";
import { writingContent } from "@/content";

const CAROUSEL_OPTS = {
  align: "start",
  loop: false,
  dragFree: false,
  containScroll: "trimSnaps",
};

export default function Writing() {
  return (
    <section id="writing" className="scroll-mt-24 py-16">
      <Container>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.45 }}
        >
          <div className="flex items-end justify-between">
            <SectionHeading
              eyebrow="Writing"
              title="Notes from the trenches"
              description="When something is tricky to explain, it's usually tricky to build. I like writing to clarify thinking and share what I learn."
            />
            <Link
              to="/blogs"
              className="flex items-center gap-2 text-sm font-medium text-foreground hover:text-muted-foreground transition-colors mb-2"
            >
              View all <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-8 relative px-12">
            <Carousel opts={CAROUSEL_OPTS}>
              <CarouselContent>
                {writingContent.map((w) => (
                  <CarouselItem
                    key={w.href}
                    className="basis-full md:basis-1/2 lg:basis-1/3"
                  >
                    <WritingCard w={w} />
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="absolute -left-12" />
              <CarouselNext className="absolute -right-12" />
            </Carousel>
          </div>
        </motion.div>
      </Container>
    </section>
  );
}
