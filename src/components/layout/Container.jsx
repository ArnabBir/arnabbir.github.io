import React from "react";
import { cn } from "@/lib/utils";

export default function Container({ className, ...props }) {
  return <div className={cn("container px-4", className)} {...props} />;
}
