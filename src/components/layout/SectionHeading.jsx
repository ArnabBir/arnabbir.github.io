import React from "react";
import { cn } from "@/lib/utils";

export default function SectionHeading({ eyebrow, title, description, className }) {
  return (
    <div className={cn("max-w-2xl", className)}>
      {eyebrow ? (
        <div className="flex items-center gap-2">
          <span className="h-px w-5 rounded-full bg-primary" aria-hidden="true" />
          <p className="text-sm font-semibold uppercase tracking-widest text-primary">{eyebrow}</p>
        </div>
      ) : null}
      <h2 className="mt-3 text-2xl sm:text-3xl font-semibold tracking-tight">
        {title}
      </h2>
      {description ? (
        <p className="mt-3 text-base text-muted-foreground leading-relaxed">{description}</p>
      ) : null}
    </div>
  );
}
