import React from "react";
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
  { id: "projects", label: "Projects" },
  { id: "library", label: "Library" },
  { id: "writing", label: "Writing" },
  { id: "skills", label: "Skills" },
  { id: "education", label: "Education" },
  { id: "certifications", label: "Certifications" },
  { id: "contact", label: "Contact" },
];

function NavLinks({ onNavigate, itemWrapper: ItemWrapper }) {
  return (
    <nav className="flex flex-col gap-1 md:flex-row md:gap-6">
      {SECTIONS.map((s) => (
        <React.Fragment key={s.id}>
          {ItemWrapper ? (
            <ItemWrapper>
              <a
                href={`#${s.id}`}
                onClick={onNavigate}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {s.label}
              </a>
            </ItemWrapper>
          ) : (
            <a
              href={`#${s.id}`}
              onClick={onNavigate}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {s.label}
            </a>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}

export default function SiteHeader({ onOpenCommand }) {
  const { theme } = useTheme();
  const logoSrc = theme === "dark" ? "/images/logo-dark.png" : "/images/logo.png";

  return (
    <header className="sticky top-0 z-50 border-b bg-background/70 backdrop-blur">
      <Container className="flex items-center justify-between py-3">
        <div className="flex items-center gap-3">
          <img
            src={logoSrc}
            alt="Logo"
            className="h-9 w-9 rounded-md ring-1 ring-border"
          />
          <a href="#home" className="font-semibold tracking-tight">
            {siteContent.name}
          </a>
        </div>

        <div className="hidden md:flex items-center gap-6">
          <NavLinks />
        </div>

        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Open command menu"
            onClick={onOpenCommand}
          >
            <Search className="h-4 w-4" />
          </Button>
          <ThemeToggle />

          <div className="md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button type="button" variant="ghost" size="icon" aria-label="Open menu">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right">
                <SheetHeader>
                  <SheetTitle>Navigate</SheetTitle>
                </SheetHeader>
                <div className="mt-6">
                  <NavLinks onNavigate={() => {}} itemWrapper={SheetClose} />
                </div>
                <div className="mt-8 text-sm text-muted-foreground">
                  Tip: press <span className="font-semibold">Ctrl/⌘ K</span> for search.
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </Container>
    </header>
  );
}
