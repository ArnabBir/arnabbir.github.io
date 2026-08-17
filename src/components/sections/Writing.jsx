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
    <section id="writing" className="scroll-mt-24 py-20 sm:py-24">
      <Container>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.45 }}
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <SectionHeading
              eyebrow="Writing"
              title="Notes from the trenches"
              description="When something is tricky to explain, it's usually tricky to build. I like writing to clarify thinking and share what I learn."
            />
            <Link
              to="/blogs"
              className="group flex items-center gap-2 text-sm font-medium text-foreground transition-colors mb-2 animated-underline"
            >
              View all
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </div>

          <div className="relative mt-10 md:px-12">
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
              <div className="mt-4 flex justify-center gap-2 md:contents">
                <CarouselPrevious className="static translate-y-0 md:absolute md:-left-12 md:top-1/2 md:-translate-y-1/2" />
                <CarouselNext className="static translate-y-0 md:absolute md:-right-12 md:top-1/2 md:-translate-y-1/2" />
              </div>
            </Carousel>
          </div>
        </motion.div>
      </Container>
    </section>
  );
}
