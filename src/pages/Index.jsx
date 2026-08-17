import React, { useEffect, useState } from "react";

import BackToTop from "@/components/BackToTop";
import CommandMenu from "@/components/CommandMenu";
import ScrollProgress from "@/components/ScrollProgress";
import SiteFooter from "@/components/layout/SiteFooter";
import SiteHeader from "@/components/layout/SiteHeader";
import { portfolioSections } from "@/components/sections/registry";

function SectionDivider() {
  return (
    <div className="flex items-center justify-center py-2" aria-hidden="true">
      <div className="h-px w-full max-w-xs bg-gradient-to-r from-transparent via-border to-transparent" />
    </div>
  );
}

export default function Index() {
  const [commandOpen, setCommandOpen] = useState(false);

  useEffect(() => {
    const onKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCommandOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <div className="min-h-screen noise">
      <ScrollProgress />
      <SiteHeader onOpenCommand={() => setCommandOpen(true)} />

      <main id="content" tabIndex={-1} className="relative outline-none">
        {/* Subtle background pattern */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10 bg-dot-grid opacity-[0.3] dark:opacity-[0.08] mask-fade-y"
        />

        {portfolioSections.map(({ id, component: Section }, index) => (
          <React.Fragment key={id}>
            {index > 0 ? <SectionDivider /> : null}
            <Section />
          </React.Fragment>
        ))}
      </main>

      <SiteFooter />

      <BackToTop />
      <CommandMenu open={commandOpen} onOpenChange={setCommandOpen} />
    </div>
  );
}
