import React from "react";
import Container from "@/components/layout/Container";
import SocialIcon from "@/components/icons/SocialIcon";
import { siteContent } from "@/content";

export default function SiteFooter() {
  return (
    <footer className="border-t bg-muted/20">
      <Container className="py-10">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-sm font-medium">{siteContent.name}</div>
            <div className="mt-1 text-xs text-muted-foreground">
              {siteContent.role} &middot; {siteContent.location}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {siteContent.socials.slice(0, 5).map((s) => (
              <a
                key={s.href}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={s.label}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <SocialIcon name={s.icon} className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between border-t pt-6">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} {siteContent.name}. Built with Vite · React · Tailwind.
          </p>
          <a
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            href={`mailto:${siteContent.email}`}
          >
            {siteContent.email}
          </a>
        </div>
      </Container>
    </footer>
  );
}
