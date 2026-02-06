import React from "react";
import { cn } from "@/lib/utils";

export default function SectionHeading({ eyebrow, title, description, className }) {
  return (
    <div className={cn("max-w-2xl", className)}>
      {eyebrow ? (
        <p className="text-sm font-medium text-muted-foreground">{eyebrow}</p>
      ) : null}
      <h2 className="mt-2 text-2xl sm:text-3xl font-semibold tracking-tight">
        {title}
      </h2>
      {description ? (
        <p className="mt-3 text-base text-muted-foreground leading-relaxed">{description}</p>
      ) : null}
    </div>
  );
}
