import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  FileText,
  Github,
  Linkedin,
  Home,
  Mail,
  Rocket,
  Briefcase,
  BookOpen,
  Award,
  Code2,
  GraduationCap,
  PenTool,
  Send,
} from "lucide-react";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { siteContent } from "@/content";

const SECTIONS = [
  { id: "home", label: "Home", icon: Home },
  { id: "about", label: "About", icon: Rocket },
  { id: "experience", label: "Experience", icon: Briefcase },
  { id: "education", label: "Education", icon: GraduationCap },
  { id: "projects", label: "Projects", icon: Code2 },
  { id: "library", label: "Library", icon: BookOpen },
  { id: "writing", label: "Writing", icon: PenTool },
  { id: "skills", label: "Skills", icon: Code2 },
  { id: "certifications", label: "Certifications", icon: Award },
  { id: "contact", label: "Contact", icon: Send },
];

function scrollToId(id) {
  const el = document.getElementById(id);
  if (!el) return false;
  el.scrollIntoView({ behavior: "smooth", block: "start" });
  return true;
}

export default function CommandMenu({ open, onOpenChange }) {
  const navigate = useNavigate();
  const location = useLocation();

  const goToSection = async (id) => {
    onOpenChange(false);

    if (id === "home") {
      if (location.pathname !== "/") navigate("/");
      setTimeout(() => scrollToId("home"), 50);
      return;
    }

    if (location.pathname === "/") {
      const ok = scrollToId(id);
      if (!ok) window.location.hash = `#${id}`;
      return;
    }

    navigate("/");
    setTimeout(() => {
      const ok = scrollToId(id);
      if (!ok) window.location.hash = `#${id}`;
    }, 150);
  };

  const openLink = (href) => {
    onOpenChange(false);
    if (href.startsWith("/")) {
      navigate(href);
      return;
    }
    window.open(href, "_blank", "noopener,noreferrer");
  };

  const resumeUrl = siteContent.resumeUrl;

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Search sections, links, projects..." />
      <CommandList className="max-h-[400px]">
        <CommandEmpty>
          <div className="py-6 text-center text-muted-foreground">
            <p className="text-sm">No results found.</p>
            <p className="text-xs mt-1">Try searching for a section or link.</p>
          </div>
        </CommandEmpty>

        <CommandGroup heading="Navigate">
          {SECTIONS.map((s, idx) => {
            const Icon = s.icon;
            const shortcut = idx === 0 ? "H" : undefined;
            return (
              <CommandItem
                key={s.id}
                onSelect={() => goToSection(s.id)}
                className="gap-3 cursor-pointer"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <span>{s.label}</span>
                {shortcut ? <CommandShortcut>{shortcut}</CommandShortcut> : null}
              </CommandItem>
            );
          })}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Quick links">
          <CommandItem onSelect={() => openLink("https://github.com/ArnabBir")} className="gap-3 cursor-pointer">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
              <Github className="h-4 w-4 text-muted-foreground" />
            </div>
            GitHub
          </CommandItem>
          <CommandItem onSelect={() => openLink("https://www.linkedin.com/in/arnabbir/")} className="gap-3 cursor-pointer">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
              <Linkedin className="h-4 w-4 text-muted-foreground" />
            </div>
            LinkedIn
          </CommandItem>
          <CommandItem onSelect={() => openLink(`mailto:${siteContent.email}`)} className="gap-3 cursor-pointer">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
              <Mail className="h-4 w-4 text-muted-foreground" />
            </div>
            Email
          </CommandItem>
          {resumeUrl ? (
            <CommandItem onSelect={() => openLink(resumeUrl)} className="gap-3 cursor-pointer">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
                <FileText className="h-4 w-4 text-muted-foreground" />
              </div>
              Resume
            </CommandItem>
          ) : null}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Pages">
          <CommandItem onSelect={() => openLink("/library")} className="gap-3 cursor-pointer">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </div>
            Full Library
          </CommandItem>
          <CommandItem onSelect={() => openLink("/blogs")} className="gap-3 cursor-pointer">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
              <PenTool className="h-4 w-4 text-muted-foreground" />
            </div>
            All Articles
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
