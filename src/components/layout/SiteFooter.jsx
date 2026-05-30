import React from "react";
import { motion } from "framer-motion";
import Container from "@/components/layout/Container";
import SocialIcon from "@/components/icons/SocialIcon";
import { siteContent } from "@/content";

export default function SiteFooter() {
  return (
    <footer className="relative border-t border-border/50">
      {/* Gradient line at top */}
      <div
        aria-hidden="true"
        className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent"
      />

      <Container className="py-12">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-lg font-semibold tracking-tight">{siteContent.name}</div>
            <div className="mt-1.5 text-sm text-muted-foreground">
              {siteContent.role} · {siteContent.location}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {siteContent.socials.slice(0, 5).map((s) => (
              <motion.a
                key={s.href}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={s.label}
                whileHover={{ scale: 1.15, y: -2 }}
                whileTap={{ scale: 0.95 }}
                className="inline-flex items-center justify-center h-9 w-9 rounded-full border border-border/50 text-muted-foreground hover:text-foreground hover:border-primary/30 hover:bg-primary/5 transition-colors duration-300"
              >
                <SocialIcon name={s.icon} className="h-4 w-4" />
              </motion.a>
            ))}
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-t border-border/50 pt-8">
          <p className="text-xs text-muted-foreground/70">
            &copy; {new Date().getFullYear()} {siteContent.name}. Crafted with Vite, React & Tailwind.
          </p>
          <a
            className="text-xs text-muted-foreground/70 hover:text-foreground transition-colors animated-underline"
            href={`mailto:${siteContent.email}`}
          >
            {siteContent.email}
          </a>
        </div>
      </Container>
    </footer>
  );
}
