import React from "react";
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
  "Substack": {
    gradient: "from-orange-500 via-amber-400 to-yellow-500",
    badgeClass: "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300",
    icon: "✍️",
  },
  "LinkedIn": {
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

  return (
    <Card className="overflow-hidden flex flex-col h-full hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
      <AspectRatio ratio={16 / 9} className="relative">
        {w.image ? (
          <img
            src={w.image}
            alt={w.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div
            className={`w-full h-full bg-gradient-to-br ${config.gradient} flex items-center justify-center select-none`}
          >
            <div className="text-center drop-shadow-lg">
              <div className="text-4xl mb-2">{config.icon}</div>
              <div className="text-white text-sm font-medium">{w.publication || "Writing"}</div>
            </div>
          </div>
        )}
      </AspectRatio>

      <CardHeader>
        <div className="flex items-center gap-2 mb-2">
          <Badge className={config.badgeClass} variant="secondary">
            {config.icon} {w.publication || "Article"}
          </Badge>
        </div>
        <CardTitle className="line-clamp-2 text-base">{w.title}</CardTitle>
      </CardHeader>

      <CardContent className="flex flex-col flex-1">
        <div className="flex flex-wrap gap-2 mb-3">
          {w.tag ? <Badge variant="secondary">{w.tag}</Badge> : null}
          {w.date ? <Badge variant="outline" className="text-xs">{w.date}</Badge> : null}
        </div>

        {w.description ? (
          <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3 flex-1">
            {w.description}
          </p>
        ) : null}

        <div className="mt-4">
          <Button
            asChild
            size="sm"
            className="group"
          >
            <a href={w.href} target="_blank" rel="noopener noreferrer">
              Read Article
              <ArrowUpRight className="ml-2 h-4 w-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
