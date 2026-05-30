import React, { useRef, useCallback } from "react";
import { ArrowUpRight } from "lucide-react";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const PUBLICATION_CONFIG = {
  "PhonePe Tech Blog": {
    gradient: "from-green-500 via-emerald-400 to-teal-500",
    badgeClass: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
    icon: "🟢",
  },
  Substack: {
    gradient: "from-orange-500 via-amber-400 to-yellow-500",
    badgeClass: "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300",
    icon: "✍️",
  },
  LinkedIn: {
    gradient: "from-blue-600 via-blue-400 to-cyan-500",
    badgeClass: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
    icon: "💼",
  },
  __default: {
    gradient: "from-violet-600 via-purple-400 to-cyan-500",
    badgeClass: "bg-secondary text-secondary-foreground",
    icon: "📝",
  },
};

export default function WritingCard({ w }) {
  const config = PUBLICATION_CONFIG[w.publication] || PUBLICATION_CONFIG.__default;
  const cardRef = useRef(null);

  const handleMouseMove = useCallback((e) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    card.style.setProperty("--mouse-x", `${e.clientX - rect.left}px`);
    card.style.setProperty("--mouse-y", `${e.clientY - rect.top}px`);
  }, []);

  return (
    <Card
      ref={cardRef}
      onMouseMove={handleMouseMove}
      className="group overflow-hidden flex flex-col h-full border-border/50 bg-card/50 backdrop-blur-sm transition-all duration-500 hover:-translate-y-1 hover:shadow-xl hover:border-primary/20 card-spotlight"
    >
      <AspectRatio ratio={16 / 9} className="relative overflow-hidden">
        {w.image ? (
          <img
            src={w.image}
            alt={w.title}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div
            className={`w-full h-full bg-gradient-to-br ${config.gradient} flex items-center justify-center select-none relative overflow-hidden`}
          >
            {/* Decorative circles */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 right-0 w-24 h-24 bg-white rounded-full translate-x-1/3 -translate-y-1/3" />
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-white rounded-full -translate-x-1/4 translate-y-1/4" />
            </div>
            <div className="relative text-center drop-shadow-lg">
              <div className="text-4xl mb-2">{config.icon}</div>
              <div className="text-white text-sm font-medium tracking-wide">
                {w.publication || "Writing"}
              </div>
            </div>
          </div>
        )}
        {/* Hover overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-card/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      </AspectRatio>

      <CardHeader className="pb-3">
        <div className="flex items-center gap-2 mb-2">
          <Badge className={`${config.badgeClass} rounded-full text-xs px-2.5`} variant="secondary">
            {config.icon} {w.publication || "Article"}
          </Badge>
        </div>
        <CardTitle className="line-clamp-2 text-base font-semibold leading-snug">{w.title}</CardTitle>
      </CardHeader>

      <CardContent className="flex flex-col flex-1 pb-5">
        <div className="flex flex-wrap gap-1.5 mb-3">
          {w.tag ? (
            <Badge variant="secondary" className="rounded-full text-xs px-2.5">
              {w.tag}
            </Badge>
          ) : null}
          {w.date ? (
            <Badge variant="outline" className="rounded-full text-xs px-2.5">
              {w.date}
            </Badge>
          ) : null}
        </div>

        {w.description ? (
          <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3 flex-1">
            {w.description}
          </p>
        ) : null}

        <div className="mt-4">
          <Button asChild size="sm" className="group/btn rounded-full glow-sm">
            <a href={w.href} target="_blank" rel="noopener noreferrer">
              Read Article
              <ArrowUpRight className="ml-2 h-3.5 w-3.5 transition-transform duration-300 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5" />
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
