import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { Menu, Search } from "lucide-react";
import { useTheme } from "next-themes";
import Container from "@/components/layout/Container";
import ThemeToggle from "@/components/layout/ThemeToggle";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import { siteContent } from "@/content";

const SECTIONS = [
  { id: "about", label: "About" },
  { id: "experience", label: "Experience" },
  { id: "education", label: "Education" },
  { id: "projects", label: "Projects" },
  { id: "library", label: "Library" },
  { id: "writing", label: "Writing" },
  { id: "skills", label: "Skills" },
  { id: "certifications", label: "Certifications" },
  { id: "contact", label: "Contact" },
];

function useActiveSection() {
  const [active, setActive] = useState("");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible.length > 0) {
          setActive(visible[0].target.id);
        }
      },
      { rootMargin: "-20% 0px -60% 0px", threshold: [0, 0.25, 0.5] },
    );

    SECTIONS.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  return active;
}

function NavLinks({ onNavigate, itemWrapper: ItemWrapper, hrefFor, activeSection }) {
  return (
    <nav className="flex flex-col gap-1 md:flex-row md:gap-1">
      {SECTIONS.map((s) => {
        const isActive = activeSection === s.id;
        const link = (
          <a
            href={hrefFor ? hrefFor(s.id) : `#${s.id}`}
            onClick={onNavigate}
            className={`relative text-sm px-3 py-1.5 rounded-full transition-all duration-300 ${
              isActive
                ? "text-foreground bg-primary/10 font-medium"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            }`}
          >
            {s.label}
          </a>
        );

        return (
          <React.Fragment key={s.id}>
            {ItemWrapper ? <ItemWrapper>{link}</ItemWrapper> : link}
          </React.Fragment>
        );
      })}
    </nav>
  );
}

export default function SiteHeader({ onOpenCommand }) {
  const { theme } = useTheme();
  const location = useLocation();
  const isDark = theme === "dark";
  const isHome = location.pathname === "/";
  const hrefFor = (id) => (isHome ? `#${id}` : `/#${id}`);
  const activeSection = useActiveSection();

  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "border-b border-border/50 glass shadow-sm"
          : "bg-transparent"
      }`}
    >
      <Container className="flex items-center justify-between py-3">
        {/* Logo */}
        <a href="#home" className="flex items-center gap-3 group">
          <img
            src="/images/logo.png"
            alt="Logo"
            className={`h-9 w-9 rounded-lg ring-1 ring-border/50 transition-transform duration-300 group-hover:scale-105 ${isDark ? "invert" : ""}`}
          />
          <span className="font-semibold tracking-tight text-foreground animated-underline">
            {siteContent.name}
          </span>
        </a>

        {/* Desktop nav */}
        <div className="hidden lg:flex items-center gap-1">
          <NavLinks hrefFor={hrefFor} activeSection={activeSection} />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Open command menu (Ctrl+K)"
            onClick={onOpenCommand}
            className="rounded-full"
          >
            <Search className="h-4 w-4" />
          </Button>
          <ThemeToggle />

          <div className="lg:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button type="button" variant="ghost" size="icon" aria-label="Open menu" className="rounded-full">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80">
                <SheetHeader>
                  <SheetTitle className="text-left">Navigate</SheetTitle>
                </SheetHeader>
                <div className="mt-8">
                  <NavLinks onNavigate={() => {}} itemWrapper={SheetClose} hrefFor={hrefFor} activeSection={activeSection} />
                </div>
                <div className="mt-10 rounded-lg bg-muted/50 p-4 text-sm text-muted-foreground">
                  Tip: press <kbd className="inline-flex items-center gap-1 rounded border bg-background px-1.5 py-0.5 text-[10px] font-semibold">Ctrl/Cmd K</kbd> for quick search.
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </Container>
    </header>
  );
}
