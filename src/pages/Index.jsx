import React, { useEffect, useState } from "react";

import CommandMenu from "@/components/CommandMenu";
import ScrollProgress from "@/components/ScrollProgress";
import SiteFooter from "@/components/layout/SiteFooter";
import SiteHeader from "@/components/layout/SiteHeader";

import About from "@/components/sections/About";
import Certifications from "@/components/sections/Certifications";
import Contact from "@/components/sections/Contact";
import Education from "@/components/sections/Education";
import Experience from "@/components/sections/Experience";
import Hero from "@/components/sections/Hero";
import Library from "@/components/sections/Library";
import Projects from "@/components/sections/Projects";
import Skills from "@/components/sections/Skills";
import Writing from "@/components/sections/Writing";

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
    <div className="min-h-screen">
      <ScrollProgress />
      <SiteHeader onOpenCommand={() => setCommandOpen(true)} />

      <main className="relative">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10 bg-grid opacity-[0.04] dark:opacity-[0.05] mask-fade-y"
        />

        <Hero />
        <About />
        <Experience />
        <Education />
        <Projects />
        <Library />
        <Writing />
        <Skills />
        <Certifications />
        <Contact />
      </main>

      <SiteFooter />

      <CommandMenu open={commandOpen} onOpenChange={setCommandOpen} />
    </div>
  );
}
