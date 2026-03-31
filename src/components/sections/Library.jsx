import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { BookOpen, Clock, TrendingUp, ArrowRight, Library as LibraryIcon } from "lucide-react";

import Container from "@/components/layout/Container";
import SectionHeading from "@/components/layout/SectionHeading";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { libraryContent } from "@/content";

const CAROUSEL_OPTS = {
  align: "start",
  loop: false,
  dragFree: false,
  containScroll: "trimSnaps",
};

const difficultyColors = {
  Beginner: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  Intermediate: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  Advanced: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
};

function LibraryCard({ item }) {
  // Generate a gradient based on the item ID for consistent colors
  const gradients = [
    "from-indigo-500 via-purple-500 to-pink-500",
    "from-blue-500 via-cyan-500 to-teal-500",
    "from-purple-500 via-pink-500 to-red-500",
    "from-green-500 via-emerald-500 to-teal-500",
    "from-orange-500 via-red-500 to-pink-500",
  ];
  const gradientIndex = item.id.charCodeAt(0) % gradients.length;
  const gradient = gradients[gradientIndex];
  
  // Get first letter or icon for placeholder
  const firstLetter = item.title.charAt(0).toUpperCase();
  
  return (
    <Card className="group overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
      <AspectRatio ratio={16 / 9}>
        {item.thumbnail ? (
          <div
            className="h-full w-full bg-gradient-to-br flex items-center justify-center relative overflow-hidden"
            style={{
              backgroundImage: item.thumbnail.startsWith("/") ? `url(${item.thumbnail})` : "none",
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          >
            {!item.thumbnail.startsWith("/") && (
              <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-90`} />
            )}
            <div className="relative z-10 flex flex-col items-center justify-center p-4 text-white">
              <div className="text-6xl font-bold opacity-80 mb-2">{firstLetter}</div>
              <BookOpen className="h-8 w-8 opacity-60" />
            </div>
          </div>
        ) : (
          <div className={`h-full w-full bg-gradient-to-br ${gradient} flex flex-col items-center justify-center p-4 text-white relative overflow-hidden`}>
            {/* Decorative pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 left-0 w-32 h-32 bg-white rounded-full -translate-x-1/2 -translate-y-1/2" />
              <div className="absolute bottom-0 right-0 w-40 h-40 bg-white rounded-full translate-x-1/2 translate-y-1/2" />
            </div>
            
            {/* Content */}
            <div className="relative z-10 flex flex-col items-center justify-center">
              <div className="text-7xl font-bold mb-3 drop-shadow-lg">{firstLetter}</div>
              <div className="flex items-center gap-2 text-sm font-medium opacity-90">
                <BookOpen className="h-5 w-5" />
                <span className="uppercase tracking-wider">{item.category}</span>
              </div>
            </div>
          </div>
        )}
      </AspectRatio>
      
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-lg leading-tight">{item.title}</CardTitle>
          {item.featured && (
            <Badge variant="secondary" className="shrink-0">
              <TrendingUp className="h-3 w-3 mr-1" />
              Featured
            </Badge>
          )}
        </div>
        <CardDescription className="mt-2 line-clamp-2">{item.description}</CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="flex flex-wrap gap-2 mb-3">
          {item.tags.slice(0, 3).map((tag) => (
            <Badge key={tag} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
          {item.tags.length > 3 && (
            <Badge variant="outline" className="text-xs">
              +{item.tags.length - 3}
            </Badge>
          )}
        </div>
        
        {item.highlights?.length > 0 && (
          <ul className="text-sm text-muted-foreground space-y-1">
            {item.highlights.slice(0, 2).map((highlight, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-indigo-500 mt-1">•</span>
                <span className="line-clamp-1">{highlight}</span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
      
      <CardFooter className="flex items-center justify-between pt-0">
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          {item.difficulty && (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${difficultyColors[item.difficulty]}`}>
              {item.difficulty}
            </span>
          )}
          {item.readingTime && (
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>{item.readingTime}</span>
            </div>
          )}
        </div>
        <Button asChild variant="ghost" size="sm">
          <Link to={`/library/${item.id}`}>
            Explore
            <ArrowRight className="ml-2 h-3 w-3" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

export default function Library() {
  const featured = libraryContent.filter((item) => item.featured);

  return (
    <section id="library" className="scroll-mt-24 py-16">
      <Container>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.45 }}
        >
          <div className="flex items-end justify-between mb-8">
            <SectionHeading
              eyebrow="Engineering Library"
              title="Interactive Study Materials"
              description="Deep dives into engineering concepts with interactive illustrations, simulations, and visual explanations. Continuously updated with new materials."
            />
            <Link
              to="/library"
              className="flex items-center gap-2 text-sm font-medium text-foreground hover:text-muted-foreground transition-colors mb-2"
            >
              View all <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {featured.length > 0 && (
            <div className="mt-8 relative px-12">
              <Carousel opts={CAROUSEL_OPTS}>
                <CarouselContent>
                  {featured.map((item) => (
                    <CarouselItem
                      key={item.id}
                      className="basis-full md:basis-1/2 lg:basis-1/3"
                    >
                      <LibraryCard item={item} />
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
            <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-60" />
            <h3 className="text-xl font-semibold mb-3">Explore the Complete Library</h3>
            <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
              Browse through all study materials organized by category, with interactive simulations, detailed guides, and comprehensive resources. Filter by difficulty level and category to find exactly what you need.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button asChild className="gap-2">
                <Link to="/library">
                  <LibraryIcon className="h-4 w-4" />
                  Open Full Library
                </Link>
              </Button>
              <Button asChild variant="outline" className="gap-2">
                <Link to="/library">
                  Browse by Category
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </motion.div>
        </motion.div>
      </Container>
    </section>
  );
}
