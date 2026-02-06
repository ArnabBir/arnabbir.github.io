import React from "react";
import Container from "@/components/layout/Container";
import { siteContent } from "@/content";

export default function SiteFooter() {
  return (
    <footer className="border-t py-10">
      <Container className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-muted-foreground">
          © {new Date().getFullYear()} {siteContent.name}. Built with Vite + React + Tailwind.
        </div>
        <div className="text-sm text-muted-foreground">
          <a className="hover:text-foreground transition-colors" href={`mailto:${siteContent.email}`}>
            {siteContent.email}
          </a>
        </div>
      </Container>
    </footer>
  );
}
